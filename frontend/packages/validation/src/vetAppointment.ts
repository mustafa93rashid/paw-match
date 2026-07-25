/**
 * Zod schema mirroring src/validation/vetAppointment.js's
 * requestAppointmentValidation. `vetId` comes from the route, not the
 * form, so only requestMessage is a real form field.
 */
import { z } from "zod";

export const requestVetAppointmentSchema = z.object({
  requestMessage: z
    .string()
    .trim()
    .max(1000, "Message cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type RequestVetAppointmentFormValues = z.infer<typeof requestVetAppointmentSchema>;
