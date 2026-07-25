import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@paw-match/utilities";

export interface PawPulseMarkProps {
  /** Badge + icon size — "lg" for the full-screen AppLoader, "md" for the compact PageLoader. */
  size?: "md" | "lg";
  className?: string;
}

const badgeSizeClasses: Record<"md" | "lg", string> = {
  md: "h-14 w-14 rounded-2xl",
  lg: "h-20 w-20 rounded-[28px] sm:h-24 sm:w-24",
};

const iconSizeClasses: Record<"md" | "lg", string> = {
  md: "h-8 w-8",
  lg: "h-12 w-12 sm:h-14 sm:w-14",
};

// One full wave (all four pads) per CYCLE_SECONDS — matches the "toe 1, toe
// 2, toe 3, toe 4, then repeat" brief. Each pad's own transition is
// { duration: PULSE_SECONDS, delay: index * STAGGER_SECONDS, repeatDelay },
// where repeatDelay = CYCLE_SECONDS - PULSE_SECONDS. Since every pad shares
// the exact same (duration + repeatDelay), each one's own iterations recur
// exactly CYCLE_SECONDS apart forever — the initial stagger between pads
// never drifts, so the wave stays a clean, stable loop indefinitely instead
// of slowly desyncing.
const CYCLE_SECONDS = 1.3;
const PULSE_SECONDS = 0.5;
const STAGGER_SECONDS = 0.15;

/** Mirrors lucide-react's PawPrint glyph (same 24x24 geometry as Logo.tsx's icon and both apps' favicon.svg), split into 4 independently-animatable shapes — the 3 small toe pads plus the larger main pad. */
const toePads = [
  { type: "circle" as const, cx: 11, cy: 4, r: 2 },
  { type: "circle" as const, cx: 18, cy: 8, r: 2 },
  { type: "circle" as const, cx: 20, cy: 16, r: 2 },
  {
    type: "path" as const,
    d: "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z",
    origin: "7.3px 15px",
  },
];

/**
 * The animated centerpiece of both AppLoader and PageLoader. The badge
 * (rounded square, brand-600) never moves, scales, or rotates — only the
 * four paw-pad shapes inside pulse opacity + scale, one after another, on
 * an infinite loop. Both animated properties (opacity, transform: scale)
 * are compositor-only — Framer Motion drives them via the Web Animations
 * API once mounted, outside React's render loop, so the wave runs at a
 * steady 60fps without triggering any React re-renders or layout/paint
 * work per frame.
 */
export const PawPulseMark = ({ size = "lg", className }: PawPulseMarkProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-brand-600 text-white shadow-lg shadow-brand-600/25",
        badgeSizeClasses[size],
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className={iconSizeClasses[size]} aria-hidden focusable="false">
        {toePads.map((pad, index) => {
          const transition = reduceMotion
            ? { duration: 0 }
            : {
                duration: PULSE_SECONDS,
                delay: index * STAGGER_SECONDS,
                repeat: Infinity,
                repeatDelay: CYCLE_SECONDS - PULSE_SECONDS,
                ease: "easeInOut" as const,
              };

          const animate = reduceMotion ? { opacity: 1, scale: 1 } : { opacity: [0.35, 1, 0.35], scale: [0.82, 1.04, 0.82] };

          if (pad.type === "circle") {
            return (
              <motion.circle
                key={index}
                cx={pad.cx}
                cy={pad.cy}
                r={pad.r}
                fill="currentColor"
                style={{ transformOrigin: `${pad.cx}px ${pad.cy}px` }}
                animate={animate}
                transition={transition}
              />
            );
          }

          return (
            <motion.path
              key={index}
              d={pad.d}
              fill="currentColor"
              style={{ transformOrigin: pad.origin }}
              animate={animate}
              transition={transition}
            />
          );
        })}
      </svg>
    </div>
  );
};
