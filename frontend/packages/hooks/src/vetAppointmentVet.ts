import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  getVetAppointments,
  scheduleVetAppointment,
  updateVetAppointmentStatus,
  type VetAppointmentsFilters,
} from "@paw-match/api-client";
import type { ScheduleVetAppointmentPayload, UpdateVetAppointmentStatusPayload } from "@paw-match/types";

/** Query/mutation hook factory for the vet-facing appointment workflow. */
export const createVetAppointmentVetHooks = (client: AxiosInstance) => {
  const vetAppointmentsKey = (filters: VetAppointmentsFilters) =>
    ["vetAppointments", "vet", filters] as const;

  const useVetAppointments = (filters: VetAppointmentsFilters = {}) =>
    useQuery({
      queryKey: vetAppointmentsKey(filters),
      queryFn: () => getVetAppointments(client, filters),
    });

  const invalidateVetAppointments = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({ queryKey: ["vetAppointments", "vet"] });

  const useScheduleVetAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: ScheduleVetAppointmentPayload }) =>
        scheduleVetAppointment(client, id, payload),
      onSuccess: () => invalidateVetAppointments(queryClient),
    });
  };

  const useUpdateVetAppointmentStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateVetAppointmentStatusPayload }) =>
        updateVetAppointmentStatus(client, id, payload),
      onSuccess: () => invalidateVetAppointments(queryClient),
    });
  };

  return { useVetAppointments, useScheduleVetAppointment, useUpdateVetAppointmentStatus };
};
