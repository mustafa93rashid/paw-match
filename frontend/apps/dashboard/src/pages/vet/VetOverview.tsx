import { useMemo } from "react";
import { CalendarDays, CheckCircle2, Clock, UserRound } from "lucide-react";
import { ErrorState, ReviewsSection } from "@paw-match/ui";
import { StatCard } from "../../components/dashboard/StatCard";
import { QuickLinkCard } from "../../components/dashboard/QuickLinkCard";
import { RecentAppointmentsFeed } from "./components/RecentAppointmentsFeed";
import { vetAppointmentVetHooks } from "../../lib/vetAppointmentVetHooks";
import { reviewHooks } from "../../lib/reviewHooks";
import { useAuth } from "../../lib/auth";
import { paths } from "../../routes/paths";

const quickLinks = [
  {
    label: "My Profile",
    description: "Keep your specialization, bio, and availability current.",
    to: paths.vetProfile,
    icon: UserRound,
  },
  {
    label: "Appointments",
    description: "Schedule requests and manage upcoming consultations.",
    to: paths.appointments,
    icon: CalendarDays,
  },
];

/** Statistics and recent appointments are both derived client-side from the vet's own appointment list — there is no dashboard-stats or activity-log endpoint on the backend. */
export const VetOverview = () => {
  const auth = useAuth();
  const appointmentsQuery = vetAppointmentVetHooks.useVetAppointments();
  const reviewsQuery = reviewHooks.useTargetReviews("vet", auth.user?._id);

  const stats = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    return {
      pending: appointments.filter((appointment) => appointment.status === "pending").length,
      scheduled: appointments.filter((appointment) => appointment.status === "scheduled").length,
      completed: appointments.filter((appointment) => appointment.status === "completed").length,
      total: appointments.length,
    };
  }, [appointmentsQuery.data]);

  const isLoading = appointmentsQuery.isLoading;
  const hasError = appointmentsQuery.isError;

  return (
    <div className="mt-8 flex flex-col gap-8">
      {hasError ? (
        <ErrorState title="Couldn't load appointment statistics" onRetry={() => appointmentsQuery.refetch()} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Needs scheduling" value={isLoading ? "…" : stats.pending} icon={Clock} index={0} />
          <StatCard
            label="Scheduled"
            value={isLoading ? "…" : stats.scheduled}
            icon={CalendarDays}
            tone="accent"
            index={1}
          />
          <StatCard label="Completed" value={isLoading ? "…" : stats.completed} icon={CheckCircle2} index={2} />
          <StatCard
            label="Total appointments"
            value={isLoading ? "…" : stats.total}
            icon={CalendarDays}
            tone="accent"
            index={3}
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent appointments</h2>
        <div className="mt-4">
          <RecentAppointmentsFeed
            appointments={appointmentsQuery.data}
            isLoading={isLoading}
            isError={hasError}
            onRetry={() => appointmentsQuery.refetch()}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {quickLinks.map((link, index) => (
            <QuickLinkCard key={link.to} {...link} index={index} />
          ))}
        </div>
      </div>

      {reviewsQuery.isSuccess && (
        <ReviewsSection
          reviews={reviewsQuery.data.slice(0, 3)}
          emptyMessage="No reviews yet."
          replyLabel="Your reply"
        />
      )}
    </div>
  );
};
