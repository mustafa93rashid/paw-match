import { createShelterEmployeeProfileHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterEmployeeProfileHooks = createShelterEmployeeProfileHooks(apiClient);
