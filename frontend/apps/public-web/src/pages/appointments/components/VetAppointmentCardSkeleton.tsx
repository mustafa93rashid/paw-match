import { Card, Skeleton, VisuallyHidden } from "@paw-match/ui";

/** Mirrors VetAppointmentCard's real shape (name+badge row, date line, message line, button row). */
export const VetAppointmentCardSkeleton = () => (
  <Card className="flex flex-col gap-3" role="status" aria-live="polite">
    <VisuallyHidden>Loading appointment</VisuallyHidden>
    <div aria-hidden className="flex flex-wrap items-start justify-between gap-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-6 w-28 rounded-full" />
    </div>
    <Skeleton className="h-4 w-56" />
    <Skeleton className="h-4 w-full max-w-md" />
    <div aria-hidden className="pt-1">
      <Skeleton className="h-9 w-36 rounded-lg" />
    </div>
  </Card>
);
