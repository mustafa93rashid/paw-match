/**
 * Mirrors src/models/AdopterProfile.js and
 * src/controllers/adopterProfile.controller.js `getMyProfile`/`updateMyProfile`.
 *
 * Note: `preferredSpecies` exists on the model and is accepted by
 * src/validation/adopterProfile.js, but the controller's own `allowedFields`
 * whitelist omits it — any value submitted is silently dropped and never
 * persisted. It's included here for completeness (GET responses may still
 * echo whatever was set directly in the DB), but intentionally has no form
 * field in the UI, since building one would be non-functional.
 */
import type { ImageRef, Species } from "./shelter";
import type { MongoId, UserRole } from "./common";

export type AdopterHomeType = "apartment" | "house" | "farm";
export type AdopterExperienceLevel = "beginner" | "intermediate" | "expert";
export type AdopterActivityLevel = "low" | "medium" | "high";
export type AdopterOwnerType = "single" | "family";

export interface AdopterProfileUserRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  address?: string;
  profileImage?: ImageRef | null;
  role: UserRole;
}

export interface AdopterProfile {
  _id: MongoId;
  /**
   * Nullable: if the referenced User account was deleted, populate resolves
   * it to null rather than erroring — confirmed against real seeded data (8
   * of 11 AdopterProfile documents currently have an orphaned userId). Same
   * convention as ShelterAdoptionRequest.adopterId, ReviewAuthor, and
   * VetAppointmentPersonRef elsewhere in this package.
   */
  userId: AdopterProfileUserRef | null;
  homeType: AdopterHomeType | null;
  hasKids: boolean | null;
  hasOtherPets: boolean | null;
  experienceLevel: AdopterExperienceLevel | null;
  dailyActivityLevel: AdopterActivityLevel | null;
  isAllergic: boolean | null;
  ownerType: AdopterOwnerType | null;
  preferredSpecies: Species[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The only fields the controller actually persists (see note above). */
export interface UpdateAdopterProfilePayload {
  homeType?: AdopterHomeType;
  hasKids?: boolean;
  hasOtherPets?: boolean;
  experienceLevel?: AdopterExperienceLevel;
  dailyActivityLevel?: AdopterActivityLevel;
  isAllergic?: boolean;
  ownerType?: AdopterOwnerType;
}

/** Exactly matches matching.controller.js's requiredProfileFields list. */
export const REQUIRED_MATCHING_FIELDS = [
  "homeType",
  "hasKids",
  "hasOtherPets",
  "experienceLevel",
  "dailyActivityLevel",
  "isAllergic",
  "ownerType",
] as const;

/**
 * Exactly matches adoptionRequest.controller.js createRequest's
 * isProfileCompleted check — a narrower subset than matching's: notably
 * hasKids/hasOtherPets are NOT required to submit an adoption request.
 */
export const REQUIRED_ADOPTION_REQUEST_FIELDS = [
  "homeType",
  "ownerType",
  "experienceLevel",
  "dailyActivityLevel",
  "isAllergic",
] as const;
