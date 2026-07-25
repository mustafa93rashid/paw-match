import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PawPrint } from "lucide-react";
import { ButtonLink, Container } from "@paw-match/ui";
import { paths } from "../../routes/paths";

/** Large, full-bleed emotional close — deliberately the boldest section on the page. */
export const FinalCta = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="final-cta"
      className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-700 py-28 sm:py-36"
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-white/10 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full border border-white/10"
      />

      <Container className="relative flex flex-col items-center gap-7 text-center">
        <motion.span
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur"
        >
          <PawPrint className="h-3.5 w-3.5" aria-hidden />
          Your new best friend is waiting
        </motion.span>

        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-6xl"
        >
          Every day you wait, they're still waiting too.
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-lg text-lg text-brand-50"
        >
          Create an adopter profile in minutes and start seeing animals
          matched to your home and lifestyle.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ButtonLink
            to={paths.signup}
            variant="secondary"
            size="lg"
            className="rounded-full px-8 shadow-xl"
          >
            Get started free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </motion.div>
      </Container>
    </section>
  );
};
