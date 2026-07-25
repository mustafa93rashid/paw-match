import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@paw-match/ui";
import { useAuth } from "../../lib/auth";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { paths } from "../../routes/paths";

const DASHBOARD_ROLES = ["superadmin", "shelterEmployee", "vet"] as const;

export type DashboardDenialReason = "wrong-role" | "inactive" | "missing-profile" | "not-manager";

/**
 * Top-level Dashboard access guard — nested inside RequireAuth, so `user` is
 * guaranteed non-null here. Checks role AND, for shelterEmployee, the
 * authoritative ShelterEmployeeProfile.position (never a cached/JWT-only
 * role): only an active Manager may enter. A regular Employee is blocked
 * from the entire Dashboard, not just individual pages — this route wraps
 * everything under DashboardLayout, so nothing protected ever renders
 * (not even briefly) before the redirect. Missing/errored profile or a
 * missing position both deny access by default; neither is ever treated as
 * "assume Manager."
 */
export const RequireDashboardAccess = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const isShelterEmployee = user?.role === "shelterEmployee";

  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile({ enabled: isShelterEmployee });

  if (isAuthLoading) {
    return <Spinner label="Checking your session…" />;
  }

  if (!user) {
    return <Navigate to={paths.login} replace state={{ from: location }} />;
  }

  if (!(DASHBOARD_ROLES as readonly string[]).includes(user.role)) {
    return <Navigate to={paths.unauthorized} replace state={{ reason: "wrong-role" satisfies DashboardDenialReason }} />;
  }

  if (!user.isActive) {
    return <Navigate to={paths.unauthorized} replace state={{ reason: "inactive" satisfies DashboardDenialReason }} />;
  }

  if (isShelterEmployee) {
    if (profileQuery.isLoading) {
      return <Spinner label="Checking your permissions…" />;
    }

    if (profileQuery.isError || !profileQuery.data) {
      return (
        <Navigate to={paths.unauthorized} replace state={{ reason: "missing-profile" satisfies DashboardDenialReason }} />
      );
    }

    const profile = profileQuery.data;
    const isActiveManager = profile.isActive && String(profile.position).toLowerCase() === "manager";

    if (!isActiveManager) {
      return (
        <Navigate to={paths.unauthorized} replace state={{ reason: "not-manager" satisfies DashboardDenialReason }} />
      );
    }
  }

  return <Outlet />;
};
