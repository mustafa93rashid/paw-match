import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  getApiStatus,
  getNearestShelters,
  getPublicShelters,
  getShelterById,
  type NearestSheltersParams,
  type PublicSheltersParams,
} from "@paw-match/api-client";
import type { PublicShelter } from "@paw-match/types";

/**
 * Query hook factory for shelter data. Takes the app's configured Axios
 * instance so this package stays decoupled from any single app's baseURL.
 */
export const createShelterHooks = (client: AxiosInstance) => {
  const useShelters = (filters: PublicSheltersParams = {}) =>
    useQuery({
      queryKey: ["shelters", "public", filters],
      queryFn: () => getPublicShelters(client, filters),
    });

  /**
   * Public (unauthenticated) fallback: `GET /shelters/:id` requires auth on
   * the backend, so shelter details are derived from the same unfiltered
   * public list query instead — meaning a shelter that isn't currently
   * public (pending/inactive) is indistinguishable from an invalid id, and
   * reviews/animals/rating are unavailable here. Pass `undefined` to
   * disable (e.g. when the user is authenticated and useShelterDetailAuthed
   * should run instead).
   */
  const useShelterDetail = (id: string | undefined) =>
    useQuery({
      queryKey: ["shelters", "public", {}],
      queryFn: () => getPublicShelters(client, {}),
      staleTime: 60_000,
      enabled: Boolean(id),
      select: (shelters: PublicShelter[]) =>
        shelters.find((shelter) => shelter._id === id),
    });

  /** Authenticated detail: richer data (reviews, rating, shelter's animals). */
  const useShelterDetailAuthed = (id: string | undefined) =>
    useQuery({
      queryKey: ["shelters", "authed-detail", id],
      queryFn: () => getShelterById(client, id as string),
      enabled: Boolean(id),
      retry: (failureCount, error) => {
        const status = getApiStatus(error);
        if (status && [401, 403, 404].includes(status)) {
          return false;
        }
        return failureCount < 2;
      },
    });

  const useNearestShelters = (params: NearestSheltersParams | null) =>
    useQuery({
      queryKey: ["shelters", "nearest", params],
      queryFn: () => {
        if (!params) {
          throw new Error("Location is required to search nearby shelters");
        }

        return getNearestShelters(client, params);
      },
      enabled: params !== null,
    });

  return {
    useShelters,
    useShelterDetail,
    useShelterDetailAuthed,
    useNearestShelters,
  };
};
