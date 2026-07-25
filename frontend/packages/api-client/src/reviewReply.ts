/**
 * Shelter-employee/vet endpoint function for PUT /reviews/:id/reply. Kept
 * separate from ./reviews.ts, which is documented there as the adopter-
 * facing subset only (that file's header comment already flags this exact
 * route as "shelterEmployee/vet-only and out of scope for this site").
 */
import type { AxiosInstance } from "axios";
import type { Review } from "@paw-match/types";

/**
 * PUT /reviews/:id/reply — 404 if the review doesn't exist; 409 if it
 * already has a reply (only one reply is ever allowed — no edit/delete path
 * exists anywhere on the backend). Gating differs by role server-side (vet:
 * targetType "vet" + targetId === own user id; shelterEmployee: targetType
 * "shelter" + an active ShelterEmployeeProfile linked to that shelter) —
 * both surface as 403 on mismatch, never re-validated client-side.
 */
export const replyToReview = async (
  client: AxiosInstance,
  id: string,
  text: string,
): Promise<Review> => {
  const { data } = await client.put<{ success: true; message: string; data: Review }>(
    `/reviews/${id}/reply`,
    { text },
  );
  return data.data;
};
