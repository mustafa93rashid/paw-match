/**
 * Zod schema mirroring src/validation/shelter.validate.js's
 * createShelterValidation (updateShelterValidation shares the same field
 * set, just with everything optional server-side — this form always
 * resubmits the full object on edit, same convention as animal.ts).
 */
import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .url("Must be a valid URL starting with http:// or https://")
  .optional()
  .or(z.literal(""));

export const shelterFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be between 2 and 100 characters").max(100, "Name must be between 2 and 100 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone must be between 7 and 20 characters")
    .max(20, "Phone must be between 7 and 20 characters")
    .regex(/^[0-9+\-\s()]+$/, "Phone contains invalid characters"),
  description: z.string().trim().max(2000, "Description cannot exceed 2000 characters").optional().or(z.literal("")),
  address: z.string().trim().min(3, "Address must be between 3 and 300 characters").max(300, "Address must be between 3 and 300 characters"),
  city: z.string().trim().min(2, "City must be between 2 and 100 characters").max(100, "City must be between 2 and 100 characters"),
  capacity: z.number({ message: "Capacity must be a number" }).min(0, "Capacity cannot be negative"),
  supportedSpecies: z.array(z.enum(["dog", "cat", "bird", "rabbit", "fish", "other"])),
  operatingHoursOpen: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Opening time must use HH:mm format")
    .optional()
    .or(z.literal("")),
  operatingHoursClose: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Closing time must use HH:mm format")
    .optional()
    .or(z.literal("")),
  facebook: urlOrEmpty,
  instagram: urlOrEmpty,
  website: urlOrEmpty,
});

export type ShelterFormValues = z.infer<typeof shelterFormSchema>;
