/**
 * Zod schema mirroring src/validation/animal.validate.js's create/update
 * animal validators (both share the same field set for this form). Boolean-
 * like fields use "true"/"false" string enums bound to <select> elements,
 * converted to real booleans at submit time — same convention as
 * adopterProfile.ts.
 *
 * `shelterId` isn't part of the backend's per-field validator (it has its
 * own controller-level rules — see AnimalPayload's doc comment) but the form
 * needs it to be conditionally required: a Super Admin must pick a shelter
 * before submit, a shelterEmployee never sees the field at all. `requireShelterId`
 * is decided by the caller (based on the logged-in user's role, not by
 * anything in the form data itself), so it's a factory rather than a single
 * static schema.
 */
import { z } from "zod";

const animalFormShape = {
  name: z
    .string()
    .trim()
    .min(2, "Name must be between 2 and 50 characters")
    .max(50, "Name must be between 2 and 50 characters"),
  age: z.number({ message: "Age is required" }).min(0, "Age cannot be negative"),
  ageUnit: z.enum(["months", "years"], { message: "Please select an age unit" }),
  species: z.enum(["dog", "cat", "bird", "rabbit", "fish", "other"], {
    message: "Please select a species",
  }),
  breed: z.string().trim().min(1, "Breed is required").max(100, "Breed cannot exceed 100 characters"),
  gender: z.enum(["male", "female"], { message: "Please select a gender" }),
  size: z.enum(["small", "medium", "large"], { message: "Please select a size" }),
  color: z.string().trim().min(1, "Color is required").max(100, "Color cannot exceed 100 characters"),
  healthStatus: z.enum(["healthy", "needsCare", "specialNeeds", "underTreatment"], {
    message: "Please select a health status",
  }),
  vaccinated: z.enum(["true", "false"], { message: "Please select an option" }),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  homeType: z.enum(["apartment", "house", "farm", "any"], { message: "Please select a home type" }),
  suitableForKids: z.enum(["true", "false"], { message: "Please select an option" }),
  goodWithOtherPets: z.enum(["true", "false"], { message: "Please select an option" }),
  experienceLevel: z.enum(["beginner", "intermediate", "expert", "any"], {
    message: "Please select an experience level",
  }),
  dailyActivityLevel: z.enum(["low", "medium", "high"], { message: "Please select an activity level" }),
  ownerType: z.enum(["single", "family", "any"], { message: "Please select an owner type" }),
  hypoallergenic: z.enum(["true", "false"], { message: "Please select an option" }),
  shelterId: z.string().trim().optional().or(z.literal("")),
};

export const createAnimalFormSchema = (requireShelterId: boolean) =>
  z.object(animalFormShape).refine((data) => !requireShelterId || Boolean(data.shelterId), {
    message: "Please select a shelter",
    path: ["shelterId"],
  });

/** Default schema for the shelterEmployee case, where shelterId is never shown or required. */
export const animalFormSchema = createAnimalFormSchema(false);

export type AnimalFormValues = z.infer<typeof animalFormSchema>;
