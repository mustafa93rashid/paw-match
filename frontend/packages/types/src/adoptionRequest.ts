/**
 * Mirrors src/models/AdoptionRequest.js and
 * src/controllers/adoptionRequest.controller.js — adopter-relevant subset
 * only (create, list own, cancel). GET /adoptions/:id, /shelter, and the
 * status/approve/reject/complete/cancel-approval routes are
 * shelterEmployee/superadmin concerns and out of scope for this site.
 *
 * `adopterId` is intentionally not modeled: getMyRequests doesn't populate
 * it at all (it's always the current user), and create/cancel populate it
 * with different fields than are needed here — nothing in this UI ever
 * needs to display "who made this request."
 */
import type { AnimalImage, AdoptionStatus, Gender, AgeUnit, AnimalSize } from "./animal";
import type { ImageRef, Species } from "./shelter";
import type { MongoId, UserRole } from "./common";

/** Verbatim from the model's enum — the only 7 statuses that exist. */
export type AdoptionRequestStatus =
  | "pendingReview"
  | "interview"
  | "homeCheck"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export interface AdoptionRequestAnimalRef {
  _id: MongoId;
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  age: number;
  ageUnit: AgeUnit;
  /** Present on create/cancel/getById's populate, absent on getMyRequests's. */
  size?: AnimalSize;
  healthStatus?: string;
  vaccinated?: boolean;
  images: AnimalImage[];
  adoptionStatus: AdoptionStatus;
  isActive: boolean;
}

export interface AdoptionRequestShelterRef {
  _id: MongoId;
  name: string;
  city: string;
  address: string;
  phone: string;
  logo: ImageRef | null;
}

export interface AdoptionRequestReviewerRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AdoptionRequest {
  _id: MongoId;
  animalId: AdoptionRequestAnimalRef;
  shelterId: AdoptionRequestShelterRef;
  message: string | null;
  status: AdoptionRequestStatus;
  rejectionReason: string | null;
  reviewedBy: AdoptionRequestReviewerRef | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /adoptions body — no other fields exist in the validator. */
export interface CreateAdoptionRequestPayload {
  animalId: string;
  message?: string;
}

/**
 * Populated adopterId as returned by GET /adoptions/shelter and
 * GET /adoptions/:id for a shelterEmployee/superadmin caller — the
 * adopter-facing AdoptionRequest type above intentionally omits this (see
 * its header comment); the shelter-facing view needs to show who's asking.
 */
export interface AdoptionRequestAdopterRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  profileImage?: ImageRef | null;
}

/**
 * Shape returned by GET /adoptions/shelter and GET /adoptions/:id for
 * shelterEmployee/superadmin — adds the populated adopterId. Nullable: if
 * the referenced User (adopter) account was deleted, populate resolves it to
 * null rather than erroring — confirmed against real seeded data (a Diyala
 * Animal Rescue Center adoption request currently has adopterId: null).
 */
export interface ShelterAdoptionRequest extends AdoptionRequest {
  adopterId: AdoptionRequestAdopterRef | null;
}
