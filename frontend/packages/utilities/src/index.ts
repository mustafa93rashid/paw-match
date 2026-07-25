/**
 * Pure, framework-free helper functions shared by both frontend apps.
 * Populated incrementally as Phase 1 features need them.
 */
import type { AdopterProfile, Notification, NotificationAnimalReference } from "@paw-match/types";

export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

/**
 * Exactly mirrors adoptionRequest.controller.js createRequest's
 * isProfileCompleted check, so the frontend can proactively guide an
 * adopter to complete their profile before they fill out a request form,
 * instead of only reacting to the backend's 400 after the fact.
 */
export const isAdoptionRequestProfileComplete = (
  profile: AdopterProfile | null | undefined,
): boolean =>
  Boolean(
    profile &&
      profile.homeType &&
      profile.ownerType &&
      profile.experienceLevel &&
      profile.dailyActivityLevel &&
      profile.isAllergic !== null &&
      profile.isAllergic !== undefined,
  );

/**
 * Exactly mirrors matching.controller.js getMatchedAnimals' requiredProfileFields
 * check (packages/types's REQUIRED_MATCHING_FIELDS) — the strictest definition
 * of "complete" in the codebase, used by the Dashboard's adopter-facing admin
 * views to flag profiles that won't yet produce match results.
 */
export const isMatchingProfileComplete = (
  profile: AdopterProfile | null | undefined,
): boolean =>
  Boolean(
    profile &&
      profile.homeType &&
      profile.hasKids !== null &&
      profile.hasKids !== undefined &&
      profile.hasOtherPets !== null &&
      profile.hasOtherPets !== undefined &&
      profile.experienceLevel &&
      profile.dailyActivityLevel &&
      profile.isAllergic !== null &&
      profile.isAllergic !== undefined &&
      profile.ownerType,
  );

/** Joins truthy class names together, skipping falsy values. */
export const cn = (
  ...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

/**
 * Computes a real average from actual review ratings — used where the
 * backend's own persisted averageRating/totalReviews fields are unreliable
 * (see Shelter/VetProfile schema notes in @paw-match/types).
 */
export const getAverageRating = (
  reviews: Array<{ rating: number }>,
): number | undefined =>
  reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : undefined;

export type ReviewCtaState = "write" | "edit" | "view" | null;

const REVIEW_EDIT_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * Shared by the adoption-requests and vet-appointments pages: both need the
 * identical "write/edit/view a review" decision for a completed transaction.
 * The 48h window is only ever used to decide which UI to show — the
 * backend remains the sole authority on whether an edit actually succeeds.
 */
export const getReviewCtaState = (
  isCompleted: boolean,
  existingReview: { createdAt: string } | undefined,
): ReviewCtaState => {
  if (!isCompleted) return null;
  if (!existingReview) return "write";

  const editDeadline = new Date(existingReview.createdAt).getTime() + REVIEW_EDIT_WINDOW_MS;
  return Date.now() < editDeadline ? "edit" : "view";
};

/**
 * Only `referenceModel === "Animal"` is ever reliably populated (the only
 * reference model any current backend code path creates — see
 * @paw-match/types notification.ts). Returns null for any other model, any
 * unpopulated id string, or a malformed/missing populated object, so callers
 * never construct a broken navigation link.
 */
export const resolveNotificationAnimalRef = (
  notification: Pick<Notification, "referenceModel" | "referenceId">,
): NotificationAnimalReference | null => {
  if (notification.referenceModel !== "Animal") return null;

  const ref = notification.referenceId;
  if (!ref || typeof ref !== "object") return null;
  if (typeof ref._id !== "string" || ref._id.length === 0) return null;

  return ref;
};

/** Mirrors src/middlewares/upload.middleware.js + src/services/cloudinary.service.js's allowedMimeTypes/5MB limit. */
export const ALLOWED_PROFILE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

export const validateProfileImageFile = (file: File): string | null => {
  if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, GIF, and WebP images are allowed.";
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return "Image must be 5MB or smaller.";
  }
  return null;
};

/**
 * Defensively resolves a displayable image URL regardless of whether the
 * backend value is a raw URL string, an { url } object (the normal
 * ImageRef shape), or null/undefined/malformed — never surfaces
 * Cloudinary's publicId, only ever a url.
 */
export const resolveProfileImageUrl = (profileImage: unknown): string | null => {
  if (typeof profileImage === "string" && profileImage.length > 0) {
    return profileImage;
  }
  if (
    profileImage &&
    typeof profileImage === "object" &&
    "url" in profileImage &&
    typeof (profileImage as { url: unknown }).url === "string" &&
    (profileImage as { url: string }).url.length > 0
  ) {
    return (profileImage as { url: string }).url;
  }
  return null;
};

/** First letter of first + last name, uppercased — falls back to "?" if both are missing. */
export const getInitials = (firstName?: string, lastName?: string): string => {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  return initials || "?";
};
