import { Outlet } from "react-router-dom";
import { Building2 } from "lucide-react";
import { EmptyState, ErrorState, Spinner } from "@paw-match/ui";
import { useAuth } from "../../lib/auth";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";

/**
 * Wraps Animals / Adoption Requests (and any other page that requires full
 * shelter operations) for the Manager role. RequireDashboardAccess already
 * guarantees an active Manager reached this point, but a Manager's shelter
 * can still be unassigned, pending, rejected, or inactive — none of those
 * unlock "manage animals" / "add or remove employees" per the approved
 * product rules, even though the backend itself doesn't gate every one of
 * these actions on shelter status (e.g. updateShelter doesn't). This is a
 * deliberately more conservative frontend rule than the backend's minimum,
 * which is allowed — it never has to be looser than the backend.
 * Cache-shared with MyShelterPage's own queries, so this never issues an
 * extra network request beyond what the page already needs.
 *
 * Super Admin has no ShelterEmployeeProfile at all and manages every
 * shelter directly (the backend's canManageAnimal grants superadmin access
 * regardless of shelter status) — this "my own shelter must be approved"
 * check is meaningless for that role, so it's bypassed entirely rather than
 * querying an endpoint that's shelterEmployee-only.
 */
export const RequireApprovedShelter = () => {
  const auth = useAuth();
  const isSuperAdmin = auth.user?.role === "superadmin";

  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile({ enabled: !isSuperAdmin });
  const shelterId = profileQuery.data?.shelterId?._id;
  const shelterQuery = shelterEmployeeShelterHooks.useMyShelterDetail(isSuperAdmin ? undefined : shelterId);

  if (isSuperAdmin) {
    return <Outlet />;
  }

  if (profileQuery.isLoading || (Boolean(shelterId) && shelterQuery.isLoading)) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Checking your shelter's status…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  if (!shelterId) {
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6" aria-hidden />}
        title="No shelter yet"
        description="Create your shelter from My Shelter before you can manage animals or adoption requests."
      />
    );
  }

  if (shelterQuery.isError || !shelterQuery.data) {
    return <ErrorState title="Couldn't load your shelter" onRetry={() => shelterQuery.refetch()} />;
  }

  const shelter = shelterQuery.data;
  const isApproved = shelter.verificationStatus === "approved" && shelter.isVerified && shelter.isActive;

  if (!isApproved) {
    const title =
      shelter.verificationStatus === "rejected"
        ? "Your shelter application was rejected"
        : shelter.verificationStatus === "pending"
          ? "Waiting for Super Admin approval"
          : "Your shelter is currently inactive";

    const description =
      shelter.verificationStatus === "rejected"
        ? shelter.rejectionReason ?? "Edit your shelter details from My Shelter to resubmit for approval."
        : shelter.verificationStatus === "pending"
          ? "This page unlocks once a Super Admin approves your shelter. Check My Shelter for the current status."
          : "Reactivating your shelter requires a Super Admin. Check My Shelter for details.";

    return <EmptyState icon={<Building2 className="h-6 w-6" aria-hidden />} title={title} description={description} />;
  }

  return <Outlet />;
};
