import { motion, useReducedMotion } from "framer-motion";
import {
  KeyRound,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Verified,
} from "lucide-react";
import { Container } from "@paw-match/ui";
import { cn } from "@paw-match/utilities";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Verified shelters",
    description:
      "Every shelter is reviewed and approved before their animals appear publicly.",
    span: "sm:col-span-2",
    tone: "brand" as const,
  },
  {
    icon: Stethoscope,
    title: "Trusted veterinarians",
    description: "Licensed vets connected to the shelter network for real care.",
    span: "",
    tone: "accent" as const,
  },
  {
    icon: Sparkles,
    title: "Smart matching",
    description: "Compatibility scoring across home, lifestyle, and experience.",
    span: "",
    tone: "brand" as const,
  },
  {
    icon: KeyRound,
    title: "Secure requests",
    description: "Adoption requests move through a transparent, auditable pipeline.",
    span: "",
    tone: "accent" as const,
  },
  {
    icon: Star,
    title: "Real reviews",
    description: "Adopters rate shelters and vets after a completed experience.",
    span: "",
    tone: "brand" as const,
  },
  {
    icon: Verified,
    title: "Safe adoption process",
    description:
      "Interview and home-check stages give shelters confidence in every placement, and give you a clear, honest path from first message to bringing your companion home.",
    span: "sm:col-span-2",
    tone: "accent" as const,
  },
];

/** Asymmetric "bento" grid — deliberately not a uniform repetitive card grid. */
export const WhyChooseUs = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section id="why-us" className="py-24 sm:py-28">
      <Container>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Why Paw Match
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            A calmer, more trustworthy way to adopt
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: reduceMotion ? 0 : index * 0.06 }}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              className={cn(
                "group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-xl",
                reason.span,
              )}
            >
              <div
                className={cn(
                  "absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-70",
                  reason.tone === "brand" ? "bg-brand-200/50" : "bg-accent-200/50",
                )}
                aria-hidden
              />

              <span
                className={cn(
                  "relative inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                  reason.tone === "brand"
                    ? "bg-brand-100 text-brand-600"
                    : "bg-accent-100 text-accent-600",
                )}
              >
                <reason.icon className="h-6 w-6" aria-hidden />
              </span>

              <h3 className="relative mt-5 text-lg font-semibold text-slate-900">
                {reason.title}
              </h3>
              <p className="relative mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                {reason.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
