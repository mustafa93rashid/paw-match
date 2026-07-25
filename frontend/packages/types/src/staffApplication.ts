/**
 * Mirrors src/models/StaffApplication.js and the responses of
 * src/controllers/staffApplication.controller.js.
 */
import type { MongoId, UserRole } from "./common";
import type { ShelterPayload } from "./shelter";
import type { UpdateVetProfilePayload } from "./vetProfile";

export type ApplicationType = "shelterManager" | "vet";
export type ApplicationStatus = "pendingVerification" | "pending" | "approved" | "rejected";
export type ApplicantGender = "male" | "female";

export interface StaffApplicationReviewerRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
}

export interface StaffApplicationApprovedUserRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  /** False until the applicant completes POST /auth/activate-account/:token — distinct from the application's own "approved" status. */
  isAccountActivated: boolean;
}

export interface StaffApplication {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth?: string | null;
  gender?: ApplicantGender | null;
  applicationType: ApplicationType;
  emailVerified: boolean;
  status: ApplicationStatus;
  /** Populated only when applicationType is "shelterManager". */
  shelterData?: ShelterPayload | null;
  /** Populated only when applicationType is "vet". */
  vetData?: UpdateVetProfilePayload | null;
  reviewedBy?: StaffApplicationReviewerRef | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  approvedUserId?: StaffApplicationApprovedUserRef | null;
  /** Who last edited the application's business fields via PATCH /staff-applications/:id — null if never edited. */
  updatedBy?: StaffApplicationReviewerRef | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * POST /staff-applications body. applicationType decides which nested data
 * object is required — the backend rejects shelterData on a "vet"
 * application and vice versa (never both, never neither).
 */
export interface SubmitStaffApplicationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth?: string;
  gender?: ApplicantGender;
  applicationType: ApplicationType;
  shelterData?: ShelterPayload;
  vetData?: UpdateVetProfilePayload;
}

export interface VerifyStaffApplicationPayload {
  email: string;
  verificationCode: string;
}

export interface SubmitStaffApplicationResult {
  email: string;
  applicationType: ApplicationType;
  expiresInMinutes: number;
}

/** POST /staff-applications/resend-verification and POST /staff-applications/resend-activation both take only this. */
export interface ResendByEmailPayload {
  email: string;
}

/**
 * PATCH /staff-applications/:id body — Super Admin only, "pending" status
 * only. Deliberately excludes firstName/lastName/email/dateOfBirth/gender/
 * applicationType (none are editable — see staffApplication.validate.js's
 * updateApplicationValidation). shelterData/vetData, when provided, always
 * replace the full nested object, never a partial merge.
 */
export interface UpdateStaffApplicationPayload {
  phone?: string;
  address?: string;
  shelterData?: ShelterPayload;
  vetData?: UpdateVetProfilePayload;
}
