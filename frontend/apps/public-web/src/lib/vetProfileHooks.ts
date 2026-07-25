import { createVetProfileHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const vetProfileHooks = createVetProfileHooks(apiClient);
