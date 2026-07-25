import type { HTMLAttributes } from "react";
import { cn } from "@paw-match/utilities";

/** Generic pulsing placeholder block used to build resource-specific skeletons. */
export const Skeleton = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("animate-pulse rounded-lg bg-slate-200", className)}
    aria-hidden
    {...props}
  />
);
