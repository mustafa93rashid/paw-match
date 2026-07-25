import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  approveStaffApplication,
  getStaffApplicationById,
  getStaffApplications,
  rejectStaffApplication,
  resendActivationEmail,
  updateStaffApplication,
  type StaffApplicationsFilters,
} from "@paw-match/api-client";
import type { UpdateStaffApplicationPayload } from "@paw-match/types";

/**
 * Query/mutation hook factory for Super-Admin staff-application review.
 * Mirrors createShelterAdminHooks's shape: no server-side pagination, list
 * filters map to real backend query params.
 */
export const createStaffApplicationAdminHooks = (client: AxiosInstance) => {
  const applicationsKey = (filters: StaffApplicationsFilters) =>
    ["staffApplications", "admin", filters] as const;

  const useStaffApplications = (filters: StaffApplicationsFilters = {}) =>
    useQuery({
      queryKey: applicationsKey(filters),
      queryFn: () => getStaffApplications(client, filters),
    });

  const useStaffApplication = (id: string | undefined, options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["staffApplications", "admin", "detail", id],
      queryFn: () => getStaffApplicationById(client, id as string),
      enabled: Boolean(id) && (options.enabled ?? true),
    });

  const invalidateStaffApplications = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["staffApplications", "admin"] });

  const useApproveStaffApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => approveStaffApplication(client, id),
      onSuccess: () => {
        invalidateStaffApplications(queryClient);
        // Approval creates a real User (and Shelter, for a manager
        // application) — the relevant admin lists must refresh too.
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["shelters", "admin"] });
      },
    });
  };

  const useRejectStaffApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        rejectStaffApplication(client, id, reason),
      onSuccess: () => invalidateStaffApplications(queryClient),
    });
  };

  /** PATCH /staff-applications/:id — 409 if not currently "pending" (surfaced via the mutation's error, not pre-checked here). */
  const useUpdateStaffApplication = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffApplicationPayload }) =>
        updateStaffApplication(client, id, payload),
      onSuccess: () => invalidateStaffApplications(queryClient),
    });
  };

  /** Same public POST /staff-applications/resend-activation endpoint the applicant's own activation page uses — this is just a Dashboard-triggered convenience call, not a separate superadmin-only endpoint. */
  const useResendActivation = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (email: string) => resendActivationEmail(client, { email }),
      onSuccess: () => invalidateStaffApplications(queryClient),
    });
  };

  return {
    useStaffApplications,
    useStaffApplication,
    useApproveStaffApplication,
    useRejectStaffApplication,
    useUpdateStaffApplication,
    useResendActivation,
  };
};
