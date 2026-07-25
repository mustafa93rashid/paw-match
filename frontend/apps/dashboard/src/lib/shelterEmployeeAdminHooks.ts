import { createShelterEmployeeAdminHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterEmployeeAdminHooks = createShelterEmployeeAdminHooks(apiClient);
