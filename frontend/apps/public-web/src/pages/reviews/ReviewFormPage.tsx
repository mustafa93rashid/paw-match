import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ClipboardX, PawPrint, Stethoscope } from "lucide-react";
import { Button, Container, EmptyState, ErrorState, Spinner, Textarea } from "@paw-match/ui";
import { reviewFormSchema, type ReviewFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { ReviewTargetType } from "@paw-match/types";
import { adoptionRequestHooks } from "../../lib/adoptionRequestHooks";
import { vetAppointmentHooks } from "../../lib/vetAppointmentHooks";
import { reviewHooks } from "../../lib/reviewHooks";
import { paths } from "../../routes/paths";
import { StarRatingInput } from "./components/StarRatingInput";
import { StarRatingDisplay } from "./components/StarRatingDisplay";

const EDIT_WINDOW_MS = 48 * 60 * 60 * 1000;

const ReviewFormPage = () => {
  const { targetType, transactionId } = useParams<{ targetType: string; transactionId: string }>();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  // Both are always fetched (simpler than adding an `enabled` toggle to
  // each hook) — cheap, and likely already cached from /adoptions or
  // /appointments/vet.
  const adoptionRequestsQuery = adoptionRequestHooks.useMyAdoptionRequests();
  const vetAppointmentsQuery = vetAppointmentHooks.useMyVetAppointments();
  const myReviewsQuery = reviewHooks.useMyReviews();
  const createMutation = reviewHooks.useCreateReview();
  const updateMutation = reviewHooks.useUpdateReview();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewFormSchema) });

  const isValidTargetType = targetType === "shelter" || targetType === "vet";

  const isLoading =
    adoptionRequestsQuery.isPending || vetAppointmentsQuery.isPending || myReviewsQuery.isPending;
  const isError =
    adoptionRequestsQuery.isError || vetAppointmentsQuery.isError || myReviewsQuery.isError;

  // Resolve the transaction from the adopter's OWN lists only — never trust
  // targetId from the URL (there isn't one) and never assume transactionId
  // alone identifies the review; both targetType and transactionId must
  // match together, mirroring the model's own unique index.
  const adoptionRequest =
    targetType === "shelter"
      ? adoptionRequestsQuery.data?.find((request) => request._id === transactionId)
      : undefined;
  const vetAppointment =
    targetType === "vet"
      ? vetAppointmentsQuery.data?.find((appointment) => appointment._id === transactionId)
      : undefined;

  const transactionStatus = adoptionRequest?.status ?? vetAppointment?.status;
  const transactionFound = Boolean(adoptionRequest || vetAppointment);
  const isCompleted = transactionStatus === "completed";

  const targetId =
    targetType === "shelter"
      ? adoptionRequest?.shelterId._id
      : (vetAppointment?.vetId?._id ?? null);

  const existingReview = myReviewsQuery.data?.find(
    (review) => review.targetType === targetType && review.transactionId === transactionId,
  );

  const editDeadline = existingReview
    ? new Date(existingReview.createdAt).getTime() + EDIT_WINDOW_MS
    : null;
  const isWithinEditWindow = editDeadline !== null && Date.now() < editDeadline;

  const mode: "create" | "edit" | "view" = !existingReview
    ? "create"
    : isWithinEditWindow
      ? "edit"
      : "view";

  // Pre-fill the form when editing.
  useEffect(() => {
    if (mode === "edit" && existingReview) {
      reset({ rating: existingReview.rating, comment: existingReview.comment });
    }
  }, [mode, existingReview, reset]);

  if (!isValidTargetType) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
          title="Invalid review link"
          description="This review link isn't valid."
        />
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-16">
        <Spinner label="Loading…" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="py-16">
        <ErrorState
          description="We couldn't load the information needed for this review."
          onRetry={() => {
            adoptionRequestsQuery.refetch();
            vetAppointmentsQuery.refetch();
            myReviewsQuery.refetch();
          }}
        />
      </Container>
    );
  }

  if (!transactionFound) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ClipboardX className="h-6 w-6" aria-hidden />}
          title="Transaction not found"
          description="This adoption request or appointment doesn't belong to your account, or the link is out of date."
        />
      </Container>
    );
  }

  if (!isCompleted) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ClipboardX className="h-6 w-6" aria-hidden />}
          title="Not available for review yet"
          description={
            targetType === "shelter"
              ? "Only a completed adoption request can be reviewed."
              : "Only a completed appointment can be reviewed."
          }
        />
      </Container>
    );
  }

  if (!targetId) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
          title="This veterinarian's profile is unavailable"
          description="The account linked to this appointment could not be found, so a review can't be submitted."
        />
      </Container>
    );
  }

  const targetName =
    targetType === "shelter"
      ? adoptionRequest!.shelterId.name
      : `Dr. ${vetAppointment!.vetId!.firstName} ${vetAppointment!.vetId!.lastName}`;

  const backPath = targetType === "shelter" ? paths.adoptionRequests : paths.vetAppointments;

  const onSubmit = (values: ReviewFormValues) => {
    setFormError(null);

    if (mode === "create") {
      createMutation.mutate(
        {
          targetType: targetType as ReviewTargetType,
          transactionId: transactionId as string,
          rating: values.rating,
          comment: values.comment || undefined,
        },
        {
          onSuccess: () => navigate(backPath, { state: { justReviewed: true } }),
          onError: (error) => {
            setFormError(getApiErrorMessage(error, "Could not submit your review. Please try again."));
          },
        },
      );
      return;
    }

    if (mode === "edit" && existingReview) {
      updateMutation.mutate(
        {
          id: existingReview._id,
          payload: { rating: values.rating, comment: values.comment || undefined },
        },
        {
          onSuccess: () => navigate(backPath, { state: { justReviewed: true } }),
          onError: (error) => {
            // The backend is the final authority on the 48h window — a
            // client-clock-based "edit" attempt can still be rejected here.
            setFormError(getApiErrorMessage(error, "Could not update your review. Please try again."));
          },
        },
      );
    }
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {mode === "create" && "Write a review"}
          {mode === "edit" && "Edit your review"}
          {mode === "view" && "Your review"}
        </h1>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            {targetType === "shelter" ? (
              <PawPrint className="h-6 w-6" aria-hidden />
            ) : (
              <Stethoscope className="h-6 w-6" aria-hidden />
            )}
          </span>
          <div>
            <p className="font-semibold text-slate-900">{targetName}</p>
            <p className="text-sm text-slate-600">
              {targetType === "shelter" ? "Adoption request" : "Vet appointment"}
            </p>
          </div>
        </div>

        {mode === "view" && existingReview && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <StarRatingDisplay rating={existingReview.rating} />
            {existingReview.comment && (
              <p className="text-sm text-slate-600">{existingReview.comment}</p>
            )}
            <p className="text-xs text-slate-500">
              The 48-hour edit window for this review has passed.
            </p>
            <Link
              to={backPath}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Back
            </Link>
          </div>
        )}

        {(mode === "create" || mode === "edit") && (
          <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {formError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <StarRatingInput control={control} error={errors.rating?.message} />

            <Textarea
              label="Your review (optional)"
              placeholder="Share details of your experience."
              error={errors.comment?.message}
              {...register("comment")}
            />

            <div className="flex flex-wrap gap-3">
              <Button type="submit" isLoading={isSubmitting}>
                {mode === "create" ? "Submit review" : "Save changes"}
              </Button>
              <Link
                to={backPath}
                className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </Container>
  );
};

export default ReviewFormPage;
