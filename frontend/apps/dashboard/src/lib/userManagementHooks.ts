import { createUserManagementHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const userManagementHooks = createUserManagementHooks(apiClient);
