import { useRef, type MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ButtonLink, Container } from "@paw-match/ui";
import { paths } from "../../routes/paths";
import { HeroBackground } from "./components/HeroBackground";
import { HeroVisual } from "./components/HeroVisual";

const trustItems = ["Verified Shelters", "Licensed Veterinarians", "Safe Adoption Process"];

const headlineContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
};

const wordVariant = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const ctaContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.95 } },
};

const ctaItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const Hero = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);

  // Mouse-driven parallax — smoothed with a spring so movement feels fluid
  // rather than snapping directly to the cursor.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.6 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.6 });
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-20, 20]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-16, 16]);

  // Scroll-driven parallax, scoped to how far the hero itself has scrolled
  // past the top of the viewport.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const heroScroll = useTransform(scrollYProgress, [0, 1], [0, 400]);

  const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-accent-50/30"
    >
      <HeroBackground
        reduceMotion={reduceMotion}
        parallaxX={parallaxX}
        parallaxY={parallaxY}
        scrollY={heroScroll}
      />

      <Container className="relative py-24 sm:py-28 lg:py-36">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-12"
        >
          <div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-md ring-1 ring-white/50 backdrop-blur-md">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-brand-500"
                  animate={
                    reduceMotion ? undefined : { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }
                  }
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                Find Your Perfect Companion
              </span>
            </motion.div>

            <motion.h1
              variants={headlineContainer}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tighter text-slate-900 sm:text-6xl lg:text-7xl"
            >
              <span className="block">
                {["Find", "Your", "New"].map((word) => (
                  <motion.span key={word} variants={wordVariant} className="mr-3 inline-block last:mr-0">
                    {word}
                  </motion.span>
                ))}
              </span>
              <motion.span
                variants={wordVariant}
                className="block bg-gradient-to-r from-brand-600 via-brand-400 to-accent-500 bg-clip-text text-transparent"
              >
                Best Friend.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600"
            >
              A calmer, kinder way to adopt. Every shelter is verified, every
              vet is licensed, and every match is built around the life you
              actually live.
            </motion.p>

            <motion.div
              variants={ctaContainer}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <motion.div variants={ctaItem}>
                <ButtonLink
                  to={paths.animals}
                  size="lg"
                  className="rounded-full px-7 shadow-lg shadow-brand-600/20"
                >
                  Adopt Now
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
              </motion.div>
              <motion.div variants={ctaItem}>
                <ButtonLink
                  to={paths.matching}
                  variant="secondary"
                  size="lg"
                  className="rounded-full px-7"
                >
                  Explore Animals
                </ButtonLink>
              </motion.div>
            </motion.div>

            <motion.ul
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600"
            >
              {trustItems.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-500" aria-hidden />
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          <HeroVisual
            reduceMotion={reduceMotion}
            parallaxX={parallaxX}
            parallaxY={parallaxY}
            scrollY={heroScroll}
          />
        </motion.div>
      </Container>
    </section>
  );
};
