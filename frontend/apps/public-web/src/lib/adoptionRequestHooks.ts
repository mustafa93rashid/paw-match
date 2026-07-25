import { createAdoptionRequestHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const adoptionRequestHooks = createAdoptionRequestHooks(apiClient);
