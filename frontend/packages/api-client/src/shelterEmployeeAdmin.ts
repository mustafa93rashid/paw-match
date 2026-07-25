/**
 * Super-Admin-only listing of every ShelterEmployeeProfile document, used to
 * determine assignment status across all shelters. Distinct from
 * ./shelterEmployeeProfile.ts, which is the self-service `/me` endpoint for
 * the logged-in employee.
 */
import type { AxiosInstance } from "axios";
import type {
  AvailableShelterEmployee,
  ShelterEmployeeProfileAdminEntry,
  UpdateEmployeeWorkDataPayload,
} from "@paw-match/types";

/** GET /shelter-employee-profile — no query params, returns every profile unfiltered. */
export const getAllShelterEmployeeProfilesAdmin = async (
  client: AxiosInstance,
): Promise<ShelterEmployeeProfileAdminEntry[]> => {
  const { data } = await client.get<{
    success: true;
    message: string;
    data: ShelterEmployeeProfileAdminEntry[];
  }>("/shelter-employee-profile");
  return data.data;
};

/**
 * PUT /shelter-employee-profile/:userId/work-data — superadmin only. Sets
 * position (promote/demote), employeeNumber, and/or hireDate. 409 if
 * employeeNumber is already used within the same shelter.
 */
export const updateEmployeeWorkData = async (
  client: AxiosInstance,
  userId: string,
  payload: UpdateEmployeeWorkDataPayload,
): Promise<ShelterEmployeeProfileAdminEntry> => {
  const { data } = await client.put<{
    success: true;
    message: string;
    data: ShelterEmployeeProfileAdminEntry;
  }>(`/shelter-employee-profile/${userId}/work-data`, payload);
  return data.data;
};

/**
 * GET /shelter-employee-profile/available — superadmin, or an active
 * shelterEmployee Manager (any shelter; the caller's own shelter isn't
 * relevant since results are never shelter-scoped — an unassigned employee
 * belongs to none). 403 for a non-manager shelterEmployee caller.
 */
export const getAvailableShelterEmployees = async (
  client: AxiosInstance,
  search?: string,
): Promise<AvailableShelterEmployee[]> => {
  const { data } = await client.get<{
    success: true;
    message: string;
    count: number;
    data: AvailableShelterEmployee[];
  }>("/shelter-employee-profile/available", { params: search ? { search } : undefined });
  return data.data;
};
