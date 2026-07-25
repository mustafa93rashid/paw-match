import { Container, Skeleton } from "@paw-match/ui";

export const ShelterDetailSkeleton = () => (
  <div>
    <Skeleton className="h-64 w-full rounded-none sm:h-80" />
    <Container className="relative -mt-16 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </Container>
  </div>
);
