import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { BadgeCheck, Building2, MapPin } from "lucide-react";
import { ButtonLink, Container, EmptyState, Spinner } from "@paw-match/ui";
import { shelterHooks } from "../../lib/shelterHooks";
import { paths } from "../../routes/paths";

/**
 * GET /shelters (public) only ever returns already-verified/active/approved
 * shelters, so the "Verified" badge is honestly unconditional here. Animal
 * counts and ratings aren't part of this public projection, so they're
 * intentionally left out rather than invented.
 */
export const VerifiedShelters = () => {
  const reduceMotion = useReducedMotion();
  const sheltersQuery = shelterHooks.useShelters();
  const shelters = sheltersQuery.data?.slice(0, 6) ?? [];

  return (
    <section id="verified-shelters" className="bg-slate-50 py-24 sm:py-28">
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
              Trust &amp; safety
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Verified shelters you can trust
            </h2>
          </motion.div>

          <ButtonLink to={paths.shelters} variant="secondary">
            View all shelters
          </ButtonLink>
        </div>

        {sheltersQuery.isPending && (
          <div className="mt-14">
            <Spinner label="Loading shelters…" />
          </div>
        )}

        {sheltersQuery.isSuccess && shelters.length === 0 && (
          <div className="mt-14">
            <EmptyState
              icon={<Building2 className="h-6 w-6" aria-hidden />}
              title="No verified shelters yet"
              description="Check back soon as new shelters are approved."
            />
          </div>
        )}

        {shelters.length > 0 && (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {shelters.map((shelter, index) => {
              const coverImage = shelter.images[0]?.url;

              return (
                <motion.div
                  key={shelter._id}
                  initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.55, delay: reduceMotion ? 0 : (index % 3) * 0.08 }}
                  whileHover={reduceMotion ? undefined : { y: -6 }}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl"
                >
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Building2 className="h-10 w-10" aria-hidden />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />

                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-accent-700 shadow">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      Verified
                    </span>

                    <span className="absolute -bottom-7 left-6 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
                      {shelter.logo?.url ? (
                        <img src={shelter.logo.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-slate-300" aria-hidden />
                      )}
                    </span>
                  </div>

                  <div className="p-6 pt-10">
                    <h3 className="text-lg font-semibold text-slate-900">{shelter.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      {shelter.city}
                    </p>

                    <Link
                      to={paths.shelters}
                      className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:underline"
                    >
                      View profile →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
};
