import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { AdminShelter } from "@paw-match/types";

export interface ShelterQuickViewModalProps {
  shelter: AdminShelter | null;
  onClose: () => void;
}

const verificationTone: Record<AdminShelter["verificationStatus"], BadgeTone> = {
  pending: "neutral",
  approved: "brand",
  rejected: "danger",
};

const verificationLabel: Record<AdminShelter["verificationStatus"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** Read-only preview built entirely from data already present in the admin shelters list response — no additional API calls, no new route. */
export const ShelterQuickViewModal = ({ shelter, onClose }: ShelterQuickViewModalProps) => (
  <Modal isOpen={Boolean(shelter)} onClose={onClose} title={shelter?.name ?? "Shelter details"}>
    {shelter && (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone={verificationTone[shelter.verificationStatus]}>{verificationLabel[shelter.verificationStatus]}</Badge>
          <Badge tone={shelter.isActive ? "accent" : "neutral"}>{shelter.isActive ? "Active" : "Inactive"}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Phone</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.phone}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Address</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.address}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">City</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.city}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Capacity</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{shelter.capacity}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Registered</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{new Date(shelter.createdAt).toLocaleDateString()}</dd>
          </div>
          {shelter.createdBy && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Created by</dt>
              <dd className="mt-0.5 font-medium text-slate-700">
                {shelter.createdBy.firstName} {shelter.createdBy.lastName}
              </dd>
            </div>
          )}
          {shelter.verifiedBy && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Verified by</dt>
              <dd className="mt-0.5 font-medium text-slate-700">
                {shelter.verifiedBy.firstName} {shelter.verifiedBy.lastName}
              </dd>
            </div>
          )}
        </dl>

        {shelter.supportedSpecies.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Supported species</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {shelter.supportedSpecies.map((species) => (
                <Badge key={species} tone="neutral" className="capitalize">
                  {species}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {shelter.description && <p className="text-sm leading-relaxed text-slate-600">{shelter.description}</p>}

        {shelter.rejectionReason && (
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
            <p className="mt-1 text-sm text-red-800">{shelter.rejectionReason}</p>
          </div>
        )}
      </div>
    )}
  </Modal>
);
