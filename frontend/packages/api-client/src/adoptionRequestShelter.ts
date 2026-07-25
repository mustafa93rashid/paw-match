/**
 * Shelter-employee/superadmin endpoint functions for the shelter-facing
 * subset of src/routes/adoptionRequest.route.js. Kept separate from
 * ./adoptionRequests.ts, which is documented there as the adopter-facing
 * subset only.
 */
import type { AxiosInstance } from "axios";
import type { AdoptionRequestStatus, ShelterAdoptionRequest } from "@paw-match/types";

export interface ShelterAdoptionRequestsFilters {
  animalId?: string;
  adopterId?: string;
  status?: AdoptionRequestStatus;
}

/** GET /adoptions/shelter — shelterId is forced server-side to the caller's own shelter for a shelterEmployee (the shelterId query param is superadmin-only); no free-text search, no pagination. */
export const getShelterAdoptionRequests = async (
  client: AxiosInstance,
  filters: ShelterAdoptionRequestsFilters = {},
): Promise<ShelterAdoptionRequest[]> => {
  const { data } = await client.get<{ success: true; message: string; data: ShelterAdoptionRequest[] }>(
    "/adoptions/shelter",
    { params: filters },
  );
  return data.data;
};

/** PATCH /adoptions/:id/status — body status restricted by the backend to "interview" or "homeCheck" only, and only from the immediately-prior stage (pendingReview -> interview -> homeCheck). */
export const updateAdoptionRequestStatus = async (
  client: AxiosInstance,
  id: string,
  status: "interview" | "homeCheck",
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/status`,
    { status },
  );
  return data.data;
};

/** PATCH /adoptions/:id/approve — only valid from status "homeCheck". Rejects every other active request for the same animal automatically. */
export const approveAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/approve`,
  );
  return data.data;
};

/** PATCH /adoptions/:id/reject — body rejectionReason required (3-1000 chars); only valid from pendingReview|interview|homeCheck. */
export const rejectAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
  rejectionReason: string,
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/reject`,
    { rejectionReason },
  );
  return data.data;
};

/** PATCH /adoptions/:id/complete — only valid from status "approved". */
export const completeAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/complete`,
  );
  return data.data;
};

/** PATCH /adoptions/:id/cancel-approval — body reason required (3-1000 chars); only valid from status "approved"; ends the request in status "rejected" (reuses that status value, not a distinct one). */
export const cancelApprovedAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
  reason: string,
): Promise<ShelterAdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: ShelterAdoptionRequest }>(
    `/adoptions/${id}/cancel-approval`,
    { reason },
  );
  return data.data;
};
