import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button, EmptyState, ErrorState, ReviewsSection, Spinner } from "@paw-match/ui";
import type { Review } from "@paw-match/types";
import { useAuth } from "../../lib/auth";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";
import { vetProfileSelfHooks } from "../../lib/vetProfileSelfHooks";
import { ReviewsFilters } from "./components/ReviewsFilters";
import type { ReviewsFilterValue } from "./components/ReviewsFilters";
import { ReplyToReviewDialog } from "./components/ReplyToReviewDialog";

/**
 * Shared between shelterEmployee and vet roles (route-guarded to those two
 * in App.tsx). Neither role has a dedicated reviews-listing endpoint —
 * reviews are embedded in GET /shelters/:id (employee accessLevel branch)
 * and GET /vet-profile/me respectively, so this page reuses whichever of
 * those two the current role already has to fetch anyway.
 */
const ReviewsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const auth = useAuth();
  const role = auth.user?.role;
  const isShelterEmployee = role === "shelterEmployee";
  const isVet = role === "vet";

  const [filter, setFilter] = useState<ReviewsFilterValue>("all");
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);

  const shelterEmployeeProfileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile({
    enabled: isShelterEmployee,
  });
  const shelterId = shelterEmployeeProfileQuery.data?.shelterId?._id;
  const shelterDetailQuery = shelterEmployeeShelterHooks.useMyShelterDetail(
    isShelterEmployee ? shelterId : undefined,
  );

  const vetProfileQuery = vetProfileSelfHooks.useMyVetProfile({ enabled: isVet });

  const replyLabel = isShelterEmployee ? "Shelter reply" : "Vet reply";

  const reviews: Review[] | undefined = isShelterEmployee
    ? shelterDetailQuery.data?.reviews
    : isVet
      ? vetProfileQuery.data?.reviews
      : undefined;

  const filteredReviews = useMemo(() => {
    const list = reviews ?? [];
    if (filter === "needsReply") return list.filter((review) => !review.reply);
    if (filter === "replied") return list.filter((review) => Boolean(review.reply));
    return list;
  }, [reviews, filter]);

  if (isShelterEmployee && shelterEmployeeProfileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }
  if (isShelterEmployee && shelterEmployeeProfileQuery.isError) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => shelterEmployeeProfileQuery.refetch()} />;
  }
  if (isShelterEmployee && !shelterId) {
    return (
      <EmptyState
        title="You're not assigned to a shelter yet"
        description="Contact your administrator to be added to a shelter."
      />
    );
  }

  const isLoading = isShelterEmployee ? shelterDetailQuery.isLoading : vetProfileQuery.isLoading;
  const isError = isShelterEmployee ? shelterDetailQuery.isError : vetProfileQuery.isError;
  const handleRetry = isShelterEmployee
    ? () => shelterDetailQuery.refetch()
    : () => vetProfileQuery.refetch();

  if (isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading reviews…" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState title="Couldn't load reviews" onRetry={handleRetry} />;
  }

  const emptyMessage =
    (reviews ?? []).length === 0
      ? "Reviews from adopters will show up here."
      : "No reviews match this filter — try a different one above.";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Reviews</h1>
      <p className="mt-2 max-w-xl text-slate-600">Read and reply to reviews from adopters.</p>

      <div className="mt-6">
        <ReviewsFilters value={filter} onChange={setFilter} />
      </div>

      <ReviewsSection
        reviews={filteredReviews}
        emptyMessage={emptyMessage}
        replyLabel={replyLabel}
        renderAction={(review) =>
          !review.reply && (
            <Button variant="secondary" size="sm" onClick={() => setReplyTarget(review)}>
              Reply
            </Button>
          )
        }
      />

      <ReplyToReviewDialog review={replyTarget} replyLabel={replyLabel} onClose={() => setReplyTarget(null)} />
    </motion.div>
  );
};

export default ReviewsPage;
