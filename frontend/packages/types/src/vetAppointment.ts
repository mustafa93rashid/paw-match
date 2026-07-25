/**
 * Mirrors src/models/vetAppointment.js and
 * src/controllers/vetAppointment.controller.js. Adopter-relevant subset
 * only (request, list own, cancel) — /schedule, /status, /vet, /admin/all
 * are vet/superadmin-only and out of scope for this site.
 */
import type { ImageRef } from "./shelter";
import type { MongoId } from "./common";

/** Verbatim from the model's enum — the only 5 statuses that exist. */
export type VetAppointmentStatus = "pending" | "scheduled" | "completed" | "rejected" | "cancelled";

export interface VetAppointmentPersonRef {
  _id: MongoId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: ImageRef | null;
}

export interface VetAppointment {
  _id: MongoId;
  /**
   * Nullable in practice, same reason as VetProfile.userId: Mongoose's
   * populate() returns null for a reference whose target User document no
   * longer exists, rather than erroring. Confirmed live that every current
   * VetProfile has an orphaned userId — the same underlying vet accounts
   * would populate as null here too if this adopter had an appointment
   * with one of them.
   */
  adopterId: VetAppointmentPersonRef | null;
  vetId: VetAppointmentPersonRef | null;
  /** Null until a vet schedules it — the backend has no adopter-facing slot picker. */
  appointmentDate: string | null;
  duration: number;
  status: VetAppointmentStatus;
  requestMessage: string;
  vetNotes: string;
  rejectionReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /vetappointments body — no date/time field exists in the validator. */
export interface RequestVetAppointmentPayload {
  vetId: string;
  requestMessage?: string;
}

/** PATCH /vetappointments/:id/schedule body — only valid when the appointment's current status is "pending". */
export interface ScheduleVetAppointmentPayload {
  appointmentDate: string;
  duration?: number;
  vetNotes?: string;
}

/** PATCH /vetappointments/:id/status body — only valid when the appointment's current status is "scheduled"; rejectionReason required only when status is "rejected". */
export interface UpdateVetAppointmentStatusPayload {
  status: "completed" | "rejected";
  vetNotes?: string;
  rejectionReason?: string;
}
