import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { Container } from "@paw-match/ui";

const stats = [
  { value: 2500, suffix: "+", label: "Animals adopted" },
  { value: 150, suffix: "+", label: "Verified shelters" },
  { value: 40, suffix: "+", label: "Veterinarians" },
  { value: 98, suffix: "%", label: "Successful adoptions" },
];

interface AnimatedCounterProps {
  target: number;
  suffix: string;
  reduceMotion: boolean;
}

const AnimatedCounter = ({ target, suffix, reduceMotion }: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (!isInView || reduceMotion) return;

    const controls = animate(0, target, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (value) => setDisplay(Math.round(value)),
    });

    return () => controls.stop();
  }, [isInView, target, reduceMotion]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};

/** Illustrative milestone figures for the marketing statistics band, not a live query. */
export const Statistics = () => {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <section
      id="statistics"
      className="relative overflow-hidden bg-slate-950 py-24 sm:py-28"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-slate-950 to-accent-900/30"
      />
      <div
        aria-hidden
        className="absolute left-1/4 top-0 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute right-1/4 bottom-0 h-72 w-72 translate-y-1/2 rounded-full bg-accent-500/20 blur-3xl"
      />

      <Container className="relative">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-300">
            Our impact
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Numbers that tell the story
          </h2>
        </motion.div>

        <div className="mt-16 grid grid-cols-2 gap-10 sm:gap-8 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.1 }}
              className="text-center"
            >
              <p className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} reduceMotion={reduceMotion} />
              </p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
