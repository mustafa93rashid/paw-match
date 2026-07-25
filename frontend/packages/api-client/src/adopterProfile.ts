/**
 * Endpoint functions for src/routes/profiles/adopterProfile.route.js
 * (GET/PUT /adopter-profile/me — auth + role(["adopter"]); GET /adopter-profile —
 * auth + role(["superadmin"]); GET /adopter-profile/:userId — auth +
 * role(["superadmin", "shelterEmployee"])) and
 * src/controllers/adopterProfile.controller.js.
 *
 * GET /me and GET /:userId both return 404 for an adopter who has never
 * saved a profile yet (verify-signup never creates one) — callers should
 * treat that as "no profile yet", not a hard error.
 */
import type { AxiosInstance } from "axios";
import type { AdopterProfile, UpdateAdopterProfilePayload } from "@paw-match/types";

export const getMyAdopterProfile = async (client: AxiosInstance): Promise<AdopterProfile> => {
  const { data } = await client.get<{ success: true; message: string; data: AdopterProfile }>(
    "/adopter-profile/me",
  );

  return data.data;
};

export const updateMyAdopterProfile = async (
  client: AxiosInstance,
  payload: UpdateAdopterProfilePayload,
): Promise<AdopterProfile> => {
  const { data } = await client.put<{ success: true; message: string; data: AdopterProfile }>(
    "/adopter-profile/me",
    payload,
  );

  return data.data;
};

/** Super Admin only. Flat, unfiltered list — no query params on this endpoint. */
export const getAllAdopterProfiles = async (client: AxiosInstance): Promise<AdopterProfile[]> => {
  const { data } = await client.get<{
    success: true;
    message: string;
    count: number;
    data: AdopterProfile[];
  }>("/adopter-profile");

  return data.data;
};

/** Super Admin and Shelter Employee. */
export const getAdopterProfileByUserId = async (
  client: AxiosInstance,
  userId: string,
): Promise<AdopterProfile> => {
  const { data } = await client.get<{ success: true; message: string; data: AdopterProfile }>(
    `/adopter-profile/${userId}`,
  );

  return data.data;
};
