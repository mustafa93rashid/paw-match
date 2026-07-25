import { Link } from "react-router-dom";
import { Calendar, PawPrint, Star, XCircle } from "lucide-react";
import { Badge, Button, ButtonLink, Card } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { ReviewCtaState } from "@paw-match/utilities";
import type { AdoptionRequest, AdoptionRequestStatus } from "@paw-match/types";
import { paths } from "../../../routes/paths";

const reviewCtaLabel: Record<Exclude<ReviewCtaState, null>, string> = {
  write: "Write a review",
  edit: "Edit review",
  view: "View review",
};

const statusTone: Record<AdoptionRequestStatus, BadgeTone> = {
  pendingReview: "neutral",
  interview: "brand",
  homeCheck: "brand",
  approved: "accent",
  completed: "accent",
  rejected: "danger",
  cancelled: "danger",
};

const statusLabel: Record<AdoptionRequestStatus, string> = {
  pendingReview: "Pending review",
  interview: "Interview stage",
  homeCheck: "Home check stage",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

/** Adopters may only cancel while the request is still under initial review. */
const CANCELLABLE_STATUSES: AdoptionRequestStatus[] = ["pendingReview", "interview", "homeCheck"];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });

export interface AdoptionRequestCardProps {
  request: AdoptionRequest;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  reviewCta: ReviewCtaState;
}

export const AdoptionRequestCard = ({
  request,
  onCancel,
  isCancelling,
  reviewCta,
}: AdoptionRequestCardProps) => {
  const canCancel = CANCELLABLE_STATUSES.includes(request.status);
  const primaryImage =
    request.animalId.images.find((image) => image.isPrimary) ?? request.animalId.images[0];

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
          {primaryImage ? (
            <img src={primaryImage.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <PawPrint className="h-8 w-8" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link
              to={paths.animalDetail(request.animalId._id)}
              className="font-semibold text-slate-900 hover:text-brand-700"
            >
              {request.animalId.name}
            </Link>
            <Badge tone={statusTone[request.status]}>{statusLabel[request.status]}</Badge>
          </div>

          <p className="text-sm text-slate-600">
            {request.shelterId.name}, {request.shelterId.city}
          </p>

          {request.message && (
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">Your message: </span>
              {request.message}
            </p>
          )}

          {request.status === "rejected" && request.rejectionReason && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <span className="font-medium">Reason: </span>
              {request.rejectionReason}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {request.approvedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Approved {formatDate(request.approvedAt)}
              </span>
            )}
            {request.completedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Completed {formatDate(request.completedAt)}
              </span>
            )}
            {request.rejectedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Rejected {formatDate(request.rejectedAt)}
              </span>
            )}
            {request.cancelledAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                Cancelled {formatDate(request.cancelledAt)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {canCancel && (
              <Button
                variant="secondary"
                size="sm"
                isLoading={isCancelling}
                onClick={() => onCancel(request._id)}
              >
                <XCircle className="h-4 w-4" aria-hidden />
                Cancel request
              </Button>
            )}
            {reviewCta && (
              <ButtonLink
                to={paths.review("shelter", request._id)}
                variant="secondary"
                size="sm"
              >
                <Star className="h-4 w-4" aria-hidden />
                {reviewCtaLabel[reviewCta]}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
