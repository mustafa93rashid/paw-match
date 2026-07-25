/**
 * Endpoint functions for src/routes/profiles/vetProfile.routes.js
 * (GET / and GET /:userId — both auth-only, any role, not adopter-restricted).
 */
import type { AxiosInstance } from "axios";
import type { ApiListResponse, VetProfile } from "@paw-match/types";

export interface VetsParams {
  shelterId?: string;
  specialization?: string;
}

export const getVets = async (
  client: AxiosInstance,
  params: VetsParams = {},
): Promise<VetProfile[]> => {
  const { data } = await client.get<ApiListResponse<VetProfile>>("/vet-profile", { params });
  return data.data;
};

export const getVetById = async (client: AxiosInstance, userId: string): Promise<VetProfile> => {
  const { data } = await client.get<{ success: true; message: string; data: VetProfile }>(
    `/vet-profile/${userId}`,
  );
  return data.data;
};
