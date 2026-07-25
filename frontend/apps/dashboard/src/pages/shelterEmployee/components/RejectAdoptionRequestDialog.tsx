import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { rejectAdoptionRequestSchema } from "@paw-match/validation";
import type { RejectAdoptionRequestFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { ShelterAdoptionRequest } from "@paw-match/types";
import { adoptionRequestShelterHooks } from "../../../lib/adoptionRequestShelterHooks";

export interface RejectAdoptionRequestDialogProps {
  request: ShelterAdoptionRequest | null;
  onClose: () => void;
}

/** Only valid from pendingReview|interview|homeCheck — the backend rejects otherwise (409). */
export const RejectAdoptionRequestDialog = ({ request, onClose }: RejectAdoptionRequestDialogProps) => {
  const rejectMutation = adoptionRequestShelterHooks.useRejectAdoptionRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectAdoptionRequestFormValues>({ resolver: zodResolver(rejectAdoptionRequestSchema) });

  useEffect(() => {
    if (request) reset({ rejectionReason: "" });
  }, [request, reset]);

  const onSubmit = (values: RejectAdoptionRequestFormValues) => {
    if (!request) return;
    rejectMutation.mutate(
      { id: request._id, rejectionReason: values.rejectionReason },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen={Boolean(request)}
      onClose={onClose}
      title={
        request
          ? request.adopterId
            ? `Reject request from ${request.adopterId.firstName} ${request.adopterId.lastName}`
            : "Reject request from unknown adopter"
          : "Reject request"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={rejectMutation.isPending}>
            Reject request
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-slate-600">A reason is required and will be shown to the adopter.</p>
        <Textarea
          label="Rejection reason"
          rows={4}
          error={errors.rejectionReason?.message}
          {...register("rejectionReason")}
        />
        {rejectMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(rejectMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
