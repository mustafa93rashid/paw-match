/**
 * Zod schemas mirroring src/validation/auth.validate.js. Client-side
 * pre-checks only — the backend remains the source of truth.
 */
import { z } from "zod";

/** Mirrors the backend's isStrongPassword rule (min 8, upper/lower/number/symbol). */
export const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol");

export const signInSchema = z.object({
  email: z.string().trim().email("Invalid email or password"),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * The backend's /auth/signup does not accept or require confirmPassword —
 * it's added here purely for client-side UX and is never sent to the API.
 */
export const signUpSchema = z
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
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const verifyCodeSchema = z.object({
  verificationCode: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain numbers only"),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** The backend's /auth/reset-password/:token does require confirmPassword. */
export const resetPasswordSchema = z
  .object({
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** The backend's /auth/activate-account/:token — same shape as resetPasswordSchema, kept separate since it's a distinct endpoint/flow. */
export const activateAccountSchema = z
  .object({
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
