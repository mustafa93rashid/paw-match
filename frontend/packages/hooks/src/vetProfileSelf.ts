import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { getMyVetProfile, updateMyVetProfile } from "@paw-match/api-client";
import type { UpdateVetProfilePayload } from "@paw-match/types";

export const createVetProfileSelfHooks = (client: AxiosInstance) => {
  /** Pass `enabled: false` when the caller isn't a vet (e.g. the shared Reviews page). */
  const useMyVetProfile = (options: { enabled?: boolean } = {}) =>
    useQuery({
      queryKey: ["vetProfile", "me"],
      queryFn: () => getMyVetProfile(client),
      enabled: options.enabled ?? true,
    });

  const useUpdateMyVetProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: UpdateVetProfilePayload) => updateMyVetProfile(client, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vetProfile", "me"] }),
    });
  };

  return { useMyVetProfile, useUpdateMyVetProfile };
};
