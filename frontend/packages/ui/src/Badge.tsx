import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@paw-match/utilities";

export type BadgeTone = "brand" | "accent" | "neutral" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-100 text-brand-700",
  accent: "bg-accent-100 text-accent-700",
  neutral: "bg-slate-100 text-slate-700",
  danger: "bg-red-100 text-red-700",
};

export const Badge = ({ tone = "brand", className, children, ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
      toneClasses[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
);
