/**
 * Zod schemas mirroring src/validation/userManagement.validate.js's
 * updateProfileValidation and src/validation/auth.validate.js's
 * changePasswordValidation / requestEmailUpdateValidation. Client-side
 * pre-checks only — the backend remains the source of truth.
 */
import { z } from "zod";
import { strongPassword } from "./auth";

/**
 * All fields optional here — "at least one changed field" and "only send
 * changed fields" are page-level concerns (diffing against RHF's
 * dirtyFields), not something a single static schema can express. Gender
 * is restricted to "male"/"female": the route validator additionally
 * accepts "other", but the User model's schema enum doesn't, so offering it
 * would guarantee a failed save.
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be between 2 and 30 characters")
    .max(30, "First name must be between 2 and 30 characters")
    .optional()
    .or(z.literal("")),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be between 2 and 30 characters")
    .max(30, "Last name must be between 2 and 30 characters")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Date of birth must use the YYYY-MM-DD format",
    })
    .refine((value) => new Date(value).getTime() <= Date.now(), {
      message: "Date of birth cannot be in the future",
    })
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female"]).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Phone must be between 7 and 20 characters")
    .max(20, "Phone must be between 7 and 20 characters")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .min(3, "Address must be between 3 and 300 characters")
    .max(300, "Address must be between 3 and 300 characters")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPassword,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Password confirmation does not match",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const requestEmailUpdateSchema = z.object({
  newEmail: z.string().trim().email("Please provide a valid email address"),
});

export type RequestEmailUpdateFormValues = z.infer<typeof requestEmailUpdateSchema>;
