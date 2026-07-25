/**
 * Zod schema mirroring src/validation/adopterProfile.js's
 * updateAdopterProfileValidation. All 7 fields are required for matching
 * (matching.controller.js's requiredProfileFields), so the form requires
 * all of them even though the backend technically allows partial updates.
 *
 * Boolean-like fields are modeled as "true"/"false" string enums to match
 * <select> element values — converted to real booleans at submit time,
 * not via a zod transform (keeps the RHF generic type simple).
 */
import { z } from "zod";

export const adopterProfileSchema = z.object({
  homeType: z.enum(["apartment", "house", "farm"], {
    message: "Please select a home type",
  }),
  hasKids: z.enum(["true", "false"], { message: "Please select an option" }),
  hasOtherPets: z.enum(["true", "false"], { message: "Please select an option" }),
  experienceLevel: z.enum(["beginner", "intermediate", "expert"], {
    message: "Please select your experience level",
  }),
  dailyActivityLevel: z.enum(["low", "medium", "high"], {
    message: "Please select an activity level",
  }),
  isAllergic: z.enum(["true", "false"], { message: "Please select an option" }),
  ownerType: z.enum(["single", "family"], {
    message: "Please select an owner type",
  }),
});

export type AdopterProfileFormValues = z.infer<typeof adopterProfileSchema>;
