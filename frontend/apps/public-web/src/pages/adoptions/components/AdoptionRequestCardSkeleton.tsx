import { Card, Skeleton, VisuallyHidden } from "@paw-match/ui";

/** Mirrors AdoptionRequestCard's real shape (thumbnail + name/badge, shelter line, tags, button row). */
export const AdoptionRequestCardSkeleton = () => (
  <Card padding="none" className="overflow-hidden" role="status" aria-live="polite">
    <VisuallyHidden>Loading adoption request</VisuallyHidden>
    <div className="flex flex-col gap-4 p-5 sm:flex-row" aria-hidden>
      <Skeleton className="h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-28" />

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-2 h-3 w-full max-w-xs" />
        <div className="mt-1">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  </Card>
);
