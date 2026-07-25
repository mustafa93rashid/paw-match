import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { cancelApprovedRequestSchema } from "@paw-match/validation";
import type { CancelApprovedRequestFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { ShelterAdoptionRequest } from "@paw-match/types";
import { adoptionRequestShelterHooks } from "../../../lib/adoptionRequestShelterHooks";

export interface CancelApprovalDialogProps {
  request: ShelterAdoptionRequest | null;
  onClose: () => void;
}

/** Only valid from status "approved". Ends the request in status "rejected" (the backend reuses that value — there's no distinct "cancelled-approval" status) and flips the animal back to "available". */
export const CancelApprovalDialog = ({ request, onClose }: CancelApprovalDialogProps) => {
  const cancelMutation = adoptionRequestShelterHooks.useCancelApprovedAdoptionRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelApprovedRequestFormValues>({ resolver: zodResolver(cancelApprovedRequestSchema) });

  useEffect(() => {
    if (request) reset({ reason: "" });
  }, [request, reset]);

  const onSubmit = (values: CancelApprovedRequestFormValues) => {
    if (!request) return;
    cancelMutation.mutate({ id: request._id, reason: values.reason }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(request)}
      onClose={onClose}
      title={
        request
          ? request.adopterId
            ? `Cancel approval for ${request.adopterId.firstName} ${request.adopterId.lastName}`
            : "Cancel approval for unknown adopter"
          : "Cancel approval"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={cancelMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={cancelMutation.isPending}>
            Cancel approval
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-slate-600">
          This makes the animal available again and marks this request as rejected. A reason is required.
        </p>
        <Textarea label="Reason" rows={4} error={errors.reason?.message} {...register("reason")} />
        {cancelMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(cancelMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
