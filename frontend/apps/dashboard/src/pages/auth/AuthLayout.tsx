import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Container, Logo } from "@paw-match/ui";

export interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Mirrors apps/public-web/src/pages/auth/AuthLayout.tsx's shell exactly. */
export const AuthLayout = ({ title, description, children }: AuthLayoutProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/50 via-white to-accent-50/40 py-12">
      <Container className="flex justify-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-xl sm:p-8"
        >
          <Logo />

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}

          <div className="mt-6">{children}</div>
        </motion.div>
      </Container>
    </div>
  );
};
