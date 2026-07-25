/**
 * Super-Admin-only endpoint functions for src/routes/shelter.route.js +
 * src/controllers/shelter.controller.js's admin actions. Kept separate from
 * ./shelters.ts, which is documented there as the public/adopter-facing
 * subset only.
 */
import type { AxiosInstance } from "axios";
import type { AdminShelter } from "@paw-match/types";

export interface AdminSheltersFilters {
  verificationStatus?: "pending" | "approved" | "rejected";
  isActive?: boolean;
  city?: string;
}

/** GET /shelters/admin/all — no server-side search or pagination; every filter here maps to a real backend query param, but the Dashboard calls this with no filters and does everything client-side (see @paw-match/hooks's createShelterAdminHooks). */
export const getAllSheltersAdmin = async (
  client: AxiosInstance,
  filters: AdminSheltersFilters = {},
): Promise<AdminShelter[]> => {
  const { data } = await client.get<{ success: true; message: string; data: AdminShelter[] }>(
    "/shelters/admin/all",
    { params: filters },
  );
  return data.data;
};

/** PATCH /shelters/:id/approve — 400 if the shelter is already approved. */
export const approveShelter = async (client: AxiosInstance, id: string): Promise<AdminShelter> => {
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/approve`,
  );
  return data.data;
};

/** PATCH /shelters/:id/reject — reason must be 3-1000 characters (see @paw-match/validation's rejectShelterSchema). */
export const rejectShelter = async (
  client: AxiosInstance,
  id: string,
  reason: string,
): Promise<AdminShelter> => {
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/reject`,
    { reason },
  );
  return data.data;
};

/** PATCH /shelters/:id/status — toggles isActive; 400 if activating a shelter that isn't approved+verified. */
export const toggleShelterStatus = async (client: AxiosInstance, id: string): Promise<AdminShelter> => {
  const { data } = await client.patch<{ success: true; message: string; data: AdminShelter }>(
    `/shelters/${id}/status`,
  );
  return data.data;
};

export interface DeleteShelterResult {
  animals: number;
  adoptionRequests: number;
  cloudinaryFilesRequested: number;
}

/**
 * DELETE /shelters/:id/permanent — irreversible. Backend rejects with 400 if
 * the shelter is still active, or 409 if active (non-terminal) adoption
 * requests still reference it; both are surfaced to the user as returned,
 * never re-validated client-side.
 */
export const permanentlyDeleteShelter = async (
  client: AxiosInstance,
  id: string,
): Promise<DeleteShelterResult> => {
  const { data } = await client.delete<{
    success: true;
    message: string;
    deletedData: DeleteShelterResult;
  }>(`/shelters/${id}/permanent`);
  return data.deletedData;
};

/**
 * PATCH /shelters/:id/employees — assigns a shelterEmployee or vet user to
 * this shelter. Rejects (403/404/409) if the shelter isn't approved+verified
 * +active, the user is inactive, or already assigned elsewhere. Response
 * body unused — callers rely on invalidating the admin shelters + shelter
 * employee profiles queries instead.
 */
export const assignShelterEmployee = async (
  client: AxiosInstance,
  shelterId: string,
  employeeId: string,
): Promise<void> => {
  await client.patch(`/shelters/${shelterId}/employees`, { employeeId });
};

/** DELETE /shelters/:id/employees/:employeeId — 404s if the employee isn't currently in this shelter's employees array. */
export const unassignShelterEmployee = async (
  client: AxiosInstance,
  shelterId: string,
  employeeId: string,
): Promise<void> => {
  await client.delete(`/shelters/${shelterId}/employees/${employeeId}`);
};
