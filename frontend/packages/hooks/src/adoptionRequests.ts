import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  cancelMyAdoptionRequest,
  createAdoptionRequest,
  getMyAdoptionRequests,
  type MyAdoptionRequestsParams,
} from "@paw-match/api-client";
import type { CreateAdoptionRequestPayload } from "@paw-match/types";

export const createAdoptionRequestHooks = (client: AxiosInstance) => {
  const useMyAdoptionRequests = (filters: MyAdoptionRequestsParams = {}) =>
    useQuery({
      queryKey: ["adoptionRequests", "my", filters],
      queryFn: () => getMyAdoptionRequests(client, filters),
    });

  const useCreateAdoptionRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (payload: CreateAdoptionRequestPayload) => createAdoptionRequest(client, payload),
      onSuccess: (_result, payload) => {
        queryClient.invalidateQueries({ queryKey: ["adoptionRequests"] });
        queryClient.invalidateQueries({ queryKey: ["animals"] });
        queryClient.invalidateQueries({ queryKey: ["animals", "detail", payload.animalId] });
      },
    });
  };

  const useCancelAdoptionRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => cancelMyAdoptionRequest(client, id),
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: ["adoptionRequests"] });
        queryClient.invalidateQueries({ queryKey: ["animals"] });
        queryClient.invalidateQueries({ queryKey: ["animals", "detail", result.animalId._id] });
      },
    });
  };

  return { useMyAdoptionRequests, useCreateAdoptionRequest, useCancelAdoptionRequest };
};
