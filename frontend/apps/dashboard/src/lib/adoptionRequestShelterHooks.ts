import { createAdoptionRequestShelterHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const adoptionRequestShelterHooks = createAdoptionRequestShelterHooks(apiClient);
