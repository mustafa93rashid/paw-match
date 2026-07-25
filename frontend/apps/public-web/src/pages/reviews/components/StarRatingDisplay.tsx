import { Star } from "lucide-react";

export interface StarRatingDisplayProps {
  rating: number;
}

/** Read-only star display — decorative icons plus a real text alternative for screen readers. */
export const StarRatingDisplay = ({ rating }: StarRatingDisplayProps) => (
  <div className="flex items-center gap-1">
    <div className="flex" aria-hidden>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={
            value <= rating
              ? "h-6 w-6 fill-amber-400 text-amber-400"
              : "h-6 w-6 text-slate-300"
          }
        />
      ))}
    </div>
    <span className="sr-only">{`${rating} out of 5 stars`}</span>
  </div>
);
