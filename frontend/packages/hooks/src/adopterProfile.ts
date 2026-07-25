import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  getAdopterProfileByUserId,
  getAllAdopterProfiles,
  getMyAdopterProfile,
  isApiError,
  updateMyAdopterProfile,
} from "@paw-match/api-client";
import type { UpdateAdopterProfilePayload } from "@paw-match/types";

export const createAdopterProfileHooks = (client: AxiosInstance) => {
  /** `data` is `null` when the adopter hasn't saved a profile yet (backend 404) — not an error. */
  const useMyAdopterProfile = () =>
    useQuery({
      queryKey: ["adopterProfile", "me"],
      queryFn: async () => {
        try {
          return await getMyAdopterProfile(client);
        } catch (error) {
          if (isApiError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      },
    });

  const useUpdateAdopterProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (payload: UpdateAdopterProfilePayload) =>
        updateMyAdopterProfile(client, payload),
      onSuccess: (profile) => {
        queryClient.setQueryData(["adopterProfile", "me"], profile);
        // Let the adopter retry matching immediately with fresh profile data.
        queryClient.invalidateQueries({ queryKey: ["matching"] });
      },
    });
  };

  /** Super Admin's "Adopters" list — GET /adopter-profile has no query params, filtering happens client-side. */
  const useAllAdopterProfiles = () =>
    useQuery({
      queryKey: ["adopterProfile", "all"],
      queryFn: () => getAllAdopterProfiles(client),
    });

  /**
   * Super Admin and Shelter Employee detail lookup. `data` is `null` when
   * the target adopter hasn't saved a profile yet (backend 404) — not an
   * error, same convention as useMyAdopterProfile.
   */
  const useAdopterProfileByUserId = (userId: string | undefined) =>
    useQuery({
      queryKey: ["adopterProfile", "byUserId", userId],
      queryFn: async () => {
        try {
          return await getAdopterProfileByUserId(client, userId as string);
        } catch (error) {
          if (isApiError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      },
      enabled: Boolean(userId),
    });

  return {
    useMyAdopterProfile,
    useUpdateAdopterProfile,
    useAllAdopterProfiles,
    useAdopterProfileByUserId,
  };
};
