/**
 * Mirrors src/models/Notification.js and the response of
 * `GET /notifications` (src/controllers/notification.controller.js
 * getMyNotifications). Only `type: "animalMatch"` is ever actually created
 * today (see src/services/matchNotification.service.js) — `adoptionRequest`,
 * `appointment`, and `system` exist on the schema enum but no controller
 * currently creates them.
 */
import type { AdoptionStatus, AnimalImage } from "./animal";
import type { ImageRef, Species } from "./shelter";
import type { MongoId } from "./common";

export type NotificationType = "animalMatch" | "adoptionRequest" | "appointment" | "system";
export type NotificationReferenceModel = "Animal" | "AdoptionRequest" | "VetAppointment";

export interface NotificationSender {
  _id: MongoId;
  firstName: string;
  lastName: string;
  profileImage?: ImageRef | null;
}

/**
 * The controller's `.populate("referenceId", "name species breed images
 * adoptionStatus")` field selection is hardcoded to this Animal shape
 * regardless of `referenceModel` — reliable only when referenceModel is
 * "Animal" (the only reference model any current code path ever creates).
 */
export interface NotificationAnimalReference {
  _id: MongoId;
  name?: string;
  species?: Species;
  breed?: string;
  images?: AnimalImage[];
  adoptionStatus?: AdoptionStatus;
}

export interface Notification {
  _id: MongoId;
  recipientId: MongoId;
  senderId: NotificationSender | null;
  type: NotificationType;
  title: string;
  message: string;
  /** An unpopulated id string, a populated Animal reference, or null. */
  referenceId: MongoId | NotificationAnimalReference | null;
  referenceModel: NotificationReferenceModel | null;
  metadata: { matchPercentage: number | null };
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}
