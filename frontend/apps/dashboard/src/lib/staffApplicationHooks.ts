import { createStaffApplicationAdminHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const staffApplicationHooks = createStaffApplicationAdminHooks(apiClient);
