import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal, Textarea } from "@paw-match/ui";
import { completeAppointmentSchema } from "@paw-match/validation";
import type { CompleteAppointmentFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { VetAppointment } from "@paw-match/types";
import { vetAppointmentVetHooks } from "../../../lib/vetAppointmentVetHooks";

export interface CompleteAppointmentDialogProps {
  appointment: VetAppointment | null;
  onClose: () => void;
}

/** Only valid when the appointment's current status is "scheduled". */
export const CompleteAppointmentDialog = ({ appointment, onClose }: CompleteAppointmentDialogProps) => {
  const statusMutation = vetAppointmentVetHooks.useUpdateVetAppointmentStatus();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteAppointmentFormValues>({
    resolver: zodResolver(completeAppointmentSchema),
    defaultValues: { vetNotes: "" },
  });

  useEffect(() => {
    if (appointment) reset({ vetNotes: "" });
  }, [appointment, reset]);

  const onSubmit = (values: CompleteAppointmentFormValues) => {
    if (!appointment) return;
    statusMutation.mutate(
      { id: appointment._id, payload: { status: "completed", vetNotes: values.vetNotes || undefined } },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title={
        appointment?.adopterId
          ? `Complete appointment with ${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
          : "Complete appointment"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={statusMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={statusMutation.isPending}>
            Mark completed
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Textarea label="Notes (optional)" rows={3} error={errors.vetNotes?.message} {...register("vetNotes")} />
        {statusMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(statusMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
