import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  getAllShelterEmployeeProfilesAdmin,
  getAvailableShelterEmployees,
  updateEmployeeWorkData,
} from "@paw-match/api-client";
import type { UpdateEmployeeWorkDataPayload } from "@paw-match/types";

export const createShelterEmployeeAdminHooks = (client: AxiosInstance) => {
  const useAllShelterEmployeeProfilesAdmin = () =>
    useQuery({
      queryKey: ["shelterEmployeeProfiles", "admin"],
      queryFn: () => getAllShelterEmployeeProfilesAdmin(client),
    });

  /** Shared by the superadmin Manage Employees modal and a shelterEmployee Manager's team modal — 403s server-side for a non-manager caller. */
  const useAvailableShelterEmployees = (search: string) =>
    useQuery({
      queryKey: ["shelterEmployeeProfiles", "available", search],
      queryFn: () => getAvailableShelterEmployees(client, search || undefined),
    });

  const useUpdateEmployeeWorkData = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ userId, payload }: { userId: string; payload: UpdateEmployeeWorkDataPayload }) =>
        updateEmployeeWorkData(client, userId, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shelterEmployeeProfiles"] });
        queryClient.invalidateQueries({ queryKey: ["shelters"] });
        // Harmless no-op unless the promoted/demoted user happens to share
        // this session (e.g. same-session testing) — real cross-user
        // freshness relies on the default staleTime:0 refetch-on-mount.
        queryClient.invalidateQueries({ queryKey: ["shelterEmployeeProfile", "me"] });
      },
    });
  };

  return { useAllShelterEmployeeProfilesAdmin, useAvailableShelterEmployees, useUpdateEmployeeWorkData };
};
