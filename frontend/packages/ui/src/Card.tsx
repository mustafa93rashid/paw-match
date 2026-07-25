import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@paw-match/utilities";

export type CardPadding = "none" | "md";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: CardPadding;
}

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  md: "p-6",
};

export const Card = ({
  className,
  children,
  padding = "md",
  ...props
}: CardProps) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200 bg-white shadow-sm",
      paddingClasses[padding],
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
