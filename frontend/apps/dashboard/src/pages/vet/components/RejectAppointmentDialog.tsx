import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { rejectAppointmentSchema } from "@paw-match/validation";
import type { RejectAppointmentFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { VetAppointment } from "@paw-match/types";
import { vetAppointmentVetHooks } from "../../../lib/vetAppointmentVetHooks";

export interface RejectAppointmentDialogProps {
  appointment: VetAppointment | null;
  onClose: () => void;
}

/** Only valid when the appointment's current status is "scheduled". A reason is required. */
export const RejectAppointmentDialog = ({ appointment, onClose }: RejectAppointmentDialogProps) => {
  const statusMutation = vetAppointmentVetHooks.useUpdateVetAppointmentStatus();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectAppointmentFormValues>({ resolver: zodResolver(rejectAppointmentSchema) });

  useEffect(() => {
    if (appointment) reset({ rejectionReason: "" });
  }, [appointment, reset]);

  const onSubmit = (values: RejectAppointmentFormValues) => {
    if (!appointment) return;
    statusMutation.mutate(
      { id: appointment._id, payload: { status: "rejected", rejectionReason: values.rejectionReason } },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title={
        appointment?.adopterId
          ? `Reject appointment with ${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
          : "Reject appointment"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={statusMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={statusMutation.isPending}>
            Reject appointment
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
        {statusMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(statusMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
