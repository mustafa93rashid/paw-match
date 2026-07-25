import { Skeleton } from "@paw-match/ui";

export const AnimalCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <Skeleton className="h-44 w-full rounded-none" />
    <div className="flex flex-col gap-2 p-5">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-2 flex gap-2">
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  </div>
);
