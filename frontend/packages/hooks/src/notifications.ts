import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@paw-match/api-client";

/**
 * Socket.IO push isn't usable from this app: src/config/socket.js requires a
 * raw JWT via `socket.handshake.auth.token`, but the access token here is
 * httpOnly-cookie-only and is never returned in a JSON response body — so
 * the unread badge is kept fresh via polling instead of a live subscription.
 */
const UNREAD_COUNT_POLL_INTERVAL_MS = 45_000;

export const createNotificationHooks = (client: AxiosInstance) => {
  const useMyNotifications = () =>
    useQuery({
      queryKey: ["notifications", "my"],
      queryFn: () => getMyNotifications(client),
    });

  const useUnreadNotificationCount = () =>
    useQuery({
      queryKey: ["notifications", "unreadCount"],
      queryFn: () => getUnreadNotificationCount(client),
      refetchInterval: UNREAD_COUNT_POLL_INTERVAL_MS,
      refetchOnWindowFocus: true,
    });

  const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => markNotificationAsRead(client, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", "my"] });
        queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
      },
    });
  };

  const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => markAllNotificationsAsRead(client),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", "my"] });
        queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
      },
    });
  };

  return {
    useMyNotifications,
    useUnreadNotificationCount,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead,
  };
};
