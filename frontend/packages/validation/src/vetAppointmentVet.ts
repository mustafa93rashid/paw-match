/**
 * Zod schemas mirroring src/validation/vetAppointment.validate.js's
 * scheduleAppointmentValidation and updateAppointmentStatusValidation.
 */
import { z } from "zod";

export const scheduleAppointmentSchema = z.object({
  appointmentDate: z.string().min(1, "Date and time are required"),
  duration: z
    .number({ message: "Duration is required" })
    .min(15, "Duration must be between 15 and 180 minutes")
    .max(180, "Duration must be between 15 and 180 minutes"),
  vetNotes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type ScheduleAppointmentFormValues = z.infer<typeof scheduleAppointmentSchema>;

export const completeAppointmentSchema = z.object({
  vetNotes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CompleteAppointmentFormValues = z.infer<typeof completeAppointmentSchema>;

export const rejectAppointmentSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, "A reason is required")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type RejectAppointmentFormValues = z.infer<typeof rejectAppointmentSchema>;
