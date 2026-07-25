import { createShelterWriteHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterWriteHooks = createShelterWriteHooks(apiClient);
