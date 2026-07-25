import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  approveAdoptionRequest,
  cancelApprovedAdoptionRequest,
  completeAdoptionRequest,
  getShelterAdoptionRequests,
  rejectAdoptionRequest,
  updateAdoptionRequestStatus,
  type ShelterAdoptionRequestsFilters,
} from "@paw-match/api-client";

/** Query/mutation hook factory for the shelter-facing adoption-request workflow. Every mutation invalidates both the shelter-requests list and animals (approve/complete/cancel-approval all change the linked animal's adoptionStatus). */
export const createAdoptionRequestShelterHooks = (client: AxiosInstance) => {
  const shelterRequestsKey = (filters: ShelterAdoptionRequestsFilters) =>
    ["adoptionRequests", "shelter", filters] as const;

  const useShelterAdoptionRequests = (filters: ShelterAdoptionRequestsFilters = {}) =>
    useQuery({
      queryKey: shelterRequestsKey(filters),
      queryFn: () => getShelterAdoptionRequests(client, filters),
    });

  const invalidateShelterRequests = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ["adoptionRequests", "shelter"] });
    queryClient.invalidateQueries({ queryKey: ["animals"] });
  };

  const useUpdateAdoptionRequestStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: "interview" | "homeCheck" }) =>
        updateAdoptionRequestStatus(client, id, status),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  const useApproveAdoptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => approveAdoptionRequest(client, id),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  const useRejectAdoptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
        rejectAdoptionRequest(client, id, rejectionReason),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  const useCompleteAdoptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => completeAdoptionRequest(client, id),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  const useCancelApprovedAdoptionRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        cancelApprovedAdoptionRequest(client, id, reason),
      onSuccess: () => invalidateShelterRequests(queryClient),
    });
  };

  return {
    useShelterAdoptionRequests,
    useUpdateAdoptionRequestStatus,
    useApproveAdoptionRequest,
    useRejectAdoptionRequest,
    useCompleteAdoptionRequest,
    useCancelApprovedAdoptionRequest,
  };
};
