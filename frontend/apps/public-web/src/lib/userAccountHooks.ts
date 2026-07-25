import { createUserAccountHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const userAccountHooks = createUserAccountHooks(apiClient);
