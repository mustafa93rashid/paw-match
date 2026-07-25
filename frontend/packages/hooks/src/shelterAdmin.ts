import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  approveShelter,
  assignShelterEmployee,
  getAllSheltersAdmin,
  permanentlyDeleteShelter,
  rejectShelter,
  toggleShelterStatus,
  unassignShelterEmployee,
  type AdminSheltersFilters,
} from "@paw-match/api-client";

/**
 * Query hook factory for Super-Admin shelter management. Only
 * verificationStatus/isActive/city are ever sendable to the backend —
 * search/sort/pagination happen client-side against this cached list (see
 * apps/dashboard/src/pages/superadmin/SheltersPage.tsx).
 */
export const createShelterAdminHooks = (client: AxiosInstance) => {
  const adminSheltersKey = (filters: AdminSheltersFilters) => ["shelters", "admin", filters] as const;

  const useAdminShelters = (filters: AdminSheltersFilters = {}, options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: adminSheltersKey(filters),
      queryFn: () => getAllSheltersAdmin(client, filters),
      enabled: options.enabled ?? true,
    });

  const invalidateAdminShelters = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["shelters", "admin"] });

  const useApproveShelter = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => approveShelter(client, id),
      onSuccess: () => invalidateAdminShelters(queryClient),
    });
  };

  const useRejectShelter = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectShelter(client, id, reason),
      onSuccess: () => invalidateAdminShelters(queryClient),
    });
  };

  const useToggleShelterStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => toggleShelterStatus(client, id),
      onSuccess: () => invalidateAdminShelters(queryClient),
    });
  };

  const useDeleteShelterPermanently = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => permanentlyDeleteShelter(client, id),
      onSuccess: () => invalidateAdminShelters(queryClient),
    });
  };

  // Assignment changes both the shelter's `employees` array and the
  // profile's `shelterId` — invalidate both queries so the Manage Employees
  // modal's "current members" and "available" derivations refetch together.
  // These two mutations are usable by both superadmin (Manage Employees
  // modal, keyed ["shelters","admin",...]) and a shelterEmployee manager
  // (their own shelter detail, keyed ["shelters","employee-detail",...]) —
  // invalidating the bare ["shelters"] prefix covers both callers' caches
  // regardless of which one performed the mutation.
  const invalidateShelterEmployeeProfiles = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["shelterEmployeeProfiles", "admin"] });

  const useAssignShelterEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ shelterId, employeeId }: { shelterId: string; employeeId: string }) =>
        assignShelterEmployee(client, shelterId, employeeId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shelters"] });
        invalidateShelterEmployeeProfiles(queryClient);
      },
    });
  };

  const useUnassignShelterEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ shelterId, employeeId }: { shelterId: string; employeeId: string }) =>
        unassignShelterEmployee(client, shelterId, employeeId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shelters"] });
        invalidateShelterEmployeeProfiles(queryClient);
      },
    });
  };

  return {
    useAdminShelters,
    useApproveShelter,
    useRejectShelter,
    useToggleShelterStatus,
    useDeleteShelterPermanently,
    useAssignShelterEmployee,
    useUnassignShelterEmployee,
  };
};
