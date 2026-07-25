/**
 * Types mirroring src/models/Shelter.js and the responses of
 * src/controllers/shelter.controller.js `getPublicShelters` and
 * `getNearestShelters` (the only two unauthenticated shelter endpoints).
 */
import type { MongoId, UserRole } from "./common";
import type { Review } from "./review";

export type Species = "dog" | "cat" | "bird" | "rabbit" | "fish" | "other";

/** Matches src/models/image_schema.js (no `_id`, used for Shelter logo/images). */
export interface ImageRef {
  url: string;
  publicId: string;
}

export interface GeoPoint {
  type: "Point";
  /** [longitude, latitude] */
  coordinates: [number, number];
}

export interface OperatingHours {
  open: string | null;
  close: string | null;
  /** Mongoose adds an _id to this subdocument since it isn't declared with `{ _id: false }`. */
  _id?: MongoId;
}

export interface ShelterSocialLinks {
  facebook: string | null;
  instagram: string | null;
  website: string | null;
}

/**
 * POST /shelters and PATCH /shelters/:id body — same field set for create
 * and update (mirrors createShelterValidation/updateShelterValidation,
 * which share every field). Logo/images are intentionally excluded: both
 * endpoints reject them if present (400 "must be managed through image
 * endpoints"), managed instead via the dedicated logo/gallery endpoints.
 * Used identically by superadmin and a shelterEmployee manager — the
 * backend, not this payload shape, is what differs per caller.
 */
export interface ShelterPayload {
  name: string;
  email: string;
  phone: string;
  description?: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  supportedSpecies?: Species[];
  capacity?: number;
  operatingHours?: { open?: string | null; close?: string | null };
  socialLinks?: { facebook?: string | null; instagram?: string | null; website?: string | null };
}

/** Shape returned by `GET /shelters` (public, no auth). */
export interface PublicShelter {
  _id: MongoId;
  name: string;
  email: string;
  phone: string;
  logo: ImageRef | null;
  images: ImageRef[];
  description?: string;
  address: string;
  city: string;
  location?: GeoPoint;
  supportedSpecies: Species[];
  capacity: number;
  operatingHours: OperatingHours;
  socialLinks: ShelterSocialLinks;
  createdAt: string;
}

/** Shape returned by `GET /shelters/nearest` (public, no auth) — a distinct, smaller projection. */
export interface NearestShelter {
  _id: MongoId;
  name: string;
  logo: ImageRef | null;
  images: ImageRef[];
  address: string;
  city: string;
  phone: string;
  supportedSpecies: Species[];
  operatingHours: OperatingHours;
  location: GeoPoint;
  distanceInMeters: number;
  distanceInKm: number;
}

/** Animal fields populated onto animalIds by the authenticated getShelterById "public" tier. */
export interface ShelterDetailAnimal {
  _id: MongoId;
  name: string;
  species: Species;
  breed: string;
  gender: "male" | "female";
  age: number;
  ageUnit: "months" | "years";
  size: "small" | "medium" | "large";
  color: string;
  healthStatus: string;
  vaccinated: boolean;
  description?: string | null;
  images: Array<{ url: string; publicId: string; isPrimary?: boolean; _id?: MongoId }>;
  adoptionStatus: string;
}

/**
 * Shape returned by `GET /shelters/:id` for an authenticated adopter (the
 * "public" accessLevel branch — adopters never hit the shelterEmployee or
 * superadmin branches, which are dashboard-only concerns and not modeled
 * here). Strictly richer than PublicShelter: adds rating, reviews, and the
 * shelter's own animals.
 */
export interface AuthedShelterDetail extends PublicShelter {
  averageRating?: number;
  totalReviews?: number;
  verificationStatus: "pending" | "approved" | "rejected";
  isVerified: boolean;
  isActive: boolean;
  updatedAt: string;
  animalIds: ShelterDetailAnimal[];
  reviews: Review[];
}

export interface AuthedShelterResponse {
  success: true;
  accessLevel: "public" | "shelterEmployee" | "superadmin";
  data: AuthedShelterDetail;
}

/**
 * `createdBy`/`verifiedBy` as populated by `GET /shelters/admin/all` (see
 * shelter.controller.js `getAllShelters` — `.populate("createdBy", "firstName lastName email role")`
 * and `.populate("verifiedBy", "firstName lastName email")`). `role` is only
 * ever present on `createdBy`; `verifiedBy` never includes it.
 */
export interface AdminShelterRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  role?: UserRole;
}

/**
 * Shape returned by `GET /shelters/admin/all` (Super Admin only) — every
 * shelter regardless of verification/active status. Mirrors
 * shelter.controller.js `getAllShelters`; the approve/reject/status/delete
 * endpoints mutate and return this same shape (delete returns a summary
 * instead — see @paw-match/api-client's DeleteShelterResult).
 */
export interface AdminShelter extends PublicShelter {
  verificationStatus: "pending" | "approved" | "rejected";
  isVerified: boolean;
  isActive: boolean;
  rejectionReason: string | null;
  verifiedAt: string | null;
  updatedAt: string;
  /**
   * Null whenever the referenced User document no longer exists (Mongoose
   * `populate` resolves a dangling ref to null even though the schema marks
   * `createdBy` required) — confirmed against real seeded data, where every
   * shelter currently has `createdBy: null`.
   */
  createdBy: AdminShelterRef | null;
  verifiedBy: AdminShelterRef | null;
  /** Raw, unpopulated User ObjectIds — GET /shelters/admin/all never populates this field. Mixed shelterEmployee + vet IDs. */
  employees: MongoId[];
}

/**
 * One entry of the `employees` array as populated by GET /shelters/:id for
 * a shelterEmployee caller (`.populate("employees", "firstName lastName
 * email phone role profileImage isActive")`). Nullable per-entry: if a
 * referenced User was deleted, populate resolves that slot to null — the
 * exact same class of bug confirmed for AdminShelter.createdBy in Phase 2.
 *
 * `position` is additively merged in server-side (not part of the User
 * populate — it's a ShelterEmployeeProfile field) because a shelterEmployee
 * caller has no other accessible endpoint to look up a teammate's position.
 * Null for a `role: "vet"` entry, which has no ShelterEmployeeProfile.
 */
export interface ShelterTeamMemberRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: ImageRef | null;
  isActive: boolean;
  position: "manager" | "employee" | null;
}

/**
 * Shape returned by GET /shelters/:id for the "shelterEmployee" accessLevel
 * branch — same admin-style fields as AdminShelter, plus the populated
 * `employees` array (used by both My Shelter and the Shelter Employees team
 * list, which share this one fetch).
 */
export interface ShelterEmployeeShelterDetail extends Omit<AdminShelter, "employees"> {
  /** Populated here (unlike AdminShelter.employees, which is the raw ObjectId array). */
  employees: (ShelterTeamMemberRef | null)[];
  /**
   * GET /shelters/:id's shelterEmployee accessLevel branch always includes
   * this (via the same getShelterReviews helper the superadmin branch uses,
   * filtered to status:"published") — this type simply never modeled it
   * until now. `Review` is already imported at the top of this file.
   */
  reviews: Review[];
}
