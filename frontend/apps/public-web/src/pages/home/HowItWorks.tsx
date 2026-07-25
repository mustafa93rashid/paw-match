import { motion, useReducedMotion } from "framer-motion";
import { Home, MessageCircleHeart, Sparkles, UserPlus } from "lucide-react";
import { Container } from "@paw-match/ui";

const steps = [
  {
    icon: UserPlus,
    title: "Create your profile",
    description:
      "Tell us about your home, experience, and lifestyle so we understand what kind of companion fits you best.",
  },
  {
    icon: Sparkles,
    title: "Get matched",
    description:
      "Browse animals ranked by compatibility with your profile, from shelters that are verified and active.",
  },
  {
    icon: MessageCircleHeart,
    title: "Connect with a shelter",
    description:
      "Submit an adoption request and work directly with the shelter through interview and home-check stages.",
  },
  {
    icon: Home,
    title: "Bring them home",
    description:
      "Once approved, complete the adoption process and welcome your new companion into your family.",
  },
];

/** Alternating left/right vertical timeline — deliberately distinct from the horizontal slider above it. */
export const HowItWorks = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="bg-slate-50 py-24 sm:py-28">
      <Container>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            The journey
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            How Paw Match works
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            A guided path from first search to a completed adoption.
          </p>
        </motion.div>

        <div className="relative mx-auto mt-20 max-w-3xl">
          <div
            aria-hidden
            className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-brand-200 via-slate-200 to-transparent sm:block"
          />

          <ol className="flex flex-col gap-16">
            {steps.map((step, index) => {
              const isRight = index % 2 === 1;

              return (
                <motion.li
                  key={step.title}
                  initial={reduceMotion ? false : { opacity: 0, x: isRight ? 40 : -40, y: 16 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative flex flex-col items-start gap-4 text-left sm:w-[calc(50%-2.5rem)] ${
                    isRight ? "sm:ml-auto" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute top-1 hidden h-3 w-3 rounded-full border-2 border-white bg-brand-600 shadow sm:block ${
                      isRight ? "-left-[2.6rem]" : "-right-[2.6rem]"
                    }`}
                  />

                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-md shadow-slate-900/5">
                      <step.icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Step {index + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
};
