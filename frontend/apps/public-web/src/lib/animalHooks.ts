import { createAnimalHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const animalHooks = createAnimalHooks(apiClient);
