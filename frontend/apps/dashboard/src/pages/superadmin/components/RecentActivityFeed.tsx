import { Building2, UserPlus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, ListSkeleton } from "@paw-match/ui";
import type { AdminShelter, AdminUser } from "@paw-match/types";

export interface RecentActivityFeedProps {
  shelters: AdminShelter[] | undefined;
  users: AdminUser[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  icon: typeof Building2;
}

const RECENT_SHELTERS_COUNT = 5;
const RECENT_USERS_COUNT = 5;
const MAX_FEED_ITEMS = 8;

/** Derived from the most recently created shelters + users — there is no dedicated activity/audit-log endpoint on the backend. */
const buildActivityItems = (shelters: AdminShelter[], users: AdminUser[]): ActivityItem[] => {
  const shelterItems: ActivityItem[] = shelters.slice(0, RECENT_SHELTERS_COUNT).map((shelter) => ({
    id: `shelter-${shelter._id}`,
    title: `New shelter registered: ${shelter.name}`,
    subtitle: shelter.city,
    createdAt: shelter.createdAt,
    icon: Building2,
  }));

  const userItems: ActivityItem[] = users.slice(0, RECENT_USERS_COUNT).map((user) => ({
    id: `user-${user._id}`,
    title: `New user joined: ${user.firstName} ${user.lastName}`,
    subtitle: user.role,
    createdAt: user.createdAt,
    icon: UserPlus,
  }));

  return [...shelterItems, ...userItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_FEED_ITEMS);
};

/** Not a real activity/audit trail — the backend has no such endpoint. This is a derived approximation from recent shelter/user registrations. */
export const RecentActivityFeed = ({ shelters, users, isLoading, isError, onRetry }: RecentActivityFeedProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  if (isLoading) {
    return <ListSkeleton count={4} label="Loading recent activity" />;
  }

  if (isError) {
    return <ErrorState title="Couldn't load recent activity" onRetry={onRetry} />;
  }

  const items = buildActivityItems(shelters ?? [], users ?? []);

  if (items.length === 0) {
    return <EmptyState title="No recent activity yet" description="New shelters and users will show up here." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05 }}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <item.icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
            <p className="truncate text-xs capitalize text-slate-500">{item.subtitle}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
        </motion.li>
      ))}
    </ul>
  );
};
