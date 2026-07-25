/**
 * Endpoint functions for src/routes/adoptionRequest.route.js — adopter-relevant
 * subset only (create, list own, cancel). Mounted at /api/v1/adoptions
 * (see src/app.js).
 */
import type { AxiosInstance } from "axios";
import type {
  AdoptionRequest,
  AdoptionRequestStatus,
  CreateAdoptionRequestPayload,
} from "@paw-match/types";

export interface MyAdoptionRequestsParams {
  status?: AdoptionRequestStatus;
}

export const createAdoptionRequest = async (
  client: AxiosInstance,
  payload: CreateAdoptionRequestPayload,
): Promise<AdoptionRequest> => {
  const { data } = await client.post<{ success: true; message: string; data: AdoptionRequest }>(
    "/adoptions",
    payload,
  );
  return data.data;
};

export const getMyAdoptionRequests = async (
  client: AxiosInstance,
  params: MyAdoptionRequestsParams = {},
): Promise<AdoptionRequest[]> => {
  const { data } = await client.get<{ success: true; message: string; data: AdoptionRequest[] }>(
    "/adoptions/my",
    { params },
  );
  return data.data;
};

export const cancelMyAdoptionRequest = async (
  client: AxiosInstance,
  id: string,
): Promise<AdoptionRequest> => {
  const { data } = await client.patch<{ success: true; message: string; data: AdoptionRequest }>(
    `/adoptions/${id}/cancel`,
  );
  return data.data;
};
