import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Button, VisuallyHidden } from "@paw-match/ui";
import { notificationHooks } from "../../lib/notificationHooks";
import { paths } from "../../routes/paths";

const PREVIEW_COUNT = 5;

/**
 * Mirrors apps/public-web/src/components/layout/NotificationBell.tsx's
 * design exactly. The preview item here is simpler than the Public
 * Website's (no animal-reference link resolution) since the only
 * notification type any backend code path currently creates
 * ("animalMatch") only ever targets adopters — a dashboard role realistically
 * only ever sees an empty list, but the bell still needs to work correctly
 * if that ever changes.
 */
export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCountQuery = notificationHooks.useUnreadNotificationCount();
  const notificationsQuery = notificationHooks.useMyNotifications();
  const markAsReadMutation = notificationHooks.useMarkNotificationAsRead();
  const markAllAsReadMutation = notificationHooks.useMarkAllNotificationsAsRead();

  const unreadCount = unreadCountQuery.data ?? 0;

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const preview = notificationsQuery.data?.slice(0, PREVIEW_COUNT) ?? [];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="relative inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white"
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <VisuallyHidden>
          Notifications{unreadCount > 0 ? `, ${unreadCount} unread` : ""}
        </VisuallyHidden>
      </button>

      {isOpen && (
        <div
          id="notification-panel"
          role="region"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:w-96"
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                isLoading={markAllAsReadMutation.isPending}
                onClick={() => markAllAsReadMutation.mutate()}
              >
                <CheckCheck className="h-4 w-4" aria-hidden />
                Mark all read
              </Button>
            )}
          </div>

          {notificationsQuery.isPending && (
            <p className="px-1 py-4 text-sm text-slate-500">Loading…</p>
          )}

          {notificationsQuery.isError && (
            <p className="px-1 py-4 text-sm text-slate-500">
              Couldn't load notifications right now.
            </p>
          )}

          {notificationsQuery.isSuccess && preview.length === 0 && (
            <p className="px-1 py-4 text-sm text-slate-500">No notifications yet.</p>
          )}

          {preview.length > 0 && (
            <div className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
              {preview.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => markAsReadMutation.mutate(notification._id)}
                  disabled={notification.isRead || markAsReadMutation.isPending}
                  className={`flex flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                    notification.isRead ? "bg-white" : "bg-brand-50"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                  <p className="text-xs text-slate-600">{notification.message}</p>
                </button>
              ))}
            </div>
          )}

          <Link
            to={paths.notifications}
            className="mt-2 block rounded-lg px-1 py-2 text-center text-sm font-medium text-brand-700 hover:bg-slate-50"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};
