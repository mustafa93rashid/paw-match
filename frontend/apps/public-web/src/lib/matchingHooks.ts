import { createMatchingHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const matchingHooks = createMatchingHooks(apiClient);
