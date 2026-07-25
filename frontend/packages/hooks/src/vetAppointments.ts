import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  cancelVetAppointment,
  getMyVetAppointments,
  requestVetAppointment,
  type MyVetAppointmentsParams,
} from "@paw-match/api-client";
import type { RequestVetAppointmentPayload } from "@paw-match/types";

export const createVetAppointmentHooks = (client: AxiosInstance) => {
  const useMyVetAppointments = (filters: MyVetAppointmentsParams = {}) =>
    useQuery({
      queryKey: ["vetAppointments", "my", filters],
      queryFn: () => getMyVetAppointments(client, filters),
    });

  const useRequestVetAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (payload: RequestVetAppointmentPayload) => requestVetAppointment(client, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vetAppointments", "my"] });
      },
    });
  };

  const useCancelVetAppointment = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => cancelVetAppointment(client, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vetAppointments", "my"] });
      },
    });
  };

  return { useMyVetAppointments, useRequestVetAppointment, useCancelVetAppointment };
};
