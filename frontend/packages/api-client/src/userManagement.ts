/**
 * Super-Admin-only endpoint functions for the admin subset of
 * src/routes/user.route.js. Kept separate from ./user.ts, which is
 * documented there as the self-service subset only.
 */
import type { AxiosInstance } from "axios";
import type {
  AdminUser,
  CreateUserPayload,
  UpdateUserRoleResult,
  UpdateUserStatusResult,
  UserRole,
} from "@paw-match/types";

/** POST /user/create-user — 409 if the email is already registered. Creates the User plus its role profile (AdopterProfile/VetProfile/ShelterEmployeeProfile) in one step. */
export const createUser = async (client: AxiosInstance, payload: CreateUserPayload): Promise<AdminUser> => {
  const { data } = await client.post<{ success: true; message: string; data: AdminUser }>(
    "/user/create-user",
    payload,
  );
  return data.data;
};

/** GET /user — no query params supported by the backend; every user is returned in one response. */
export const getAllUsers = async (client: AxiosInstance): Promise<AdminUser[]> => {
  const { data } = await client.get<{ success: true; count: number; data: AdminUser[] }>("/user");
  return data.data;
};

export const getUserById = async (client: AxiosInstance, id: string): Promise<AdminUser> => {
  const { data } = await client.get<{ success: true; data: AdminUser }>(`/user/${id}`);
  return data.data;
};

/** PUT /user/:id/role — 403 if the target is superadmin, 400 if the role is unchanged. Response is deliberately partial (see @paw-match/types's UpdateUserRoleResult). */
export const updateUserRole = async (
  client: AxiosInstance,
  id: string,
  role: Exclude<UserRole, "superadmin">,
): Promise<UpdateUserRoleResult> => {
  const { data } = await client.put<{ success: true; message: string; data: UpdateUserRoleResult }>(
    `/user/${id}/role`,
    { role },
  );
  return data.data;
};

/** PUT /user/:id/status — 400 if changing your own account, 403 if deactivating another superadmin, 400 if the status is unchanged. */
export const updateUserStatus = async (
  client: AxiosInstance,
  id: string,
  isActive: boolean,
): Promise<UpdateUserStatusResult> => {
  const { data } = await client.put<{ success: true; message: string; data: UpdateUserStatusResult }>(
    `/user/${id}/status`,
    { isActive },
  );
  return data.data;
};
