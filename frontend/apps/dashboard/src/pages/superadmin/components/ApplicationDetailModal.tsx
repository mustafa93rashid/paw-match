import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { StaffApplication } from "@paw-match/types";

export interface ApplicationDetailModalProps {
  application: StaffApplication | null;
  onClose: () => void;
}

const statusTone: Record<StaffApplication["status"], BadgeTone> = {
  pendingVerification: "neutral",
  pending: "brand",
  approved: "accent",
  rejected: "danger",
};

const statusLabel: Record<StaffApplication["status"], string> = {
  pendingVerification: "Pending verification",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const applicationTypeLabel: Record<StaffApplication["applicationType"], string> = {
  shelterManager: "Shelter Manager",
  vet: "Veterinarian",
};

const Field = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className="mt-0.5 font-medium text-slate-700">{value ?? "—"}</dd>
  </div>
);

/** Read-only — every field here comes from the already-fetched application, no additional API calls. */
export const ApplicationDetailModal = ({ application, onClose }: ApplicationDetailModalProps) => (
  <Modal
    isOpen={Boolean(application)}
    onClose={onClose}
    title={application ? `${application.firstName} ${application.lastName}` : "Application details"}
    size="lg"
  >
    {application && (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone[application.status]}>{statusLabel[application.status]}</Badge>
          <Badge tone="neutral">{applicationTypeLabel[application.applicationType]}</Badge>
          <Badge tone={application.emailVerified ? "accent" : "neutral"}>
            {application.emailVerified ? "Email verified" : "Verification pending"}
          </Badge>
          {application.status === "approved" && application.approvedUserId && (
            <Badge tone={application.approvedUserId.isAccountActivated ? "accent" : "neutral"}>
              {application.approvedUserId.isAccountActivated ? "Account activated" : "Activation pending"}
            </Badge>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Applicant</h3>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <Field label="Email" value={application.email} />
            <Field label="Phone" value={application.phone} />
            <Field label="Address" value={application.address} />
            <Field
              label="Date of birth"
              value={application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString() : null}
            />
            <Field label="Gender" value={application.gender} />
            <Field label="Submitted" value={new Date(application.createdAt).toLocaleDateString()} />
          </dl>
        </div>

        {application.applicationType === "shelterManager" && application.shelterData && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Proposed shelter</h3>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <Field label="Name" value={application.shelterData.name} />
              <Field label="Email" value={application.shelterData.email} />
              <Field label="Phone" value={application.shelterData.phone} />
              <Field label="City" value={application.shelterData.city} />
              <Field label="Address" value={application.shelterData.address} />
              <Field label="Capacity" value={application.shelterData.capacity} />
            </dl>
            {application.shelterData.description && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {application.shelterData.description}
              </p>
            )}
            {application.shelterData.supportedSpecies && application.shelterData.supportedSpecies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {application.shelterData.supportedSpecies.map((species) => (
                  <Badge key={species} tone="neutral" className="capitalize">
                    {species}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {application.applicationType === "vet" && application.vetData && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Professional information</h3>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <Field label="Specialization" value={application.vetData.specialization} />
              <Field label="Experience (years)" value={application.vetData.experienceYears} />
            </dl>
            {application.vetData.bio && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{application.vetData.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(application.vetData.availableDays ?? []).map((day) => (
                <Badge key={day} tone="neutral" className="capitalize">
                  {day}
                </Badge>
              ))}
              {(application.vetData.consultationTypes ?? []).map((type) => (
                <Badge key={type} tone="neutral">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(application.status === "approved" || application.status === "rejected") && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Review</h3>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              {application.reviewedBy && (
                <Field
                  label="Reviewed by"
                  value={`${application.reviewedBy.firstName} ${application.reviewedBy.lastName}`}
                />
              )}
              {application.reviewedAt && (
                <Field label="Reviewed on" value={new Date(application.reviewedAt).toLocaleDateString()} />
              )}
              {application.approvedUserId && (
                <Field
                  label="Resulting account"
                  value={`${application.approvedUserId.firstName} ${application.approvedUserId.lastName} (${application.approvedUserId.email})`}
                />
              )}
            </dl>
            {application.rejectionReason && (
              <div className="mt-3 rounded-xl bg-red-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
                <p className="mt-1 text-sm text-red-800">{application.rejectionReason}</p>
              </div>
            )}
          </div>
        )}

        {application.updatedBy && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Last edited</h3>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <Field
                label="Edited by"
                value={`${application.updatedBy.firstName} ${application.updatedBy.lastName}`}
              />
              <Field label="Edited on" value={new Date(application.updatedAt).toLocaleDateString()} />
            </dl>
          </div>
        )}
      </div>
    )}
  </Modal>
);
