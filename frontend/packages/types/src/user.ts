/**
 * Mirrors src/models/User.js and the fields returned by
 * `GET /user/profile` and the `data` field of `POST /auth/signin`
 * (both exclude password/reset-token fields via the same select list).
 */
import type { ImageRef } from "./shelter";
import type { MongoId, UserRole } from "./common";

export interface AuthUser {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  profileImage?: ImageRef | null;
}

/**
 * Mirrors src/validation/userManagement.validate.js's updateProfileValidation
 * — at least one field is required, and no fields beyond these six are
 * accepted (extra fields → 400). The User model's gender enum only allows
 * "male"/"female" (the route validator additionally allows "other", which
 * would pass validation but fail at the Mongoose schema level), so "other"
 * is intentionally not offered here.
 */
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  phone?: string;
  address?: string;
}

/** Mirrors src/validation/auth.validate.js's changePasswordValidation. */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface RequestEmailUpdatePayload {
  newEmail: string;
}

export interface RequestEmailUpdateResult {
  email: string;
  expiresInMinutes: number;
}

export interface VerifyEmailUpdatePayload {
  verificationCode: string;
}

/** POST /user/create-user body — Super Admin only. Mirrors src/validation/userManagement.validate.js's createUserByAdminValidation. */
export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "superadmin">;
}

/**
 * Shape returned by `GET /user` and `GET /user/:id` (Super Admin only) —
 * every registered user with the same sensitive-field exclusions as
 * `GET /user/profile` (password, reset token, verification code, refresh
 * token), plus `createdAt`, which the self-service AuthUser shape omits.
 */
export interface AdminUser extends AuthUser {
  createdAt: string;
}

/** `data` shape returned by `PUT /user/:id/role` — deliberately partial, see user.controller.js's updateRole. */
export interface UpdateUserRoleResult {
  _id: MongoId;
  role: UserRole;
}

/** `data` shape returned by `PUT /user/:id/status` — deliberately partial, see user.controller.js's updateStatus. */
export interface UpdateUserStatusResult {
  _id: MongoId;
  role: UserRole;
  isActive: boolean;
}
