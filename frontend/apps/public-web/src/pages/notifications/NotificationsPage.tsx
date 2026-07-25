import { BellOff, CheckCheck } from "lucide-react";
import { Button, Container, EmptyState, ErrorState, ListSkeleton } from "@paw-match/ui";
import { getApiStatus } from "@paw-match/api-client";
import { notificationHooks } from "../../lib/notificationHooks";
import { NotificationItem } from "./components/NotificationItem";

const NotificationsPage = () => {
  const notificationsQuery = notificationHooks.useMyNotifications();
  const unreadCountQuery = notificationHooks.useUnreadNotificationCount();
  const markAsReadMutation = notificationHooks.useMarkNotificationAsRead();
  const markAllAsReadMutation = notificationHooks.useMarkAllNotificationsAsRead();

  const unreadCount = unreadCountQuery.data ?? 0;
  const errorStatus = getApiStatus(notificationsQuery.error);

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
              : "You're all caught up."}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            isLoading={markAllAsReadMutation.isPending}
            onClick={() => markAllAsReadMutation.mutate()}
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="mt-8">
        {notificationsQuery.isPending && (
          <ListSkeleton count={3} label="Loading notifications" />
        )}

        {notificationsQuery.isError && errorStatus === 401 && (
          <ErrorState
            title="Your session has expired"
            description="Please sign in again to view your notifications."
          />
        )}

        {notificationsQuery.isError && errorStatus !== 401 && (
          <ErrorState
            description="We couldn't load your notifications right now."
            onRetry={() => notificationsQuery.refetch()}
          />
        )}

        {notificationsQuery.isSuccess && notificationsQuery.data.length === 0 && (
          <EmptyState
            icon={<BellOff className="h-6 w-6" aria-hidden />}
            title="No notifications yet"
            description="We'll let you know here when there's something new — like an animal that matches your preferences."
          />
        )}

        {notificationsQuery.isSuccess && notificationsQuery.data.length > 0 && (
          <div className="flex flex-col gap-2">
            {notificationsQuery.data.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                isMarkingAsRead={
                  markAsReadMutation.isPending &&
                  markAsReadMutation.variables === notification._id
                }
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default NotificationsPage;
