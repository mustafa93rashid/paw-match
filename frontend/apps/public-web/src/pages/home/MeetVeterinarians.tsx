import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Star, Stethoscope, UserRound } from "lucide-react";
import { ButtonLink, Container, EmptyState, Spinner } from "@paw-match/ui";
import { getAverageRating } from "@paw-match/utilities";
import { useAuth } from "../../lib/auth";
import { vetProfileHooks } from "../../lib/vetProfileHooks";
import { paths } from "../../routes/paths";

const dayAbbreviation: Record<string, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

/**
 * GET /vet-profile requires authentication (any role) — anonymous visitors
 * get an honest sign-in invitation. Vets with an orphaned userId (a
 * confirmed backend data-integrity issue — see VetProfile type notes) are
 * filtered out rather than shown as broken cards.
 */
export const MeetVeterinarians = () => {
  const reduceMotion = useReducedMotion();
  const auth = useAuth();
  const vetsQuery = vetProfileHooks.useVets({}, { enabled: auth.isAuthenticated });

  const vets = (vetsQuery.data ?? []).filter((vet) => vet.userId !== null).slice(0, 6);

  return (
    <section id="veterinarians" className="py-24 sm:py-28">
      <Container>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Veterinary care
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Meet our veterinarians
          </h2>
        </motion.div>

        <div className="mt-14">
          {!auth.isAuthenticated && (
            <EmptyState
              icon={<Stethoscope className="h-6 w-6" aria-hidden />}
              title="Sign in to meet our veterinary partners"
              description="Vet profiles are shown to signed-in visitors."
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

          {auth.isAuthenticated && vetsQuery.isPending && <Spinner label="Loading veterinarians…" />}

          {auth.isAuthenticated && vetsQuery.isSuccess && vets.length === 0 && (
            <EmptyState
              icon={<Stethoscope className="h-6 w-6" aria-hidden />}
              title="No veterinarian profiles to show right now"
              description="Check back soon, or browse the full directory."
              action={<ButtonLink to={paths.veterinarians}>Browse veterinarians</ButtonLink>}
            />
          )}

          {vets.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vets.map((vet, index) => {
                const rating = getAverageRating(vet.reviews);

                return (
                  <motion.div
                    key={vet._id}
                    initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, delay: reduceMotion ? 0 : (index % 3) * 0.08 }}
                    whileHover={reduceMotion ? undefined : { y: -6 }}
                    className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      {vet.userId!.profileImage?.url ? (
                        <img
                          src={vet.userId!.profileImage.url}
                          alt=""
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-100 text-accent-600">
                          <UserRound className="h-7 w-7" aria-hidden />
                        </span>
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Dr. {vet.userId!.firstName} {vet.userId!.lastName}
                        </h3>
                        {vet.specialization && (
                          <p className="text-sm text-slate-500">{vet.specialization}</p>
                        )}
                        {rating !== undefined && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Star className="h-3.5 w-3.5" fill="#f8591a" style={{ color: "#f8591a" }} aria-hidden />
                            {rating.toFixed(1)} ({vet.reviews.length})
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-500">
                      {vet.experienceYears} {vet.experienceYears === 1 ? "year" : "years"} of
                      experience
                    </p>

                    {vet.availableDays.length > 0 && (
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {vet.availableDays.map((day) => dayAbbreviation[day]).join(", ")}
                      </p>
                    )}

                    <ButtonLink
                      to={paths.veterinarianDetail(vet.userId!._id)}
                      variant="secondary"
                      size="sm"
                      className="mt-auto self-start"
                    >
                      View profile
                    </ButtonLink>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};
