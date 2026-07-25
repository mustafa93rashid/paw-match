import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, PawPrint } from "lucide-react";
import { ButtonLink, Container, EmptyState, Spinner } from "@paw-match/ui";
import type { Animal } from "@paw-match/types";
import { useAuth } from "../../lib/auth";
import { animalHooks } from "../../lib/animalHooks";
import { useFavorites } from "../../lib/useFavorites";
import { paths } from "../../routes/paths";
import { AnimalSlideCard } from "./components/AnimalSlideCard";
import { QuickViewModal } from "./components/QuickViewModal";

/**
 * GET /animals requires authentication (any role) — there is no public
 * animal-browsing endpoint. Anonymous visitors see an honest sign-in
 * invitation here instead of fabricated animal data.
 */
export const FeaturedAnimals = () => {
  const reduceMotion = useReducedMotion();
  const auth = useAuth();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [quickViewAnimal, setQuickViewAnimal] = useState<Animal | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const animalsQuery = animalHooks.useAnimals(
    { adoptionStatus: "available" },
    { enabled: auth.isAuthenticated },
  );

  const scrollByCards = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  };

  const animals = animalsQuery.data?.slice(0, 10) ?? [];

  return (
    <section id="featured-animals" className="relative py-24 sm:py-28">
      {/* Everything — heading, controls, and the slider viewport — shares
          this one Container so the slider's edges line up with the rest of
          the page instead of drifting to the full browser width. */}
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Featured animals
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Meet a few waiting to meet you
            </h2>
          </motion.div>

          {auth.isAuthenticated && animals.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                aria-label="Scroll left"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                aria-label="Scroll right"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </div>

        {/* Slider viewport: width 100% of the Container, overflow-hidden so
            nothing (hover lift, shadows, snapped-off cards) can visually
            cross the page container. The scrollable track inside still
            uses overflow-x-auto so native scroll/snap and the arrow
            buttons' scrollBy() keep working. */}
        <div className="relative mt-12 overflow-hidden py-2">
          {!auth.isAuthenticated && (
            <EmptyState
              icon={<PawPrint className="h-6 w-6" aria-hidden />}
              title="Sign in to see today's available animals"
              description="Animal profiles are shown to signed-in visitors so shelters can share full, accurate details."
              action={
                <div className="flex gap-3">
                  <ButtonLink to={paths.login}>Sign in</ButtonLink>
                  <ButtonLink to={paths.signup} variant="secondary">
                    Create an account
                  </ButtonLink>
                </div>
              }
            />
          )}

          {auth.isAuthenticated && animalsQuery.isPending && (
            <Spinner label="Loading available animals…" />
          )}

          {auth.isAuthenticated && animalsQuery.isSuccess && animals.length === 0 && (
            <EmptyState
              icon={<PawPrint className="h-6 w-6" aria-hidden />}
              title="No animals available right now"
              description="Check back soon, or browse the full directory."
              action={<ButtonLink to={paths.animals}>Browse all animals</ButtonLink>}
            />
          )}

          {auth.isAuthenticated && animals.length > 0 && (
            <motion.div
              ref={scrollerRef}
              initial={reduceMotion ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="flex w-full snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {animals.map((animal) => (
                <AnimalSlideCard
                  key={animal._id}
                  animal={animal}
                  isFavorite={isFavorite(animal._id)}
                  onToggleFavorite={toggleFavorite}
                  onQuickView={setQuickViewAnimal}
                />
              ))}
            </motion.div>
          )}
        </div>
      </Container>

      <QuickViewModal animal={quickViewAnimal} onClose={() => setQuickViewAnimal(null)} />
    </section>
  );
};
