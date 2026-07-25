import { Skeleton } from "./Skeleton";
import { VisuallyHidden } from "./VisuallyHidden";
import { cn } from "@paw-match/utilities";

export interface ListSkeletonProps {
  /** Number of placeholder rows to render. */
  count?: number;
  label?: string;
  className?: string;
}

/** Generic list-item placeholder — a stand-in for any single-column list of cards while it loads. */
export const ListSkeleton = ({ count = 3, label = "Loading", className }: ListSkeletonProps) => (
  <div role="status" aria-live="polite" className={cn("flex flex-col gap-4", className)}>
    <VisuallyHidden>{label}</VisuallyHidden>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        aria-hidden
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);
