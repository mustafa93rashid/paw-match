import { motion, useTransform, type MotionValue } from "framer-motion";

/**
 * Swap these two constants to replace the hero photography — nothing else
 * in this file needs to change. Both are real stock photos (Unsplash),
 * not illustrations. Fetched at a higher resolution/quality and as WebP
 * for a crisper render inside the glass cards.
 */
const DOG_IMAGE_URL =
  "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&h=1500&q=85&fm=webp";
const CAT_IMAGE_URL =
  "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=900&h=1150&q=85&fm=webp";

export interface HeroVisualProps {
  reduceMotion: boolean;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  scrollY: MotionValue<number>;
}

export const HeroVisual = ({ reduceMotion, parallaxX, parallaxY, scrollY }: HeroVisualProps) => {
  const dogParallaxX = useTransform(parallaxX, (value) => value * 0.6);
  const dogParallaxY = useTransform(parallaxY, (value) => value * 0.6);
  const catParallaxX = useTransform(parallaxX, (value) => value * -1.1);
  const catParallaxY = useTransform(parallaxY, (value) => value * -1.1);
  const glowParallaxX = useTransform(parallaxX, (value) => value * 0.3);
  const glowParallaxY = useTransform(parallaxY, (value) => value * 0.3);
  const visualScrollY = useTransform(scrollY, (value) => value * -0.08);

  return (
    <motion.div
      className="relative mx-auto h-[420px] w-full max-w-[560px] sm:h-[520px] lg:h-[620px]"
      style={{ y: reduceMotion ? 0 : visualScrollY }}
    >
      {/* Layered glow behind the composition — depth + premium lighting. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ x: reduceMotion ? 0 : glowParallaxX, y: reduceMotion ? 0 : glowParallaxY }}
      >
        <motion.div
          className="absolute right-[8%] top-[6%] h-72 w-72 rounded-full bg-gradient-to-br from-brand-300/40 via-brand-200/25 to-transparent blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[8%] left-[4%] h-64 w-64 rounded-full bg-gradient-to-tr from-accent-300/35 via-accent-200/20 to-transparent blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />
        <div className="absolute right-[16%] top-[22%] h-40 w-40 rounded-full border border-white/40" />
      </motion.div>

      {/* Dog — primary visual */}
      <motion.div
        className="absolute right-[2%] top-0 h-[78%] w-[72%]"
        style={{ x: reduceMotion ? 0 : dogParallaxX, y: reduceMotion ? 0 : dogParallaxY }}
      >
        <motion.div
          className="h-full w-full"
          initial={reduceMotion ? false : { opacity: 0, x: 100, scale: 0.92, rotate: 2 }}
          animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
        >
          <motion.div
            className="relative h-full w-full rounded-[32px] border border-white/60 bg-white/15 p-2.5 shadow-[0_30px_60px_-15px_rgba(184,51,13,0.25)] backdrop-blur-2xl"
            animate={reduceMotion ? undefined : { y: [0, -16, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/40 via-white/0 to-transparent" />
            <div className="relative h-full w-full overflow-hidden rounded-[24px]">
              <img
                src={DOG_IMAGE_URL}
                alt="A happy dog waiting to be adopted"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Cat — sits partially in front of the dog */}
      <motion.div
        className="absolute bottom-0 left-0 z-20 h-[52%] w-[54%]"
        style={{ x: reduceMotion ? 0 : catParallaxX, y: reduceMotion ? 0 : catParallaxY }}
      >
        <motion.div
          className="h-full w-full"
          initial={reduceMotion ? false : { opacity: 0, x: 44, y: 64, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
        >
          <motion.div
            className="relative h-full w-full rounded-[32px] border border-white/70 bg-white/15 p-2 shadow-[0_24px_50px_-12px_rgba(23,99,95,0.3)] backdrop-blur-2xl"
            animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/40 via-white/0 to-transparent" />
            <div className="relative h-full w-full overflow-hidden rounded-[24px]">
              <img
                src={CAT_IMAGE_URL}
                alt="A calm cat waiting to be adopted"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
