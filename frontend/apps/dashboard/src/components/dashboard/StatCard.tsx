import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { IconBadge } from "@paw-match/ui";
import type { IconBadgeTone } from "@paw-match/ui";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone?: IconBadgeTone;
  index?: number;
}

/** Same glass-card language as QuickLinkCard — a compact metric display instead of a navigable link. */
export const StatCard = ({ label, value, icon: Icon, tone = "brand", index = 0 }: StatCardProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.06 }}
      className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl"
    >
      <IconBadge tone={tone}>
        <Icon className="h-6 w-6" aria-hidden />
      </IconBadge>
      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </motion.div>
  );
};
