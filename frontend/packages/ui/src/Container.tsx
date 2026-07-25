import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@paw-match/utilities";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Centers content with the shared max-width and responsive gutter used across pages. */
export const Container = ({ className, children, ...props }: ContainerProps) => (
  <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props}>
    {children}
  </div>
);
