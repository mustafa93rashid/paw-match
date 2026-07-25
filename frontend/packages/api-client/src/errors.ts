import { AxiosError } from "axios";
import type { ApiErrorResponse } from "@paw-match/types";

export const isApiError = (error: unknown): error is AxiosError<ApiErrorResponse> =>
  error instanceof AxiosError;

export const getApiStatus = (error: unknown): number | undefined =>
  isApiError(error) ? error.response?.status : undefined;

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (isApiError(error) && error.response?.data?.message) {
    return error.response.data.message;
  }

  return fallback;
};

/** Maps express-validator field errors (see middlewares/validate.js) to `{field: message}`. */
export const getApiFieldErrors = (
  error: unknown,
): Record<string, string> | undefined => {
  const fieldErrors = isApiError(error) ? error.response?.data?.errors : undefined;

  if (!fieldErrors || fieldErrors.length === 0) {
    return undefined;
  }

  const map: Record<string, string> = {};

  for (const fieldError of fieldErrors) {
    if (!map[fieldError.field]) {
      map[fieldError.field] = fieldError.message;
    }
  }

  return map;
};
