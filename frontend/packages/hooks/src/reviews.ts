import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  createReview,
  getMyReviews,
  getTargetReviews,
  updateReview,
  type CreateReviewPayload,
  type MyReviewsParams,
  type UpdateReviewPayload,
} from "@paw-match/api-client";
import type { ReviewTargetType } from "@paw-match/types";

export const createReviewHooks = (client: AxiosInstance) => {
  const useMyReviews = (filters: MyReviewsParams = {}) =>
    useQuery({
      queryKey: ["reviews", "my", filters],
      queryFn: () => getMyReviews(client, filters),
    });

  const invalidateReviewCaches = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ["reviews", "my"] });
    queryClient.invalidateQueries({ queryKey: ["reviews", "target"] });
    // Both shelter and vet detail queries embed reviews — invalidating both
    // prefixes is harmless (TanStack Query matches by key prefix) and
    // avoids needing to thread targetId through just for cache invalidation.
    queryClient.invalidateQueries({ queryKey: ["shelters", "authed-detail"] });
    queryClient.invalidateQueries({ queryKey: ["vets", "detail"] });
  };

  const useCreateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (payload: CreateReviewPayload) => createReview(client, payload),
      onSuccess: () => invalidateReviewCaches(queryClient),
    });
  };

  const useUpdateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateReviewPayload }) =>
        updateReview(client, id, payload),
      onSuccess: () => invalidateReviewCaches(queryClient),
    });
  };

  /** Public, no auth — used to feature real reviews on marketing pages. */
  const useTargetReviews = (targetType: ReviewTargetType, targetId: string | undefined) =>
    useQuery({
      queryKey: ["reviews", "target", targetType, targetId],
      queryFn: () => getTargetReviews(client, targetType, targetId as string),
      enabled: Boolean(targetId),
    });

  return { useMyReviews, useCreateReview, useUpdateReview, useTargetReviews };
};
