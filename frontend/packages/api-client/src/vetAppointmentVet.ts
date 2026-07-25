/**
 * Vet-only endpoint functions for the vet-facing subset of
 * src/routes/vetAppointment.route.js. Kept separate from
 * ./vetAppointments.ts, which is documented there as the adopter-facing
 * subset only.
 */
import type { AxiosInstance } from "axios";
import type {
  ScheduleVetAppointmentPayload,
  UpdateVetAppointmentStatusPayload,
  VetAppointment,
  VetAppointmentStatus,
} from "@paw-match/types";

export interface VetAppointmentsFilters {
  status?: VetAppointmentStatus;
}

/** GET /vetappointments/vet — hard-scoped server-side to the caller's own vetId (their own User id); no search, no pagination. */
export const getVetAppointments = async (
  client: AxiosInstance,
  filters: VetAppointmentsFilters = {},
): Promise<VetAppointment[]> => {
  const { data } = await client.get<{ success: true; count: number; data: VetAppointment[] }>(
    "/vetappointments/vet",
    { params: filters },
  );
  return data.data;
};

/** PATCH /vetappointments/:id/schedule — only valid when the appointment's current status is "pending"; 409 on a scheduling conflict with another of the vet's own scheduled appointments. */
export const scheduleVetAppointment = async (
  client: AxiosInstance,
  id: string,
  payload: ScheduleVetAppointmentPayload,
): Promise<VetAppointment> => {
  const { data } = await client.patch<{ success: true; message: string; data: VetAppointment }>(
    `/vetappointments/${id}/schedule`,
    payload,
  );
  return data.data;
};

/** PATCH /vetappointments/:id/status — only valid when the appointment's current status is "scheduled"; rejectionReason required only when status is "rejected". */
export const updateVetAppointmentStatus = async (
  client: AxiosInstance,
  id: string,
  payload: UpdateVetAppointmentStatusPayload,
): Promise<VetAppointment> => {
  const { data } = await client.patch<{ success: true; message: string; data: VetAppointment }>(
    `/vetappointments/${id}/status`,
    payload,
  );
  return data.data;
};
