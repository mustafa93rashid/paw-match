import { Skeleton } from "@paw-match/ui";

export const VetCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-start gap-4">
      <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </div>
    </div>
    <Skeleton className="mt-4 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-1/2" />
    <div className="mt-4 flex gap-2">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  </div>
);
