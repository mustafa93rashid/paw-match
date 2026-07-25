import { motion, useReducedMotion } from "framer-motion";
import { PawPulseMark } from "./PawPulseMark";

/**
 * Full-screen loader shown only while AuthProvider resolves the initial
 * session check, held for a minimum visible duration (see AppGate.tsx) —
 * never shown again for the rest of the session. Premium, minimal: a
 * stable logo mark with only its paw pads animating (see PawPulseMark),
 * no spinner, no bouncing, no rotation — the logo itself never moves.
 */
export const AppLoader = () => {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <PawPulseMark size="lg" />
      </motion.div>

      <motion.p
        className="text-sm font-medium text-slate-500"
        animate={reduceMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        Finding your perfect companion...
      </motion.p>
    </motion.div>
  );
};
