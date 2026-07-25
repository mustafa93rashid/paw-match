import { createVetAppointmentHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const vetAppointmentHooks = createVetAppointmentHooks(apiClient);
