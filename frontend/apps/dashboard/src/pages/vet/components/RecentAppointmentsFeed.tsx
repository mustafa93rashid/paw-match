import { CalendarDays } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, ListSkeleton } from "@paw-match/ui";
import type { VetAppointment } from "@paw-match/types";

export interface RecentAppointmentsFeedProps {
  appointments: VetAppointment[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const MAX_FEED_ITEMS = 8;

const statusLabel: Record<VetAppointment["status"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Derived from the vet's own appointment list, sorted by most recently created — there is no dedicated activity/audit-log endpoint on the backend. */
export const RecentAppointmentsFeed = ({
  appointments,
  isLoading,
  isError,
  onRetry,
}: RecentAppointmentsFeedProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  if (isLoading) {
    return <ListSkeleton count={4} label="Loading recent appointments" />;
  }

  if (isError) {
    return <ErrorState title="Couldn't load recent appointments" onRetry={onRetry} />;
  }

  const items = [...(appointments ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_FEED_ITEMS);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent appointments yet"
        description="New appointment requests will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((appointment, index) => (
        <motion.li
          key={appointment._id}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05 }}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {appointment.adopterId
                ? `${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
                : "Appointment request"}
            </p>
            <p className="truncate text-xs text-slate-500">{statusLabel[appointment.status]}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            {new Date(appointment.createdAt).toLocaleDateString()}
          </span>
        </motion.li>
      ))}
    </ul>
  );
};
