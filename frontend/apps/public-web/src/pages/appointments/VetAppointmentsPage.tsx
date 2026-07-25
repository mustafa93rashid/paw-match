import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarX2, CheckCircle2, Stethoscope } from "lucide-react";
import { Container, EmptyState, ErrorState, Select } from "@paw-match/ui";
import { getReviewCtaState } from "@paw-match/utilities";
import type { VetAppointmentStatus } from "@paw-match/types";
import { vetAppointmentHooks } from "../../lib/vetAppointmentHooks";
import { reviewHooks } from "../../lib/reviewHooks";
import { paths } from "../../routes/paths";
import { VetAppointmentCard } from "./components/VetAppointmentCard";
import { VetAppointmentCardSkeleton } from "./components/VetAppointmentCardSkeleton";

const statusOptions: { label: string; value: VetAppointmentStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

interface VetAppointmentsLocationState {
  justRequested?: boolean;
}

const VetAppointmentsPage = () => {
  const location = useLocation();
  const locationState = location.state as VetAppointmentsLocationState | null;
  const [status, setStatus] = useState("");
  const appointmentsQuery = vetAppointmentHooks.useMyVetAppointments(
    status ? { status: status as VetAppointmentStatus } : {},
  );
  const cancelMutation = vetAppointmentHooks.useCancelVetAppointment();
  const myVetReviewsQuery = reviewHooks.useMyReviews({ targetType: "vet" });

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Your vet appointments
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Track requests, scheduled visits, and past consultations.
          </p>
        </div>
        <Link
          to={paths.veterinarians}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Stethoscope className="h-4 w-4" aria-hidden />
          Find a veterinarian
        </Link>
      </div>

      {locationState?.justRequested && (
        <p className="mt-6 flex items-center gap-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Your appointment request has been submitted.
        </p>
      )}

      <div className="mt-8 max-w-xs">
        <Select
          label="Filter by status"
          placeholder="All statuses"
          options={statusOptions}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        />
      </div>

      <div className="mt-8">
        {appointmentsQuery.isPending && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((key) => (
              <VetAppointmentCardSkeleton key={key} />
            ))}
          </div>
        )}

        {appointmentsQuery.isError && (
          <ErrorState
            description="We couldn't load your appointments right now."
            onRetry={() => appointmentsQuery.refetch()}
          />
        )}

        {appointmentsQuery.isSuccess && appointmentsQuery.data.length === 0 && (
          <EmptyState
            icon={<CalendarX2 className="h-6 w-6" aria-hidden />}
            title={status ? "No appointments with this status" : "No appointments yet"}
            description={
              status
                ? "Try a different status filter."
                : "Browse veterinarians to request your first consultation."
            }
          />
        )}

        {appointmentsQuery.isSuccess && appointmentsQuery.data.length > 0 && (
          <div className="flex flex-col gap-4">
            {appointmentsQuery.data.map((appointment) => {
              const existingReview = myVetReviewsQuery.data?.find(
                (review) => review.transactionId === appointment._id,
              );

              return (
                <VetAppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  isCancelling={
                    cancelMutation.isPending && cancelMutation.variables === appointment._id
                  }
                  reviewCta={getReviewCtaState(
                    appointment.status === "completed" && Boolean(appointment.vetId),
                    existingReview,
                  )}
                />
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
};

export default VetAppointmentsPage;
