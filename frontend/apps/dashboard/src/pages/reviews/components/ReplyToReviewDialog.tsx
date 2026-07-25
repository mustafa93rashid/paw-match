import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { reviewReplySchema } from "@paw-match/validation";
import type { ReviewReplyFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Review } from "@paw-match/types";
import { reviewReplyHooks } from "../../../lib/reviewReplyHooks";

export interface ReplyToReviewDialogProps {
  review: Review | null;
  replyLabel: string;
  onClose: () => void;
}

/**
 * Only ever opened for a review with no reply yet (ReviewsPage only offers
 * the "Reply" action on cards without one). The backend rejects a second
 * reply with 409 "An official reply has already been added" — that message
 * is already friendly, so it's surfaced verbatim via getApiErrorMessage with
 * no special-casing, exactly like every other mutation error in this app.
 */
export const ReplyToReviewDialog = ({ review, replyLabel, onClose }: ReplyToReviewDialogProps) => {
  const replyMutation = reviewReplyHooks.useReplyToReview();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewReplyFormValues>({ resolver: zodResolver(reviewReplySchema) });

  useEffect(() => {
    if (review) reset({ text: "" });
  }, [review, reset]);

  const onSubmit = (values: ReviewReplyFormValues) => {
    if (!review) return;
    replyMutation.mutate({ id: review._id, text: values.text }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(review)}
      onClose={onClose}
      title={
        review
          ? `Reply to ${review.adopterId ? `${review.adopterId.firstName} ${review.adopterId.lastName}` : "Unknown adopter"}`
          : "Reply to review"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={replyMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={replyMutation.isPending}>
            {replyLabel}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {review?.comment && (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Their review</p>
            <p className="mt-1 text-sm text-slate-700">{review.comment}</p>
          </div>
        )}
        <Textarea label="Your reply" rows={4} error={errors.text?.message} {...register("text")} />
        {replyMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(replyMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
