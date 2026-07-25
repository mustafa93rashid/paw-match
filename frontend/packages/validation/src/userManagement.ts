/**
 * Zod schemas mirroring src/validation/userManagement.validate.js's
 * createUserByAdminValidation. `position` isn't part of that backend
 * validator at all — POST /user/create-user only accepts firstName/
 * lastName/email/password/role — it's a client-side-only field that drives
 * a *second* request (PUT /shelter-employee-profile/:userId/work-data) once
 * the user exists. See CreateUserDialog/ChangeRoleDialog for that two-step
 * flow.
 */
import { z } from "zod";
import { strongPassword } from "./auth";

export const createUserSchema = z
  .object({
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
    password: strongPassword,
    role: z.enum(["shelterEmployee", "vet", "adopter"], { message: "Please select a role" }),
    position: z.enum(["manager", "employee"]).optional().or(z.literal("")),
  })
  .refine((data) => data.role !== "shelterEmployee" || data.position, {
    message: "Please select whether this employee is a Manager or Employee",
    path: ["position"],
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

/** Shared by ChangeRoleDialog — same position field, no name/email/password. */
export const changeRoleSchema = z
  .object({
    role: z.enum(["shelterEmployee", "vet", "adopter"], { message: "Please select a role" }),
    position: z.enum(["manager", "employee"]).optional().or(z.literal("")),
  })
  .refine((data) => data.role !== "shelterEmployee" || data.position, {
    message: "Please select whether this employee is a Manager or Employee",
    path: ["position"],
  });

export type ChangeRoleFormValues = z.infer<typeof changeRoleSchema>;
