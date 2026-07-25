import { Link } from "react-router-dom";
import { Calendar, Clock, Star, User, XCircle } from "lucide-react";
import { Badge, Button, ButtonLink, Card } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { ReviewCtaState } from "@paw-match/utilities";
import type { VetAppointment, VetAppointmentStatus } from "@paw-match/types";
import { paths } from "../../../routes/paths";

const reviewCtaLabel: Record<Exclude<ReviewCtaState, null>, string> = {
  write: "Write a review",
  edit: "Edit review",
  view: "View review",
};

const statusTone: Record<VetAppointmentStatus, BadgeTone> = {
  pending: "neutral",
  scheduled: "brand",
  completed: "accent",
  rejected: "danger",
  cancelled: "danger",
};

const statusLabel: Record<VetAppointmentStatus, string> = {
  pending: "Awaiting vet response",
  scheduled: "Scheduled",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const CANCELLABLE_STATUSES: VetAppointmentStatus[] = ["pending", "scheduled"];

export interface VetAppointmentCardProps {
  appointment: VetAppointment;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  reviewCta: ReviewCtaState;
}

export const VetAppointmentCard = ({
  appointment,
  onCancel,
  isCancelling,
  reviewCta,
}: VetAppointmentCardProps) => {
  const canCancel = CANCELLABLE_STATUSES.includes(appointment.status);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {appointment.vetId ? (
            <Link
              to={paths.veterinarianDetail(appointment.vetId._id)}
              className="inline-flex items-center gap-2 font-semibold text-slate-900 hover:text-brand-700"
            >
              <User className="h-4 w-4 text-slate-400" aria-hidden />
              Dr. {appointment.vetId.firstName} {appointment.vetId.lastName}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 font-semibold text-slate-500">
              <User className="h-4 w-4 text-slate-400" aria-hidden />
              Veterinarian profile unavailable
            </span>
          )}
        </div>
        <Badge tone={statusTone[appointment.status]}>{statusLabel[appointment.status]}</Badge>
      </div>

      {appointment.appointmentDate && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          {new Date(appointment.appointmentDate).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          <span className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {appointment.duration} min
          </span>
        </p>
      )}

      {appointment.requestMessage && (
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-700">Your message: </span>
          {appointment.requestMessage}
        </p>
      )}

      {appointment.status === "completed" && appointment.vetNotes && (
        <p className="rounded-lg bg-accent-50 p-3 text-sm text-accent-700">
          <span className="font-medium">Vet notes: </span>
          {appointment.vetNotes}
        </p>
      )}

      {appointment.status === "rejected" && appointment.rejectionReason && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <span className="font-medium">Reason: </span>
          {appointment.rejectionReason}
        </p>
      )}

      {(canCancel || reviewCta) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {canCancel && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={isCancelling}
              onClick={() => onCancel(appointment._id)}
            >
              <XCircle className="h-4 w-4" aria-hidden />
              Cancel appointment
            </Button>
          )}
          {reviewCta && (
            <ButtonLink to={paths.review("vet", appointment._id)} variant="secondary" size="sm">
              <Star className="h-4 w-4" aria-hidden />
              {reviewCtaLabel[reviewCta]}
            </ButtonLink>
          )}
        </div>
      )}
    </Card>
  );
};
