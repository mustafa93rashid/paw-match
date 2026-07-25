/**
 * Zod schemas mirroring src/validation/staffApplication.validate.js. Field
 * rules mirror shelter.ts's shelterFormSchema / vetProfile.ts's
 * vetProfileFormSchema, but shelterData/vetData stay genuinely nested here
 * (register("shelterData.name") etc.) rather than flattened-then-rebuilt,
 * since this is a fresh application form, not an edit of existing data —
 * the nested shape also maps directly onto SubmitStaffApplicationPayload
 * with no reconstruction step.
 */
import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .url("Must be a valid URL starting with http:// or https://")
  .optional()
  .or(z.literal(""));

const applicantFieldsShape = {
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be between 2 and 30 characters")
    .max(30, "First name must be between 2 and 30 characters"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be between 2 and 30 characters")
    .max(30, "Last name must be between 2 and 30 characters"),
  email: z.string().trim().email("Please provide a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone must be between 7 and 20 characters")
    .max(20, "Phone must be between 7 and 20 characters")
    .regex(/^[0-9+\-\s()]+$/, "Phone contains invalid characters"),
  address: z
    .string()
    .trim()
    .min(3, "Address must be between 3 and 300 characters")
    .max(300, "Address must be between 3 and 300 characters"),
  dateOfBirth: z.string().trim().optional().or(z.literal("")),
  gender: z.enum(["male", "female"]).optional().or(z.literal("")),
};

const shelterDataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Shelter name must be between 2 and 100 characters")
    .max(100, "Shelter name must be between 2 and 100 characters"),
  email: z.string().trim().email("Please enter a valid shelter email"),
  phone: z
    .string()
    .trim()
    .min(7, "Shelter phone must be between 7 and 20 characters")
    .max(20, "Shelter phone must be between 7 and 20 characters")
    .regex(/^[0-9+\-\s()]+$/, "Shelter phone contains invalid characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .min(3, "Shelter address must be between 3 and 300 characters")
    .max(300, "Shelter address must be between 3 and 300 characters"),
  city: z
    .string()
    .trim()
    .min(2, "Shelter city must be between 2 and 100 characters")
    .max(100, "Shelter city must be between 2 and 100 characters"),
  supportedSpecies: z.array(z.enum(["dog", "cat", "bird", "rabbit", "fish", "other"])),
  capacity: z.number({ message: "Capacity must be a number" }).min(0, "Capacity cannot be negative"),
  operatingHours: z.object({
    open: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Opening time must use HH:mm format")
      .optional()
      .or(z.literal("")),
    close: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Closing time must use HH:mm format")
      .optional()
      .or(z.literal("")),
  }),
  socialLinks: z.object({
    facebook: urlOrEmpty,
    instagram: urlOrEmpty,
    website: urlOrEmpty,
  }),
});

const vetDataSchema = z.object({
  specialization: z
    .string()
    .trim()
    .max(200, "Specialization cannot exceed 200 characters")
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

export const shelterManagerApplicationSchema = z.object({
  ...applicantFieldsShape,
  shelterData: shelterDataSchema,
});

export type ShelterManagerApplicationFormValues = z.infer<typeof shelterManagerApplicationSchema>;

export const vetApplicationSchema = z.object({
  ...applicantFieldsShape,
  vetData: vetDataSchema,
});

export type VetApplicationFormValues = z.infer<typeof vetApplicationSchema>;

export const verifyApplicationSchema = z.object({
  verificationCode: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain numbers only"),
});

export type VerifyApplicationInput = z.infer<typeof verifyApplicationSchema>;

/** Dashboard-only — rejecting an application requires a reason, same convention as rejectShelterSchema. */
export const rejectApplicationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Rejection reason is required")
    .max(1000, "Rejection reason cannot exceed 1000 characters"),
});

export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;

/** Shared by "resend verification code" and "resend activation email" — both endpoints take only an email. */
export const resendByEmailSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
});

export type ResendByEmailInput = z.infer<typeof resendByEmailSchema>;

/**
 * Dashboard edit forms — Super Admin, "pending" applications only. Reuses
 * the exact same phone/address/shelterData/vetData field rules as the
 * public application forms (applicantFieldsShape/shelterDataSchema/
 * vetDataSchema above); deliberately excludes firstName/lastName/email/
 * dateOfBirth/gender/applicationType, none of which are editable — see
 * UpdateStaffApplicationPayload's doc comment.
 */
export const editShelterManagerApplicationSchema = z.object({
  phone: applicantFieldsShape.phone,
  address: applicantFieldsShape.address,
  shelterData: shelterDataSchema,
});

export type EditShelterManagerApplicationFormValues = z.infer<
  typeof editShelterManagerApplicationSchema
>;

export const editVetApplicationSchema = z.object({
  phone: applicantFieldsShape.phone,
  address: applicantFieldsShape.address,
  vetData: vetDataSchema,
});

export type EditVetApplicationFormValues = z.infer<typeof editVetApplicationSchema>;
