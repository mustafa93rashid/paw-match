import { createShelterAdminHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const shelterAdminHooks = createShelterAdminHooks(apiClient);
