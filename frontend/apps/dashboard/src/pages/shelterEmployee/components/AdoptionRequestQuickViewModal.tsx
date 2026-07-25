import { Link } from "react-router-dom";
import { UserRoundSearch } from "lucide-react";
import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { ShelterAdoptionRequest } from "@paw-match/types";
import { paths } from "../../../routes/paths";

export interface AdoptionRequestQuickViewModalProps {
  request: ShelterAdoptionRequest | null;
  onClose: () => void;
}

const statusTone: Record<ShelterAdoptionRequest["status"], BadgeTone> = {
  pendingReview: "neutral",
  interview: "accent",
  homeCheck: "accent",
  approved: "brand",
  rejected: "danger",
  cancelled: "neutral",
  completed: "brand",
};

const statusLabel: Record<ShelterAdoptionRequest["status"], string> = {
  pendingReview: "Pending review",
  interview: "Interview",
  homeCheck: "Home check",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

/** Read-only preview built entirely from data already present in the shelter adoption-requests list response — no additional API calls. */
export const AdoptionRequestQuickViewModal = ({ request, onClose }: AdoptionRequestQuickViewModalProps) => (
  <Modal
    isOpen={Boolean(request)}
    onClose={onClose}
    title={
      request
        ? request.adopterId
          ? `Request from ${request.adopterId.firstName} ${request.adopterId.lastName}`
          : "Request from unknown adopter"
        : "Request details"
    }
  >
    {request && (
      <div className="flex flex-col gap-4">
        <Badge tone={statusTone[request.status]}>{statusLabel[request.status]}</Badge>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Adopter email</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{request.adopterId?.email ?? "Unknown adopter"}</dd>
          </div>
          {request.adopterId?.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Adopter phone</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{request.adopterId.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Animal</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {request.animalId.name} ({request.animalId.breed})
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Requested</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {new Date(request.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {request.message && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Message from adopter</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{request.message}</p>
          </div>
        )}

        {request.rejectionReason && (
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rejection reason</p>
            <p className="mt-1 text-sm text-red-800">{request.rejectionReason}</p>
          </div>
        )}

        {request.adopterId && (
          <Link
            to={paths.adopterDetail(request.adopterId._id)}
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand-700 hover:underline"
          >
            <UserRoundSearch className="h-4 w-4" aria-hidden />
            View adopter profile
          </Link>
        )}
      </div>
    )}
  </Modal>
);
