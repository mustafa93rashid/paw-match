import { motion, useReducedMotion } from "framer-motion";
import { MessageSquareHeart } from "lucide-react";
import { Container, EmptyState, Spinner } from "@paw-match/ui";
import { shelterHooks } from "../../lib/shelterHooks";
import { reviewHooks } from "../../lib/reviewHooks";
import { StoryCard } from "./components/StoryCard";

/**
 * Real reviews only — GET /reviews/target/shelter/:id is public and already
 * includes the real adopter's first/last name and profile photo, so nothing
 * here is invented. A fixed 3 shelters are sampled (not every shelter) to
 * keep this to a bounded number of requests.
 */
export const SuccessStories = () => {
  const reduceMotion = useReducedMotion();
  const sheltersQuery = shelterHooks.useShelters();
  const shelters = sheltersQuery.data?.slice(0, 3) ?? [];

  const reviewsA = reviewHooks.useTargetReviews("shelter", shelters[0]?._id);
  const reviewsB = reviewHooks.useTargetReviews("shelter", shelters[1]?._id);
  const reviewsC = reviewHooks.useTargetReviews("shelter", shelters[2]?._id);

  const isLoading =
    sheltersQuery.isPending || reviewsA.isPending || reviewsB.isPending || reviewsC.isPending;

  const stories = [
    ...(reviewsA.data ?? []).map((review) => ({ review, shelter: shelters[0] })),
    ...(reviewsB.data ?? []).map((review) => ({ review, shelter: shelters[1] })),
    ...(reviewsC.data ?? []).map((review) => ({ review, shelter: shelters[2] })),
  ].filter((story) => story.review.comment && story.shelter);

  return (
    <section
      id="success-stories"
      className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/40 to-white py-24 sm:py-28"
    >
      <div
        aria-hidden
        className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-accent-200/30 blur-3xl"
      />

      <Container className="relative">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Real stories
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Adoptions, in adopters&rsquo; own words
          </h2>
        </motion.div>

        <div className="mt-14">
          {isLoading && <Spinner label="Loading real adopter reviews…" />}

          {!isLoading && stories.length === 0 && (
            <EmptyState
              icon={<MessageSquareHeart className="h-6 w-6" aria-hidden />}
              title="No reviews to feature yet"
              description="As adopters complete adoptions and share reviews, their stories will appear here."
            />
          )}

          {!isLoading && stories.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {stories.map(({ review, shelter }) => (
                <StoryCard
                  key={review._id}
                  review={review}
                  shelterName={shelter!.name}
                  shelterImageUrl={shelter!.logo?.url}
                />
              ))}
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
};
