import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, Textarea } from "@paw-match/ui";
import { scheduleAppointmentSchema } from "@paw-match/validation";
import type { ScheduleAppointmentFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { VetAppointment } from "@paw-match/types";
import { vetAppointmentVetHooks } from "../../../lib/vetAppointmentVetHooks";

export interface ScheduleAppointmentDialogProps {
  appointment: VetAppointment | null;
  onClose: () => void;
}

/** Only valid when the appointment's current status is "pending". The backend rejects with 409 if the chosen time conflicts with another of the vet's own scheduled appointments — that error is surfaced verbatim, never re-validated client-side. */
export const ScheduleAppointmentDialog = ({ appointment, onClose }: ScheduleAppointmentDialogProps) => {
  const scheduleMutation = vetAppointmentVetHooks.useScheduleVetAppointment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleAppointmentFormValues>({
    resolver: zodResolver(scheduleAppointmentSchema),
    defaultValues: { appointmentDate: "", duration: 30, vetNotes: "" },
  });

  useEffect(() => {
    if (appointment) reset({ appointmentDate: "", duration: 30, vetNotes: "" });
  }, [appointment, reset]);

  const onSubmit = (values: ScheduleAppointmentFormValues) => {
    if (!appointment) return;
    scheduleMutation.mutate(
      {
        id: appointment._id,
        payload: {
          appointmentDate: new Date(values.appointmentDate).toISOString(),
          duration: values.duration,
          vetNotes: values.vetNotes || undefined,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title={
        appointment?.adopterId
          ? `Schedule appointment with ${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
          : "Schedule appointment"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={scheduleMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={scheduleMutation.isPending}>
            Schedule
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Date & time"
          type="datetime-local"
          error={errors.appointmentDate?.message}
          {...register("appointmentDate")}
        />
        <Input
          label="Duration (minutes)"
          type="number"
          min={15}
          max={180}
          step={15}
          error={errors.duration?.message}
          {...register("duration", { valueAsNumber: true })}
        />
        <Textarea label="Notes (optional)" rows={3} error={errors.vetNotes?.message} {...register("vetNotes")} />
        {scheduleMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(scheduleMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
