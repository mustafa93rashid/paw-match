/**
 * Endpoint functions for src/routes/review.route.js — adopter-relevant
 * subset only (list own, create, edit). `PUT /:id/reply` is
 * shelterEmployee/vet-only and out of scope for this site.
 *
 * targetId is never sent by the client — the backend derives it itself
 * from the verified transaction (see review.controller.js createReview),
 * and this frontend independently re-derives/verifies it the same way
 * from the adopter's own completed transactions before ever showing a form.
 */
import type { AxiosInstance } from "axios";
import type { AdopterReview, Review, ReviewTargetType } from "@paw-match/types";

export interface MyReviewsParams {
  targetType?: ReviewTargetType;
}

export interface CreateReviewPayload {
  targetType: ReviewTargetType;
  transactionId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}

/** No `message` field in this response envelope — just success/count/data. */
export const getMyReviews = async (
  client: AxiosInstance,
  params: MyReviewsParams = {},
): Promise<AdopterReview[]> => {
  const { data } = await client.get<{ success: true; count: number; data: AdopterReview[] }>(
    "/reviews/my",
    { params },
  );
  return data.data;
};

export const createReview = async (
  client: AxiosInstance,
  payload: CreateReviewPayload,
): Promise<AdopterReview> => {
  const { data } = await client.post<{ success: true; message: string; data: AdopterReview }>(
    "/reviews",
    payload,
  );
  return data.data;
};

export const updateReview = async (
  client: AxiosInstance,
  id: string,
  payload: UpdateReviewPayload,
): Promise<AdopterReview> => {
  const { data } = await client.put<{ success: true; message: string; data: AdopterReview }>(
    `/reviews/${id}`,
    payload,
  );
  return data.data;
};

/** Public, no auth. Not currently called by this app (embedded reviews on shelter/vet detail suffice), kept for completeness/future use. */
export const getTargetReviews = async (
  client: AxiosInstance,
  targetType: ReviewTargetType,
  targetId: string,
): Promise<Review[]> => {
  const { data } = await client.get<{ success: true; count: number; data: Review[] }>(
    `/reviews/target/${targetType}/${targetId}`,
  );
  return data.data;
};
