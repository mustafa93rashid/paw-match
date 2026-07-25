import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { Button, Container, EmptyState } from "@paw-match/ui";
import { useAuth } from "../lib/auth";
import { paths } from "../routes/paths";
import type { DashboardDenialReason } from "../components/guards/RequireDashboardAccess";

const descriptionByReason: Record<DashboardDenialReason, string> = {
  "wrong-role": "Your account isn't a shelter, veterinarian, or admin account, so there's nothing to show here.",
  inactive: "Your account has been deactivated. Contact a Super Admin if you believe this is a mistake.",
  "missing-profile":
    "Your account is configured as a shelter employee, but no employment profile was found. Contact a Super Admin to fix this.",
  "not-manager": "Your account does not have permission to access the dashboard. Only shelter managers, veterinarians, and admins can sign in here.",
};

/**
 * Reached when an authenticated user's role — or, for a shelterEmployee,
 * their ShelterEmployeeProfile.position — doesn't grant Dashboard access
 * (see RequireDashboardAccess). Deliberately NOT wrapped in RequireGuestOnly
 * or RequireRole — it must always render without redirecting again, or an
 * account without access would bounce forever between this page, "/", and
 * "/login".
 */
const UnauthorizedPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const reason = (location.state as { reason?: DashboardDenialReason } | null)?.reason;
  const description = reason
    ? descriptionByReason[reason]
    : "Your account does not have permission to access the dashboard.";

  const handleSignOut = async () => {
    await auth.logout();
    queryClient.clear();
    navigate(paths.login, { replace: true });
  };

  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <EmptyState
        icon={<ShieldAlert className="h-6 w-6" aria-hidden />}
        title="This account doesn't have Dashboard access"
        description={description}
        action={<Button onClick={handleSignOut}>Sign out</Button>}
      />
    </Container>
  );
};

export default UnauthorizedPage;
