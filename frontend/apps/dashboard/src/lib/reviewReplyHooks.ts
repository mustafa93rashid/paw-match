import { createReviewReplyHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const reviewReplyHooks = createReviewReplyHooks(apiClient);
