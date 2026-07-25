/**
 * Endpoint functions for src/routes/staffApplication.route.js. The first two
 * (submit/verify) are public; the rest are Super-Admin-only review actions.
 */
import type { AxiosInstance } from "axios";
import type {
  ApplicationStatus,
  ApplicationType,
  ResendByEmailPayload,
  StaffApplication,
  SubmitStaffApplicationPayload,
  SubmitStaffApplicationResult,
  UpdateStaffApplicationPayload,
  VerifyStaffApplicationPayload,
} from "@paw-match/types";

/** POST /staff-applications — public. Never creates a User; stores the application for later review. */
export const submitStaffApplication = async (
  client: AxiosInstance,
  payload: SubmitStaffApplicationPayload,
): Promise<SubmitStaffApplicationResult> => {
  const { data } = await client.post<{ success: true; message: string; data: SubmitStaffApplicationResult }>(
    "/staff-applications",
    payload,
  );

  return data.data;
};

/** POST /staff-applications/verify — public. Only after this succeeds does the application become visible to Super Admin. */
export const verifyStaffApplication = async (
  client: AxiosInstance,
  payload: VerifyStaffApplicationPayload,
): Promise<{ email: string; status: ApplicationStatus }> => {
  const { data } = await client.post<{
    success: true;
    message: string;
    data: { email: string; status: ApplicationStatus };
  }>("/staff-applications/verify", payload);

  return data.data;
};

/** POST /staff-applications/resend-verification — public. Only a "pendingVerification" application may request this; invalidates the previous code. */
export const resendVerificationCode = async (
  client: AxiosInstance,
  payload: ResendByEmailPayload,
): Promise<SubmitStaffApplicationResult> => {
  const { data } = await client.post<{ success: true; message: string; data: SubmitStaffApplicationResult }>(
    "/staff-applications/resend-verification",
    payload,
  );

  return data.data;
};

/** POST /staff-applications/resend-activation — public. Only an approved-but-not-yet-activated account may request this; invalidates the previous activation link. */
export const resendActivationEmail = async (
  client: AxiosInstance,
  payload: ResendByEmailPayload,
): Promise<string> => {
  const { data } = await client.post<{ success: true; message: string }>(
    "/staff-applications/resend-activation",
    payload,
  );

  return data.message;
};

export interface StaffApplicationsFilters {
  applicationType?: ApplicationType;
  status?: ApplicationStatus;
  search?: string;
}

/** GET /staff-applications — Super Admin only. No server-side pagination; filters map to real query params. */
export const getStaffApplications = async (
  client: AxiosInstance,
  filters: StaffApplicationsFilters = {},
): Promise<StaffApplication[]> => {
  const { data } = await client.get<{ success: true; message: string; data: StaffApplication[] }>(
    "/staff-applications",
    { params: filters },
  );

  return data.data;
};

/** GET /staff-applications/:id — Super Admin only. */
export const getStaffApplicationById = async (
  client: AxiosInstance,
  id: string,
): Promise<StaffApplication> => {
  const { data } = await client.get<{ success: true; message: string; data: StaffApplication }>(
    `/staff-applications/${id}`,
  );

  return data.data;
};

export interface ApproveStaffApplicationResult {
  application: StaffApplication;
  userId: string;
}

/** PATCH /staff-applications/:id/approve — Super Admin only. 409 if not currently "pending" (also the double-submission guard). */
export const approveStaffApplication = async (
  client: AxiosInstance,
  id: string,
): Promise<ApproveStaffApplicationResult> => {
  const { data } = await client.patch<{
    success: true;
    message: string;
    data: ApproveStaffApplicationResult;
  }>(`/staff-applications/${id}/approve`);

  return data.data;
};

/** PATCH /staff-applications/:id/reject — Super Admin only. Reason required (1-1000 characters). */
export const rejectStaffApplication = async (
  client: AxiosInstance,
  id: string,
  reason: string,
): Promise<StaffApplication> => {
  const { data } = await client.patch<{ success: true; message: string; data: StaffApplication }>(
    `/staff-applications/${id}/reject`,
    { reason },
  );

  return data.data;
};

/** PATCH /staff-applications/:id — Super Admin only. 409 if the application isn't currently "pending" (immutable once approved/rejected). */
export const updateStaffApplication = async (
  client: AxiosInstance,
  id: string,
  payload: UpdateStaffApplicationPayload,
): Promise<StaffApplication> => {
  const { data } = await client.patch<{ success: true; message: string; data: StaffApplication }>(
    `/staff-applications/${id}`,
    payload,
  );

  return data.data;
};
