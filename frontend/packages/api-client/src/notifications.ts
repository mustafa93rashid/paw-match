/**
 * Endpoint functions for src/routes/notification.routes.js, mounted at
 * /api/v1/notifications. Every route requires only `auth` — no role
 * restriction — so these are usable by any authenticated user.
 */
import type { AxiosInstance } from "axios";
import type { Notification } from "@paw-match/types";

/** No `message` field in this response envelope — just success/count/data. */
export const getMyNotifications = async (client: AxiosInstance): Promise<Notification[]> => {
  const { data } = await client.get<{ success: true; count: number; data: Notification[] }>(
    "/notifications",
  );
  return data.data;
};

export const getUnreadNotificationCount = async (client: AxiosInstance): Promise<number> => {
  const { data } = await client.get<{ success: true; count: number }>(
    "/notifications/unread-count",
  );
  return data.count;
};

export const markNotificationAsRead = async (
  client: AxiosInstance,
  id: string,
): Promise<Notification> => {
  const { data } = await client.patch<{ success: true; message: string; data: Notification }>(
    `/notifications/${id}/read`,
  );
  return data.data;
};

export const markAllNotificationsAsRead = async (
  client: AxiosInstance,
): Promise<{ modifiedCount: number }> => {
  const { data } = await client.patch<{ success: true; message: string; modifiedCount: number }>(
    "/notifications/read-all",
  );
  return { modifiedCount: data.modifiedCount };
};
