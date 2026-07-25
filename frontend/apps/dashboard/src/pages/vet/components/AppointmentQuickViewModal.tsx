import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { VetAppointment } from "@paw-match/types";

export interface AppointmentQuickViewModalProps {
  appointment: VetAppointment | null;
  onClose: () => void;
}

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

/** Read-only preview built entirely from data already present in the vet appointments list response — no additional API calls. */
export const AppointmentQuickViewModal = ({ appointment, onClose }: AppointmentQuickViewModalProps) => (
  <Modal
    isOpen={Boolean(appointment)}
    onClose={onClose}
    title={
      appointment?.adopterId
        ? `Appointment with ${appointment.adopterId.firstName} ${appointment.adopterId.lastName}`
        : "Appointment details"
    }
  >
    {appointment && (
      <div className="flex flex-col gap-4">
        <Badge tone={statusTone[appointment.status]}>{statusLabel[appointment.status]}</Badge>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          {appointment.adopterId?.email && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Adopter email</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{appointment.adopterId.email}</dd>
            </div>
          )}
          {appointment.adopterId?.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Adopter phone</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{appointment.adopterId.phone}</dd>
            </div>
          )}
          {appointment.appointmentDate && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Date &amp; time</dt>
              <dd className="mt-0.5 font-medium text-slate-700">
                {new Date(appointment.appointmentDate).toLocaleString()}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Duration</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{appointment.duration} minutes</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Requested</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {new Date(appointment.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {appointment.requestMessage && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Message from adopter</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{appointment.requestMessage}</p>
          </div>
        )}

        {appointment.vetNotes && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Your notes</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{appointment.vetNotes}</p>
          </div>
        )}

        {appointment.rejectionReason && (
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
            <p className="mt-1 text-sm text-red-800">{appointment.rejectionReason}</p>
          </div>
        )}
      </div>
    )}
  </Modal>
);
