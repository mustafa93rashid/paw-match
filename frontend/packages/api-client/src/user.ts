/**
 * Endpoint functions for the self-service subset of
 * src/routes/user.route.js (mounted at /api/v1/user) plus
 * PUT /auth/change-password (src/routes/auth.route.js) — grouped here
 * because both belong to the same "account settings" feature area.
 * Admin-only routes (create-user, list, role/status updates) are
 * deliberately not included; they belong to the Dashboard, not the
 * Public Website.
 */
import type { AxiosInstance } from "axios";
import type {
  AuthUser,
  ChangePasswordPayload,
  RequestEmailUpdatePayload,
  RequestEmailUpdateResult,
  UpdateProfilePayload,
  VerifyEmailUpdatePayload,
} from "@paw-match/types";

/** GET /user/profile — see the already-exported `getProfile` in ./auth (used by AuthProvider's session check). */
export { getProfile as getMyProfile } from "./auth";

export const updateMyProfile = async (
  client: AxiosInstance,
  payload: UpdateProfilePayload,
): Promise<AuthUser> => {
  const { data } = await client.put<{ success: true; message: string; data: AuthUser }>(
    "/user/profile",
    payload,
  );
  return data.data;
};

const buildProfileImageFormData = (file: File): FormData => {
  const formData = new FormData();
  formData.append("image", file);
  return formData;
};

/** Only valid when the account has no profile image yet — otherwise the backend 400s. */
export const uploadProfileImage = async (
  client: AxiosInstance,
  file: File,
): Promise<AuthUser> => {
  const { data } = await client.patch<{ success: true; message: string; data: AuthUser }>(
    "/user/profile/image",
    buildProfileImageFormData(file),
  );
  return data.data;
};

/** Only used when the account already has a profile image. */
export const replaceProfileImage = async (
  client: AxiosInstance,
  file: File,
): Promise<AuthUser> => {
  const { data } = await client.patch<{ success: true; message: string; data: AuthUser }>(
    "/user/profile/image/replace",
    buildProfileImageFormData(file),
  );
  return data.data;
};

export const deleteProfileImage = async (client: AxiosInstance): Promise<AuthUser> => {
  const { data } = await client.delete<{ success: true; message: string; data: AuthUser }>(
    "/user/profile/image",
  );
  return data.data;
};

export const requestEmailUpdate = async (
  client: AxiosInstance,
  payload: RequestEmailUpdatePayload,
): Promise<RequestEmailUpdateResult> => {
  const { data } = await client.post<{
    success: true;
    message: string;
    data: RequestEmailUpdateResult;
  }>("/user/profile/email/request", payload);
  return data.data;
};

/** Backend also clears auth cookies server-side on success — caller must clear local session state too. */
export const verifyEmailUpdate = async (
  client: AxiosInstance,
  payload: VerifyEmailUpdatePayload,
): Promise<AuthUser> => {
  const { data } = await client.post<{ success: true; message: string; data: AuthUser }>(
    "/user/profile/email/verify",
    payload,
  );
  return data.data;
};

/** Mounted at /auth (auth.route.js), not /user — grouped here for the account-settings feature. */
export const changePassword = async (
  client: AxiosInstance,
  payload: ChangePasswordPayload,
): Promise<{ message: string }> => {
  const { data } = await client.put<{ success: true; message: string }>(
    "/auth/change-password",
    payload,
  );
  return { message: data.message };
};
