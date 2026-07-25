/**
 * Endpoint functions for src/routes/auth.route.js + src/routes/user.route.js
 * (GET /user/profile — used as the "who am I" / session-restore call since
 * no dedicated session endpoint exists).
 */
import type { AxiosInstance } from "axios";
import type { ApiSuccessResponse, AuthUser } from "@paw-match/types";

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignUpResult {
  email: string;
  expiresInMinutes: number;
}

export interface VerifySignUpPayload {
  email: string;
  verificationCode: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface ActivateAccountPayload {
  newPassword: string;
  confirmPassword: string;
}

export const signUp = async (
  client: AxiosInstance,
  payload: SignUpPayload,
): Promise<SignUpResult> => {
  const { data } = await client.post<ApiSuccessResponse<SignUpResult>>(
    "/auth/signup",
    payload,
  );

  return data.data;
};

export const verifySignUp = async (
  client: AxiosInstance,
  payload: VerifySignUpPayload,
): Promise<AuthUser> => {
  const { data } = await client.post<ApiSuccessResponse<AuthUser>>(
    "/auth/verify-signup",
    payload,
  );

  return data.data;
};

export const signIn = async (
  client: AxiosInstance,
  payload: SignInPayload,
): Promise<AuthUser> => {
  const { data } = await client.post<ApiSuccessResponse<AuthUser>>(
    "/auth/signin",
    payload,
  );

  return data.data;
};

export const logOut = async (client: AxiosInstance): Promise<void> => {
  await client.post("/auth/logout");
};

export const forgotPassword = async (
  client: AxiosInstance,
  payload: ForgotPasswordPayload,
): Promise<string> => {
  const { data } = await client.post<{ success: true; message: string }>(
    "/auth/forgot-password",
    payload,
  );

  return data.message;
};

export const resetPassword = async (
  client: AxiosInstance,
  token: string,
  payload: ResetPasswordPayload,
): Promise<string> => {
  const { data } = await client.post<{ success: true; message: string }>(
    `/auth/reset-password/${token}`,
    payload,
  );

  return data.message;
};

/**
 * POST /auth/activate-account/:token — sets the applicant's own password for
 * the first time on a staff-application-approved account (isAccountActivated
 * false -> true). Deliberately a separate endpoint from resetPassword, even
 * though the token mechanism is identical — see StaffApplication's approval
 * flow doc comments for why.
 */
export const activateAccount = async (
  client: AxiosInstance,
  token: string,
  payload: ActivateAccountPayload,
): Promise<string> => {
  const { data } = await client.post<{ success: true; message: string }>(
    `/auth/activate-account/${token}`,
    payload,
  );

  return data.message;
};

export const getProfile = async (client: AxiosInstance): Promise<AuthUser> => {
  const { data } = await client.get<ApiSuccessResponse<AuthUser>>(
    "/user/profile",
  );

  return data.data;
};
