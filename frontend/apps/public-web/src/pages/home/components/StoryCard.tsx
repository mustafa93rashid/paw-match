import { motion } from "framer-motion";
import { Quote, Star, UserRound } from "lucide-react";
import type { Review } from "@paw-match/types";

export interface StoryCardProps {
  review: Review;
  shelterName: string;
  shelterImageUrl?: string;
}

export const StoryCard = ({ review, shelterName, shelterImageUrl }: StoryCardProps) => (
  <motion.div
    className="w-[320px] shrink-0 snap-start rounded-[28px] border border-white/60 bg-white/60 p-7 shadow-xl shadow-slate-900/5 backdrop-blur-xl sm:w-[380px]"
    whileHover={{ y: -6 }}
    transition={{ type: "spring", stiffness: 260, damping: 22 }}
  >
    <Quote className="h-8 w-8 text-brand-300" aria-hidden />

    <div className="mt-3 flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className="h-4 w-4"
          fill={index < review.rating ? "#f8591a" : "none"}
          strokeWidth={1.5}
          style={{ color: "#f8591a" }}
          aria-hidden
        />
      ))}
    </div>

    <p className="mt-4 text-[15px] leading-relaxed text-slate-700">&ldquo;{review.comment}&rdquo;</p>

    <div className="mt-6 flex items-center gap-3 border-t border-slate-200/70 pt-5">
      {review.adopterId?.profileImage?.url ? (
        <img
          src={review.adopterId.profileImage.url}
          alt=""
          className="h-11 w-11 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <UserRound className="h-5 w-5" aria-hidden />
        </span>
      )}
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {review.adopterId ? `${review.adopterId.firstName} ${review.adopterId.lastName}` : "Unknown adopter"}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          {shelterImageUrl && (
            <img src={shelterImageUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
          )}
          Adopted through {shelterName}
        </p>
      </div>
    </div>
  </motion.div>
);
