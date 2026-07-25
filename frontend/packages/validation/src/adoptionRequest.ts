/**
 * Zod schema mirroring src/validation/adoptionRequest.validate.js's
 * createRequestValidation. `animalId` comes from the route, not the form,
 * so only `message` is a real form field.
 */
import { z } from "zod";

export const createAdoptionRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .max(1000, "Message cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateAdoptionRequestFormValues = z.infer<typeof createAdoptionRequestSchema>;
