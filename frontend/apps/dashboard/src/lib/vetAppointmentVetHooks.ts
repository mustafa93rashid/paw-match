import { createVetAppointmentVetHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const vetAppointmentVetHooks = createVetAppointmentVetHooks(apiClient);
