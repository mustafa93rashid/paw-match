/**
 * Endpoint functions for src/routes/vetAppointment.route.js — adopter-relevant
 * subset only (request, list own, cancel). Mounted at /api/v1/vetappointments
 * (see src/app.js — no hyphen, unlike /vet-profile).
 */
import type { AxiosInstance } from "axios";
import type {
  RequestVetAppointmentPayload,
  VetAppointment,
  VetAppointmentStatus,
} from "@paw-match/types";

export interface MyVetAppointmentsParams {
  status?: VetAppointmentStatus;
}

export const requestVetAppointment = async (
  client: AxiosInstance,
  payload: RequestVetAppointmentPayload,
): Promise<VetAppointment> => {
  const { data } = await client.post<{ success: true; message: string; data: VetAppointment }>(
    "/vetappointments",
    payload,
  );
  return data.data;
};

/** No `message` field in this response envelope — just success/count/data. */
export const getMyVetAppointments = async (
  client: AxiosInstance,
  params: MyVetAppointmentsParams = {},
): Promise<VetAppointment[]> => {
  const { data } = await client.get<{ success: true; count: number; data: VetAppointment[] }>(
    "/vetappointments/my",
    { params },
  );
  return data.data;
};

export const cancelVetAppointment = async (
  client: AxiosInstance,
  id: string,
): Promise<VetAppointment> => {
  const { data } = await client.patch<{ success: true; message: string; data: VetAppointment }>(
    `/vetappointments/${id}/cancel`,
  );
  return data.data;
};
