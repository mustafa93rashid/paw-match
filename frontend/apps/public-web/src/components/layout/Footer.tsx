import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { PawPrint } from "lucide-react";
import { Container } from "@paw-match/ui";
import { paths } from "../../routes/paths";

const exploreLinks = [
  { label: "Home", to: paths.home },
  { label: "Shelters", to: paths.shelters },
  { label: "Animals", to: paths.animals },
  { label: "Veterinarians", to: paths.veterinarians },
  { label: "Matching", to: paths.matching },
];

const accountLinks = [
  { label: "Sign up", to: paths.signup },
  { label: "Log in", to: paths.login },
];

const linkClassName =
  "text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded";

export const Footer = () => {
  const reduceMotion = useReducedMotion();

  return (
    <footer className="relative overflow-hidden bg-slate-950">
      <div
        aria-hidden
        className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-accent-600/20 blur-3xl"
      />

      <Container className="relative grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="sm:col-span-2 lg:col-span-2"
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <PawPrint className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">Paw Match</span>
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Paw Match connects verified shelters with adopters through smart
            compatibility matching, so every animal finds a home that
            actually fits their life.
          </p>
        </motion.div>

        <motion.nav
          aria-label="Explore"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {exploreLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.nav>

        <motion.nav
          aria-label="Account"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h2 className="text-sm font-semibold text-white">Get started</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {accountLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.nav>
      </Container>

      <div className="relative border-t border-white/10">
        <Container className="flex flex-col items-center gap-2 py-6 text-center text-sm text-slate-500 sm:flex-row sm:justify-between sm:text-left">
          <p>&copy; {new Date().getFullYear()} Paw Match. All rights reserved.</p>
          <p>Built to help every animal find their forever home.</p>
        </Container>
      </div>
    </footer>
  );
};
