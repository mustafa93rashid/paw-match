import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Stethoscope } from "lucide-react";
import { Container } from "@paw-match/ui";
import { cn } from "@paw-match/utilities";
import { paths } from "../../routes/paths";

const MotionLink = motion.create(Link);

const options = [
  {
    icon: Building2,
    title: "Create and manage a shelter",
    description:
      "Apply as a Shelter Manager to register your shelter with Paw Match. Once approved, you'll be able to list animals, review adoption requests, and manage your team.",
    to: paths.applyShelterManager,
    cta: "Apply as a Shelter Manager",
    tone: "brand" as const,
  },
  {
    icon: Stethoscope,
    title: "Join as a veterinarian",
    description:
      "Apply to join the Paw Match veterinary network. Once approved, adopters and shelters will be able to find you and request appointments.",
    to: paths.applyVet,
    cta: "Apply as a Veterinarian",
    tone: "accent" as const,
  },
];

/**
 * Every application goes through Super Admin review before any account is
 * created — see StaffApplication's approval flow. Neither card creates a
 * privileged account by itself; both just open the application form.
 */
export const WorkWithUs = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section id="work-with-us" className="py-24 sm:py-28">
      <Container>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Work with us
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Help more animals find their way home
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Shelters and veterinarians are the backbone of Paw Match. Apply below and our team
            will review your application.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {options.map((option, index) => (
            <MotionLink
              key={option.title}
              to={option.to}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: reduceMotion ? 0 : index * 0.1 }}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              className="group relative block overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl"
            >
              <div
                className={cn(
                  "absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-70",
                  option.tone === "brand" ? "bg-brand-200/50" : "bg-accent-200/50",
                )}
                aria-hidden
              />

              <span
                className={cn(
                  "relative inline-flex h-14 w-14 items-center justify-center rounded-2xl",
                  option.tone === "brand"
                    ? "bg-brand-100 text-brand-600"
                    : "bg-accent-100 text-accent-600",
                )}
              >
                <option.icon className="h-7 w-7" aria-hidden />
              </span>

              <h3 className="relative mt-6 text-xl font-semibold text-slate-900">
                {option.title}
              </h3>
              <p className="relative mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                {option.description}
              </p>

              <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                {option.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </MotionLink>
          ))}
        </div>
      </Container>
    </section>
  );
};
