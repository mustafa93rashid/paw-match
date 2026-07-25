/**
 * Mirrors src/models/ShelterEmployeeProfile.js and the response of
 * GET /shelter-employee-profile/me (src/controllers/shelterEmployeeProfile.controller.js).
 */
import type { ImageRef } from "./shelter";
import type { MongoId, UserRole } from "./common";

export type ShelterEmployeePosition = "manager" | "employee";

export interface ShelterEmployeeProfileUserRef {
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

export interface ShelterEmployeeProfileShelterRef {
  _id: MongoId;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

/** Shape returned by GET /shelter-employee-profile/me. `shelterId` is null until an employee is assigned to (or after being removed from) a shelter. */
export interface ShelterEmployeeProfile {
  _id: MongoId;
  userId: ShelterEmployeeProfileUserRef;
  shelterId: ShelterEmployeeProfileShelterRef | null;
  position: ShelterEmployeePosition;
  employeeNumber: string | null;
  hireDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape returned by GET /shelter-employee-profile (Super Admin, lists every
 * profile across every shelter). Unlike the `/me` response above, `userId`
 * can be null here: the referenced User account may have been deleted while
 * the orphaned profile document remains (confirmed against real data — 7 of
 * 10 profiles currently have userId: null). `shelterId` on this shape can
 * also be stale relative to the owning Shelter's own `employees` array (see
 * @paw-match/types's AdminShelter.employees) — callers should treat
 * Shelter.employees as the source of truth for current assignment, not this
 * field.
 */
export interface ShelterEmployeeProfileAdminEntry {
  _id: MongoId;
  userId: ShelterEmployeeProfileUserRef | null;
  shelterId: ShelterEmployeeProfileShelterRef | null;
  position: ShelterEmployeePosition;
  employeeNumber: string | null;
  hireDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** PUT /shelter-employee-profile/:userId/work-data body — superadmin only. Every field optional; the backend requires at least one. */
export interface UpdateEmployeeWorkDataPayload {
  position?: ShelterEmployeePosition;
  employeeNumber?: string;
  hireDate?: string;
}

/**
 * Shape returned by GET /shelter-employee-profile/available — superadmin or
 * an active shelter Manager (any shelter). Deliberately narrow: only active,
 * unassigned (shelterId: null) shelterEmployee accounts, with a limited safe
 * field set (no password/security fields, ever).
 */
export interface AvailableShelterEmployee {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: ImageRef | null;
}
