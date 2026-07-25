/**
 * Vet-only self-service endpoint functions for
 * src/routes/profiles/vetProfile.routes.js's GET /me and PUT /me. Kept
 * separate from ./vetProfiles.ts, which is documented there as the
 * general-read (any authenticated role) subset only.
 */
import type { AxiosInstance } from "axios";
import type { UpdateVetProfilePayload, VetProfile } from "@paw-match/types";

/** GET /vet-profile/me — 404 if no profile exists. Includes an embedded reviews array (already-published reviews targeting this vet). */
export const getMyVetProfile = async (client: AxiosInstance): Promise<VetProfile> => {
  const { data } = await client.get<{ success: true; message: string; data: VetProfile }>(
    "/vet-profile/me",
  );
  return data.data;
};

/** PUT /vet-profile/me — whitelisted fields only (specialization/bio/experienceYears/availableDays/consultationTypes); 400 if any other field is present or if the body is empty. */
export const updateMyVetProfile = async (
  client: AxiosInstance,
  payload: UpdateVetProfilePayload,
): Promise<VetProfile> => {
  const { data } = await client.put<{ success: true; message: string; data: VetProfile }>(
    "/vet-profile/me",
    payload,
  );
  return data.data;
};
