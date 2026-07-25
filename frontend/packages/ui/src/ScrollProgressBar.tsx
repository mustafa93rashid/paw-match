import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/** Fixed, site-wide reading-progress indicator — sits above a sticky header. */
export const ScrollProgressBar = () => {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: reduceMotion ? 1000 : 200,
    damping: reduceMotion ? 100 : 40,
    mass: 0.2,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500"
      style={{ scaleX }}
    />
  );
};
