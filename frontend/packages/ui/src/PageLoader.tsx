import { motion, useReducedMotion } from "framer-motion";
import { PawPulseMark } from "./PawPulseMark";

export interface PageLoaderProps {
  label?: string;
}

/**
 * Compact, centered fallback for React.lazy()-loaded routes (used inside a
 * <Suspense>) and other route/page transitions. Same paw-pulse mark as
 * AppLoader, sized down — no spinner, one consistent branded loading
 * experience everywhere in the app.
 */
export const PageLoader = ({ label = "Loading..." }: PageLoaderProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
    >
      <PawPulseMark size="md" />
      <motion.p
        className="text-sm font-medium text-slate-500"
        animate={reduceMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {label}
      </motion.p>
    </motion.div>
  );
};
