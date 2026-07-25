import { Container, Skeleton } from "@paw-match/ui";

export const VeterinarianDetailSkeleton = () => (
  <Container className="py-12 sm:py-16">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-6 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  </Container>
);
