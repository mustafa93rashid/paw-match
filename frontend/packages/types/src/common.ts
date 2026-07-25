/**
 * Shared foundational types mirroring the existing Paw Match backend.
 */

export type UserRole = "superadmin" | "shelterEmployee" | "vet" | "adopter";

export type MongoId = string;

/** Matches the `{ success, message, data }` envelope used by most endpoints. */
export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

/** Matches the `{ success, message, count, data }` envelope used by list endpoints. */
export interface ApiListResponse<T> {
  success: true;
  message?: string;
  count: number;
  data: T[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string; value?: unknown }>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
