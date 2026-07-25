import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Container, Logo } from "@paw-match/ui";
import { paths } from "../../routes/paths";

export interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared centered-card shell for every auth page (sign in, sign up, verify, reset, ...). */
export const AuthLayout = ({ title, description, children, footer }: AuthLayoutProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 py-12">
      <Container className="flex justify-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <Link to={paths.home} className="inline-flex" aria-label="Paw Match home">
            <Logo />
          </Link>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-slate-600">{description}</p>
          )}

          <div className="mt-6">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </motion.div>
      </Container>
    </div>
  );
};
