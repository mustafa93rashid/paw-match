import { Skeleton } from "@paw-match/ui";

/** Dashboard-specific loading placeholder, shaped like AnimalCard (same spirit as the Public Website's AnimalCardSkeleton, adapted to this card's slightly different layout). */
export const AnimalCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <Skeleton className="h-44 w-full rounded-none" />
    <div className="flex flex-col gap-2 p-5">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <div className="mt-1 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </div>
);
