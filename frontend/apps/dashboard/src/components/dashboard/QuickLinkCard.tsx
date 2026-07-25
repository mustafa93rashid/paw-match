import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export interface QuickLinkCardProps {
  label: string;
  description: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  index?: number;
}

/** Same glass-card language as the Public Website's premium sections. */
export const QuickLinkCard = ({ label, description, to, icon: Icon, index = 0 }: QuickLinkCardProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.06 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
    >
      <Link
        to={to}
        className="group flex h-full flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-xl"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
          Open
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </motion.div>
  );
};
