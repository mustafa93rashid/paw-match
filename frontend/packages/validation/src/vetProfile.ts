/**
 * Zod schema mirroring src/validation/vetProfile.validate.js's
 * updateMyProfileValidation. `experienceYears` is required here (not
 * optional) since the form always displays and resubmits the vet's current
 * value — this is an in-place edit form, not a partial-diff PATCH form.
 */
import { z } from "zod";

export const vetProfileFormSchema = z.object({
  specialization: z
    .string()
    .trim()
    .min(2, "Specialization must be between 2 and 100 characters")
    .max(100, "Specialization must be between 2 and 100 characters")
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().max(1000, "Bio cannot exceed 1000 characters").optional().or(z.literal("")),
  experienceYears: z
    .number({ message: "Experience years is required" })
    .min(0, "Experience years cannot be negative")
    .max(80, "Experience years cannot exceed 80"),
  availableDays: z.array(
    z.enum(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]),
  ),
  consultationTypes: z.array(z.enum(["vetConsultation", "behaviorTraining"])),
});

export type VetProfileFormValues = z.infer<typeof vetProfileFormSchema>;
