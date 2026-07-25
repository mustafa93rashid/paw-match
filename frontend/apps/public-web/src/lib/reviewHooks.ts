import { createReviewHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const reviewHooks = createReviewHooks(apiClient);
