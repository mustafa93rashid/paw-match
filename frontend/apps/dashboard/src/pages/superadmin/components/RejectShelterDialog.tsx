import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { rejectShelterSchema } from "@paw-match/validation";
import type { RejectShelterFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminShelter } from "@paw-match/types";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";

export interface RejectShelterDialogProps {
  shelter: AdminShelter | null;
  onClose: () => void;
}

export const RejectShelterDialog = ({ shelter, onClose }: RejectShelterDialogProps) => {
  const rejectMutation = shelterAdminHooks.useRejectShelter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectShelterFormValues>({ resolver: zodResolver(rejectShelterSchema) });

  useEffect(() => {
    if (shelter) reset({ reason: "" });
  }, [shelter, reset]);

  const onSubmit = (values: RejectShelterFormValues) => {
    if (!shelter) return;
    rejectMutation.mutate({ id: shelter._id, reason: values.reason }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(shelter)}
      onClose={onClose}
      title={shelter ? `Reject ${shelter.name}` : "Reject shelter"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={rejectMutation.isPending}>
            Reject shelter
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-slate-600">
          This deactivates the shelter and records why it wasn't approved. A reason is required.
        </p>
        <Textarea label="Rejection reason" rows={4} error={errors.reason?.message} {...register("reason")} />
        {rejectMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(rejectMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
