import { createAnimalManagementHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const animalManagementHooks = createAnimalManagementHooks(apiClient);
