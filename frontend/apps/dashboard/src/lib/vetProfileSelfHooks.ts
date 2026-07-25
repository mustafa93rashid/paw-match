import { createVetProfileSelfHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const vetProfileSelfHooks = createVetProfileSelfHooks(apiClient);
