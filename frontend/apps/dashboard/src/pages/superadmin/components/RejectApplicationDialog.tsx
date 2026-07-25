import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { rejectApplicationSchema } from "@paw-match/validation";
import type { RejectApplicationInput } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { StaffApplication } from "@paw-match/types";
import { staffApplicationHooks } from "../../../lib/staffApplicationHooks";

export interface RejectApplicationDialogProps {
  application: StaffApplication | null;
  onClose: () => void;
}

export const RejectApplicationDialog = ({ application, onClose }: RejectApplicationDialogProps) => {
  const rejectMutation = staffApplicationHooks.useRejectStaffApplication();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectApplicationInput>({ resolver: zodResolver(rejectApplicationSchema) });

  useEffect(() => {
    if (application) reset({ reason: "" });
  }, [application, reset]);

  const onSubmit = (values: RejectApplicationInput) => {
    if (!application) return;
    rejectMutation.mutate({ id: application._id, reason: values.reason }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(application)}
      onClose={onClose}
      title={application ? `Reject ${application.firstName} ${application.lastName}'s application` : "Reject application"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={rejectMutation.isPending}>
            Reject application
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-sm text-slate-600">
          No account is created. The applicant is notified by email with this reason. A reason is
          required.
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
