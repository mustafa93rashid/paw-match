/**
 * Mirrors src/models/Review.js and the `reviews` array embedded by both
 * src/controllers/shelter.controller.js's `getShelterReviews` and
 * src/controllers/vetProfile.controller.js's `getVetReviews` — identical
 * shape for both targetType values ("shelter" and "vet"), so one generic
 * type covers both instead of duplicating it per-entity.
 */
import type { ImageRef } from "./shelter";
import type { MongoId, UserRole } from "./common";

export interface ReviewAuthor {
  _id: MongoId;
  firstName: string;
  lastName: string;
  profileImage?: ImageRef | null;
}

export interface ReviewReplyInfo {
  text: string;
  createdAt: string;
  repliedBy: {
    _id: MongoId;
    firstName: string;
    lastName: string;
    role: UserRole;
    profileImage?: ImageRef | null;
  } | null;
}

export interface Review {
  _id: MongoId;
  /** Null when the adopter's account has been deleted after leaving the review (dangling populate ref). */
  adopterId: ReviewAuthor | null;
  rating: number;
  comment: string;
  reply: ReviewReplyInfo | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReviewTargetType = "shelter" | "vet";
export type ReviewModerationStatus = "published" | "reported" | "hidden";

/**
 * Full review document — returned by GET /reviews/my, POST /reviews, and
 * PUT /reviews/:id (the adopter's-own-reviews context). Distinct from the
 * narrower `Review` projection above: getMyReviews/createReview/updateReview
 * don't `.select()` the document down, so targetType/targetId/transactionId/
 * status are present here but not on the embedded shelter/vet-profile
 * reviews arrays. `targetId` is never populated (no refPath on the model).
 */
export interface AdopterReview {
  _id: MongoId;
  targetType: ReviewTargetType;
  targetId: MongoId;
  transactionId: MongoId;
  rating: number;
  comment: string;
  reply: ReviewReplyInfo | null;
  /** Moderation flag, not adopter-facing — new reviews are always "published". */
  status: ReviewModerationStatus;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}
