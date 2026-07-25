import { useState } from "react";
import { CalendarPlus, CheckCircle2, Eye, XCircle } from "lucide-react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  UserAvatar,
  VisuallyHidden,
} from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { VetAppointment } from "@paw-match/types";
import { AppointmentQuickViewModal } from "./AppointmentQuickViewModal";
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";
import { CompleteAppointmentDialog } from "./CompleteAppointmentDialog";
import { RejectAppointmentDialog } from "./RejectAppointmentDialog";

const statusTone: Record<VetAppointment["status"], BadgeTone> = {
  pending: "neutral",
  scheduled: "accent",
  completed: "brand",
  rejected: "danger",
  cancelled: "neutral",
};

const statusLabel: Record<VetAppointment["status"], string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export interface AppointmentsTableProps {
  appointments: VetAppointment[];
}

/** Only shows the exact next actions valid for each appointment's current status, per the backend's confirmed transition rules: pending -> schedule; scheduled -> complete or reject. */
export const AppointmentsTable = ({ appointments }: AppointmentsTableProps) => {
  const [viewTarget, setViewTarget] = useState<VetAppointment | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<VetAppointment | null>(null);
  const [completeTarget, setCompleteTarget] = useState<VetAppointment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VetAppointment | null>(null);

  return (
    <>
      <Table>
        <TableHead>
          <TableHeaderCell>Adopter</TableHeaderCell>
          <TableHeaderCell>Date &amp; time</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Requested</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>Actions</VisuallyHidden>
          </TableHeaderCell>
        </TableHead>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    firstName={appointment.adopterId?.firstName}
                    lastName={appointment.adopterId?.lastName}
                    profileImage={appointment.adopterId?.profileImage}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {appointment.adopterId
                        ? `${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
                        : "Unknown adopter"}
                    </p>
                    {appointment.adopterId?.email && (
                      <p className="truncate text-xs text-slate-500">{appointment.adopterId.email}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {appointment.appointmentDate
                  ? new Date(appointment.appointmentDate).toLocaleString()
                  : "Not yet scheduled"}
              </TableCell>
              <TableCell>
                <Badge tone={statusTone[appointment.status]}>{statusLabel[appointment.status]}</Badge>
              </TableCell>
              <TableCell>{new Date(appointment.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">
                  {appointment.status === "pending" && (
                    <Button variant="secondary" size="sm" onClick={() => setScheduleTarget(appointment)}>
                      <CalendarPlus className="h-4 w-4" aria-hidden />
                      Schedule
                    </Button>
                  )}

                  {appointment.status === "scheduled" && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => setCompleteTarget(appointment)}>
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                        Complete
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejectTarget(appointment)}>
                        <XCircle className="h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewTarget(appointment)}
                    aria-label="View appointment"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AppointmentQuickViewModal appointment={viewTarget} onClose={() => setViewTarget(null)} />
      <ScheduleAppointmentDialog appointment={scheduleTarget} onClose={() => setScheduleTarget(null)} />
      <CompleteAppointmentDialog appointment={completeTarget} onClose={() => setCompleteTarget(null)} />
      <RejectAppointmentDialog appointment={rejectTarget} onClose={() => setRejectTarget(null)} />
    </>
  );
};
