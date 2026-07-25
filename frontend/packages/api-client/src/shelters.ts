/**
 * Endpoint functions for src/routes/shelter.route.js +
 * src/controllers/shelter.controller.js:
 *
 *   GET /shelters          — getPublicShelters (public, no auth; approved/verified/active only)
 *   GET /shelters/nearest  — getNearestShelters (public, no auth; same filter)
 *   GET /shelters/:id      — getShelterById (requires auth for every access tier,
 *                             including its "public" tier — only usable once
 *                             authenticated; see getShelterById below)
 */
import type { AxiosInstance } from "axios";
import type {
  ApiListResponse,
  AuthedShelterDetail,
  AuthedShelterResponse,
  NearestShelter,
  PublicShelter,
  Species,
} from "@paw-match/types";

export interface PublicSheltersParams {
  city?: string;
  species?: Species;
  search?: string;
}

export interface NearestSheltersParams {
  lng: number;
  lat: number;
  /** Search radius in meters (backend caps this at 100000). */
  distance: number;
}

export const getPublicShelters = async (
  client: AxiosInstance,
  params: PublicSheltersParams = {},
): Promise<PublicShelter[]> => {
  const { data } = await client.get<ApiListResponse<PublicShelter>>(
    "/shelters",
    { params },
  );

  return data.data;
};

export const getNearestShelters = async (
  client: AxiosInstance,
  params: NearestSheltersParams,
): Promise<NearestShelter[]> => {
  const { data } = await client.get<ApiListResponse<NearestShelter>>(
    "/shelters/nearest",
    { params },
  );

  return data.data;
};

/**
 * Requires auth. An authenticated adopter always lands in the controller's
 * "public" accessLevel branch (the shelterEmployee/superadmin branches are
 * dashboard-only concerns, not modeled here) — richer than the plain list:
 * adds averageRating, totalReviews, populated animalIds, and reviews.
 */
export const getShelterById = async (
  client: AxiosInstance,
  id: string,
): Promise<AuthedShelterDetail> => {
  const { data } = await client.get<AuthedShelterResponse>(`/shelters/${id}`);

  return data.data;
};
