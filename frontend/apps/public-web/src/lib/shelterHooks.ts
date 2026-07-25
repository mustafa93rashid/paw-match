import { createShelterHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterHooks = createShelterHooks(apiClient);
