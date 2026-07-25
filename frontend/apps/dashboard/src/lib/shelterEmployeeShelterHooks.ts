import { createShelterEmployeeShelterHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterEmployeeShelterHooks = createShelterEmployeeShelterHooks(apiClient);
