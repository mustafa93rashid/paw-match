import { Link } from "react-router-dom";
import { Bell, Check, ClipboardList, PawPrint, Stethoscope } from "lucide-react";
import { Badge, Button } from "@paw-match/ui";
import { resolveNotificationAnimalRef } from "@paw-match/utilities";
import type { Notification, NotificationType } from "@paw-match/types";
import { paths } from "../../../routes/paths";

const typeIcon: Record<NotificationType, typeof PawPrint> = {
  animalMatch: PawPrint,
  adoptionRequest: ClipboardList,
  appointment: Stethoscope,
  system: Bell,
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  isMarkingAsRead: boolean;
  dense?: boolean;
}

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  isMarkingAsRead,
  dense = false,
}: NotificationItemProps) => {
  const Icon = typeIcon[notification.type];
  const animalRef = resolveNotificationAnimalRef(notification);
  const hasValidMatchPercentage =
    typeof notification.metadata?.matchPercentage === "number" &&
    Number.isFinite(notification.metadata.matchPercentage);

  const content = (
    <div className="flex-1">
      <p className={dense ? "text-sm font-medium text-slate-900" : "font-medium text-slate-900"}>
        {notification.title}
      </p>
      <p className="mt-0.5 text-sm text-slate-600">{notification.message}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {notification.senderId && (
          <span>
            From {notification.senderId.firstName} {notification.senderId.lastName}
          </span>
        )}
        {hasValidMatchPercentage && (
          <Badge tone="accent">{notification.metadata.matchPercentage}% match</Badge>
        )}
        <span>{formatDateTime(notification.createdAt)}</span>
        {notification.isRead && notification.readAt && (
          <span>· Read {formatDateTime(notification.readAt)}</span>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-3 py-3 ${
        notification.isRead ? "bg-white" : "bg-brand-50"
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          notification.isRead ? "bg-slate-100 text-slate-500" : "bg-brand-100 text-brand-600"
        }`}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>

      {animalRef ? (
        <Link to={paths.animalDetail(animalRef._id)} className="flex-1 hover:opacity-80">
          {content}
        </Link>
      ) : (
        content
      )}

      {!notification.isRead && (
        <Button
          variant="secondary"
          size="sm"
          isLoading={isMarkingAsRead}
          onClick={() => onMarkAsRead(notification._id)}
        >
          <Check className="h-4 w-4" aria-hidden />
          Mark read
        </Button>
      )}
    </div>
  );
};
