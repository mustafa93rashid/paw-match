import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, ClipboardX, PawPrint } from "lucide-react";
import { Container, EmptyState, ErrorState, Select } from "@paw-match/ui";
import { getReviewCtaState } from "@paw-match/utilities";
import type { AdoptionRequestStatus } from "@paw-match/types";
import { adoptionRequestHooks } from "../../lib/adoptionRequestHooks";
import { reviewHooks } from "../../lib/reviewHooks";
import { paths } from "../../routes/paths";
import { AdoptionRequestCard } from "./components/AdoptionRequestCard";
import { AdoptionRequestCardSkeleton } from "./components/AdoptionRequestCardSkeleton";

const statusOptions: { label: string; value: AdoptionRequestStatus }[] = [
  { label: "Pending review", value: "pendingReview" },
  { label: "Interview stage", value: "interview" },
  { label: "Home check stage", value: "homeCheck" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

interface AdoptionRequestsLocationState {
  justRequested?: boolean;
}

const AdoptionRequestsPage = () => {
  const location = useLocation();
  const locationState = location.state as AdoptionRequestsLocationState | null;
  const [status, setStatus] = useState("");

  const requestsQuery = adoptionRequestHooks.useMyAdoptionRequests(
    status ? { status: status as AdoptionRequestStatus } : {},
  );
  const cancelMutation = adoptionRequestHooks.useCancelAdoptionRequest();
  const myShelterReviewsQuery = reviewHooks.useMyReviews({ targetType: "shelter" });

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Your adoption requests
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Track the shelter's review of every animal you've requested to
            adopt.
          </p>
        </div>
        <Link
          to={paths.animals}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <PawPrint className="h-4 w-4" aria-hidden />
          Browse animals
        </Link>
      </div>

      {locationState?.justRequested && (
        <p className="mt-6 flex items-center gap-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Your adoption request has been submitted for the shelter to review.
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
        {requestsQuery.isPending && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((key) => (
              <AdoptionRequestCardSkeleton key={key} />
            ))}
          </div>
        )}

        {requestsQuery.isError && (
          <ErrorState
            description="We couldn't load your adoption requests right now."
            onRetry={() => requestsQuery.refetch()}
          />
        )}

        {requestsQuery.isSuccess && requestsQuery.data.length === 0 && (
          <EmptyState
            icon={<ClipboardX className="h-6 w-6" aria-hidden />}
            title={status ? "No requests with this status" : "No adoption requests yet"}
            description={
              status
                ? "Try a different status filter."
                : "Browse available animals to submit your first adoption request."
            }
          />
        )}

        {requestsQuery.isSuccess && requestsQuery.data.length > 0 && (
          <div className="flex flex-col gap-4">
            {requestsQuery.data.map((request) => {
              const existingReview = myShelterReviewsQuery.data?.find(
                (review) => review.transactionId === request._id,
              );

              return (
                <AdoptionRequestCard
                  key={request._id}
                  request={request}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  isCancelling={
                    cancelMutation.isPending && cancelMutation.variables === request._id
                  }
                  reviewCta={getReviewCtaState(request.status === "completed", existingReview)}
                />
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
};

export default AdoptionRequestsPage;
