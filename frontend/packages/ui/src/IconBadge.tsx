import type { ReactNode } from "react";
import { cn } from "@paw-match/utilities";

export type IconBadgeTone = "brand" | "accent";

export interface IconBadgeProps {
  children: ReactNode;
  tone?: IconBadgeTone;
  className?: string;
}

const toneClasses: Record<IconBadgeTone, string> = {
  brand: "bg-brand-100 text-brand-600",
  accent: "bg-accent-100 text-accent-600",
};

/** Circular icon container used in feature/step lists. Icon itself should carry aria-hidden. */
export const IconBadge = ({ children, tone = "brand", className }: IconBadgeProps) => (
  <span
    className={cn(
      "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
      toneClasses[tone],
      className,
    )}
  >
    {children}
  </span>
);
