/**
 * Zod schemas mirroring src/validation/adoptionRequest.validate.js's
 * rejectRequestValidation and cancelApprovedRequestValidation (both require
 * a 3-1000 character reason).
 */
import { z } from "zod";

export const rejectAdoptionRequestSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(3, "Rejection reason must be between 3 and 1000 characters")
    .max(1000, "Rejection reason must be between 3 and 1000 characters"),
});

export type RejectAdoptionRequestFormValues = z.infer<typeof rejectAdoptionRequestSchema>;

export const cancelApprovedRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Cancellation reason must be between 3 and 1000 characters")
    .max(1000, "Cancellation reason must be between 3 and 1000 characters"),
});

export type CancelApprovedRequestFormValues = z.infer<typeof cancelApprovedRequestSchema>;
