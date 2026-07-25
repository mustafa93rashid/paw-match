import { Skeleton } from "./Skeleton";
import { VisuallyHidden } from "./VisuallyHidden";
import { cn } from "@paw-match/utilities";

export interface ProfileSkeletonProps {
  label?: string;
  className?: string;
}

/** Placeholder for a profile/account-settings view: avatar, tabs row, and a field grid. */
export const ProfileSkeleton = ({ label = "Loading", className }: ProfileSkeletonProps) => (
  <div role="status" aria-live="polite" className={cn("flex flex-col gap-6", className)}>
    <VisuallyHidden>{label}</VisuallyHidden>

    <div aria-hidden className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>

    <div aria-hidden className="flex gap-2 border-b border-slate-200 pb-3">
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-8 w-28 rounded-md" />
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>

    <div aria-hidden className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  </div>
);
