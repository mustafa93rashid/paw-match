/**
 * Endpoint function + error-shape helpers for `GET /matching`
 * (src/routes/matching.route.js — auth + role(["adopter"]);
 * src/controllers/matching.controller.js `getMatchedAnimals`).
 *
 * Failure modes are distinguished by status, not a common error code:
 *   404 — no AdopterProfile yet, or it exists with isActive:false
 *   400 — profile exists but is missing one or more required fields
 *         (body includes `missingFields: string[]`)
 */
import type { AxiosInstance } from "axios";
import type { MatchedAnimal } from "@paw-match/types";
import { isApiError } from "./errors";

export interface MatchingIncompleteErrorData {
  success: false;
  message: string;
  missingFields?: string[];
}

export const getMatchedAnimals = async (client: AxiosInstance): Promise<MatchedAnimal[]> => {
  const { data } = await client.get<{
    success: true;
    message: string;
    count: number;
    data: MatchedAnimal[];
  }>("/matching");

  return data.data;
};

export const isAdopterProfileMissing = (error: unknown): boolean =>
  isApiError(error) && error.response?.status === 404;

/** Present only on the 400 "incomplete profile" response, not the 404 "missing profile" one. */
export const getMissingAdopterProfileFields = (error: unknown): string[] | undefined => {
  if (!isApiError(error) || error.response?.status !== 400) {
    return undefined;
  }

  const data = error.response.data as MatchingIncompleteErrorData | undefined;
  return data?.missingFields;
};
