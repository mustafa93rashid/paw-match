import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { replyToReview } from "@paw-match/api-client";

/**
 * Mutation hook for the shelterEmployee/vet reply-to-review action.
 * Invalidates both the shelter-detail and vet-profile-self query prefixes
 * unconditionally on success — a harmless no-op for whichever one isn't the
 * caller's active query, same precedent as the existing adopter-facing
 * reviews hooks file's own multi-prefix invalidation on review create/update.
 */
export const createReviewReplyHooks = (client: AxiosInstance) => {
  const useReplyToReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, text }: { id: string; text: string }) => replyToReview(client, id, text),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["shelters", "employee-detail"] });
        queryClient.invalidateQueries({ queryKey: ["vetProfile", "me"] });
      },
    });
  };

  return { useReplyToReview };
};
