import type { ReactNode } from "react";
import { Star } from "lucide-react";
import type { Review } from "@paw-match/types";
import { getAverageRating } from "@paw-match/utilities";

export interface ReviewsSectionProps {
  reviews: Review[];
  emptyMessage: string;
  replyLabel: string;
  /** Optional per-review action slot (e.g. a "Reply" button) — rendered inside each review card. Callers decide when to render anything (e.g. only for reviews without a reply yet). */
  renderAction?: (review: Review) => ReactNode;
}

/**
 * Shared by the Public Website's shelter/vet detail pages and the
 * Dashboard's Reviews page — all consume the identical Review[] shape. The
 * backend's own averageRating/totalReviews fields are never actually
 * persisted (Shelter and VetProfile schemas don't declare them, so
 * Review.calcAverageRating's $set is silently dropped by Mongoose's strict
 * mode) — so the average shown here is computed directly from the real
 * reviews already returned, not read from those broken fields.
 */
export const ReviewsSection = ({ reviews, emptyMessage, replyLabel, renderAction }: ReviewsSectionProps) => {
  const averageRating = getAverageRating(reviews);

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
        {typeof averageRating === "number" && (
          <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            {averageRating.toFixed(1)}
            <span className="text-slate-500">({reviews.length})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review._id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {review.adopterId ? `${review.adopterId.firstName} ${review.adopterId.lastName}` : "Unknown adopter"}
                </span>
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  {review.rating}
                </span>
              </div>
              {review.comment && <p className="mt-2 text-sm text-slate-600">{review.comment}</p>}
              {review.reply && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-700">{replyLabel}</p>
                  <p className="mt-1">{review.reply.text}</p>
                </div>
              )}
              {renderAction && <div className="mt-3">{renderAction(review)}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
