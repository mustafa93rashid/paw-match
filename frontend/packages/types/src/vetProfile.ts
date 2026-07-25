/**
 * Mirrors src/models/VetProfile.js and the responses of
 * src/controllers/vetProfile.controller.js `getAll`/`getOne` (both
 * auth-only, any role — not adopter-restricted).
 *
 * Note: like Shelter, VetProfile has no averageRating/totalReviews fields
 * declared on its schema, so Review.calcAverageRating's `$set` for
 * targetType "vet" is silently dropped by Mongoose's strict mode — same
 * confirmed limitation as shelters, ratings never actually persist.
 */
import type { ImageRef } from "./shelter";
import type { Review } from "./review";
import type { MongoId, UserRole } from "./common";

export type WeekDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type ConsultationType = "vetConsultation" | "behaviorTraining";

export interface VetProfileUserRef {
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
  isActive: boolean;
}

export interface VetProfileShelterRef {
  _id: MongoId;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logo: ImageRef | null;
  isActive: boolean;
}

export interface VetProfile {
  _id: MongoId;
  /**
   * Nullable in practice: Mongoose's populate() sets this to null when the
   * referenced User document doesn't exist (an orphaned reference), rather
   * than erroring. Confirmed live against real seed data — every VetProfile
   * in this database currently has userId: null. Must be handled, not
   * assumed populated.
   */
  userId: VetProfileUserRef | null;
  /** Null for an independent vet not attached to any shelter. */
  shelterId: VetProfileShelterRef | null;
  specialization: string | null;
  bio: string | null;
  experienceYears: number;
  /**
   * General weekday availability only — not real bookable time slots.
   * The backend has no slot/scheduling endpoint for adopters to query.
   */
  availableDays: WeekDay[];
  consultationTypes: ConsultationType[];
  isActive: boolean;
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * PUT /vet-profile/me body — the same 5 fields updateMyProfile whitelists
 * (src/controllers/vetProfile.controller.js). The backend 400s if any other
 * key is present, or if the body is empty (at least one field required) —
 * neither constraint is expressible in this type; both are enforced by the
 * form/zod schema instead, same convention as every other "at least one
 * field" backend rule in this codebase.
 */
export interface UpdateVetProfilePayload {
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  availableDays?: WeekDay[];
  consultationTypes?: ConsultationType[];
}
