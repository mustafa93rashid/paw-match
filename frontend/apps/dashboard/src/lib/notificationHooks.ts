import { createNotificationHooks } from "@paw-match/hooks";
import { apiClient } from "./apiClient";

export const notificationHooks = createNotificationHooks(apiClient);
