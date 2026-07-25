import { createAdopterProfileHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const adopterProfileHooks = createAdopterProfileHooks(apiClient);
