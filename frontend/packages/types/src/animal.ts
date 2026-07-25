/**
 * Mirrors src/models/Animal.js and the response of
 * `GET /animals` (src/controllers/animal.controller.js `getAll`) — an
 * authenticated-only endpoint (any role, no dedicated adopter restriction).
 */
import type { MongoId, UserRole } from "./common";
import type { Species } from "./shelter";

export type AgeUnit = "months" | "years";
export type Gender = "male" | "female";
export type AnimalSize = "small" | "medium" | "large";
export type HealthStatus =
  | "healthy"
  | "needsCare"
  | "specialNeeds"
  | "underTreatment";
export type AdoptionStatus = "available" | "pending" | "adopted" | "unavailable";
export type HomeType = "apartment" | "house" | "farm" | "any";
export type ExperienceLevel = "beginner" | "intermediate" | "expert" | "any";
export type ActivityLevel = "low" | "medium" | "high";
export type OwnerType = "single" | "family" | "any";

/** Animal images are declared inline on the model without `{ _id: false }`. */
export interface AnimalImage {
  _id: MongoId;
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface AnimalRequirements {
  homeType: HomeType;
  suitableForKids: boolean;
  goodWithOtherPets: boolean;
  experienceLevel: ExperienceLevel;
  dailyActivityLevel: ActivityLevel;
  ownerType: OwnerType;
  hypoallergenic: boolean;
}

/**
 * `GET /animals` populates shelterId with name/city/address.
 * `GET /animals/:id` additionally includes phone.
 */
export interface AnimalShelterRef {
  _id: MongoId;
  name: string;
  city: string;
  address: string;
  phone?: string;
}

/** `GET /animals` populates addedBy with only these fields. */
export interface AnimalAddedByRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Animal {
  _id: MongoId;
  name: string;
  age: number;
  ageUnit: AgeUnit;
  species: Species;
  breed: string;
  gender: Gender;
  size: AnimalSize;
  color: string;
  healthStatus: HealthStatus;
  vaccinated: boolean;
  description?: string | null;
  images: AnimalImage[];
  adoptionStatus: AdoptionStatus;
  shelterId: AnimalShelterRef;
  addedBy: AnimalAddedByRef;
  requirements: AnimalRequirements;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mirrors src/services/matching.service.js's weighted dimensions — these
 * are conceptual match categories, not raw Animal/AdopterProfile field names.
 */
export type MatchDimension =
  | "species"
  | "homeType"
  | "kids"
  | "otherPets"
  | "experienceLevel"
  | "activityLevel"
  | "ownerType"
  | "allergy";

export type MatchLevel = "excellent" | "good" | "medium" | "low";

/** `GET /matching` populates shelterId with a different field set than `GET /animals`. */
export interface MatchedAnimalShelterRef {
  _id: MongoId;
  name: string;
  city: string;
  address: string;
  logo: { url: string; publicId: string } | null;
  isActive: boolean;
  isVerified: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
}

export interface MatchedAnimal extends Omit<Animal, "shelterId"> {
  shelterId: MatchedAnimalShelterRef;
  matchPercentage: number;
  matchLevel: MatchLevel;
  matchedFields: MatchDimension[];
  partialMatchedFields: MatchDimension[];
  unmatchedFields: MatchDimension[];
}

/**
 * POST /animals and PATCH /animals/:id share this exact field set for the
 * most part — both reject isActive/adoptionStatus/images if present. `shelterId`
 * is the one field that behaves differently by role and endpoint: on create
 * it's required for superadmin (400 if missing) and forbidden/ignored for a
 * shelterEmployee (auto-derived from their own ShelterEmployeeProfile); on
 * update it's superadmin-only (403 for anyone else) and, when present, moves
 * the animal to a different (approved) shelter. It must only ever be sent
 * when the caller is superadmin. The edit form always sends the full set,
 * never a partial diff, so one payload type covers both endpoints.
 */
export interface AnimalPayload {
  name: string;
  age: number;
  ageUnit: AgeUnit;
  species: Species;
  breed: string;
  gender: Gender;
  size: AnimalSize;
  color: string;
  healthStatus: HealthStatus;
  vaccinated: boolean;
  description?: string;
  requirements: AnimalRequirements;
  shelterId?: string;
}
