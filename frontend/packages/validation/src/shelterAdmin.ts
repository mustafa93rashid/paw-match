/**
 * Zod schemas mirroring src/validation/shelter.validate.js's
 * rejectShelterValidation and src/validation/shelterEmployeeProfile.validate.js's
 * updateEmployeeWorkDataValidation.
 */
import { z } from "zod";

export const rejectShelterSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Rejection reason must be between 3 and 1000 characters")
    .max(1000, "Rejection reason must be between 3 and 1000 characters"),
});

export type RejectShelterFormValues = z.infer<typeof rejectShelterSchema>;

/** Superadmin only — promotes/demotes and edits employeeNumber/hireDate. Position accepted case-insensitively by the backend; this form always sends lowercase. */
export const employeeWorkDataSchema = z.object({
  position: z.enum(["manager", "employee"], { message: "Please select a position" }),
  employeeNumber: z
    .string()
    .trim()
    .refine((value) => value === "" || (value.length >= 2 && value.length <= 50), {
      message: "Employee number must be between 2 and 50 characters",
    }),
  hireDate: z.string().trim(),
});

export type EmployeeWorkDataFormValues = z.infer<typeof employeeWorkDataSchema>;
