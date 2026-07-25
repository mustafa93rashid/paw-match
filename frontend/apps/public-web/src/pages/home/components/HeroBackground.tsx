import { motion, useTransform, type MotionValue } from "framer-motion";
import { PawPrint } from "lucide-react";

/**
 * Purely decorative — glow blobs, rotating rings, floating paws, and tiny
 * particles behind the hero visual. Everything here animates transform
 * and/or opacity only (no width/height/top/left animation) so it stays on
 * the compositor thread.
 */
export interface HeroBackgroundProps {
  reduceMotion: boolean;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  scrollY: MotionValue<number>;
}

const paws = [
  { top: "6%", left: "8%", size: 22, duration: 6, delay: 0 },
  { top: "78%", left: "4%", size: 16, duration: 7.5, delay: 0.6 },
  { top: "14%", left: "88%", size: 18, duration: 6.8, delay: 1.1 },
  { top: "62%", left: "92%", size: 14, duration: 5.6, delay: 0.3 },
];

const particles = [
  { top: "20%", left: "18%", delay: 0 },
  { top: "40%", left: "78%", delay: 0.8 },
  { top: "68%", left: "30%", delay: 1.4 },
  { top: "82%", left: "70%", delay: 0.5 },
  { top: "10%", left: "55%", delay: 1.9 },
  { top: "55%", left: "10%", delay: 1.1 },
];

export const HeroBackground = ({
  reduceMotion,
  parallaxX,
  parallaxY,
  scrollY,
}: HeroBackgroundProps) => {
  const blobX = useTransform(parallaxX, (value) => value * 0.4);
  const blobY = useTransform(parallaxY, (value) => value * 0.4);
  const glowX = useTransform(parallaxX, (value) => value * 1.4);
  const glowY = useTransform(parallaxY, (value) => value * 1.4);
  const driftY = useTransform(scrollY, (value) => value * -0.16);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{ y: reduceMotion ? 0 : driftY }}
    >
      {/* Large gradient light blobs */}
      <motion.div
        className="absolute -left-24 top-10 h-[26rem] w-[26rem] rounded-full bg-brand-300/30 blur-3xl"
        style={reduceMotion ? undefined : { x: blobX, y: blobY }}
        animate={reduceMotion ? undefined : { scale: [1, 1.12, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-20 top-1/3 h-[22rem] w-[22rem] rounded-full bg-accent-300/25 blur-3xl"
        style={reduceMotion ? undefined : { x: blobX, y: blobY }}
        animate={reduceMotion ? undefined : { scale: [1, 1.18, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Cursor-following glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-200/40 to-accent-200/30 blur-3xl"
        style={reduceMotion ? undefined : { x: glowX, y: glowY }}
      />

      {/* Slowly rotating rings */}
      <motion.div
        className="absolute right-[8%] top-[18%] h-[24rem] w-[24rem] rounded-full border border-brand-300/30"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute right-[14%] top-[24%] h-[16rem] w-[16rem] rounded-full border border-dashed border-accent-300/40"
        animate={reduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating paw prints */}
      {paws.map((paw, index) => (
        <motion.span
          key={index}
          className="absolute text-brand-400/30"
          style={{ top: paw.top, left: paw.left }}
          animate={
            reduceMotion
              ? undefined
              : { y: [0, -14, 0], rotate: [0, 8, 0], opacity: [0.25, 0.5, 0.25] }
          }
          transition={{ duration: paw.duration, repeat: Infinity, ease: "easeInOut", delay: paw.delay }}
        >
          <PawPrint width={paw.size} height={paw.size} aria-hidden />
        </motion.span>
      ))}

      {/* Tiny particles */}
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute h-1.5 w-1.5 rounded-full bg-brand-400/50"
          style={{ top: particle.top, left: particle.left }}
          animate={reduceMotion ? undefined : { opacity: [0.2, 0.8, 0.2], scale: [1, 1.4, 1] }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </motion.div>
  );
};
