import { useMemo } from "react";
import { Building2, CheckCircle2, ClipboardList, PawPrint, ShieldAlert } from "lucide-react";
import { EmptyState, ErrorState, ReviewsSection, Spinner } from "@paw-match/ui";
import { StatCard } from "../../components/dashboard/StatCard";
import { QuickLinkCard } from "../../components/dashboard/QuickLinkCard";
import { RecentRecordsFeed } from "./components/RecentRecordsFeed";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";
import { animalHooks } from "../../lib/animalHooks";
import { adoptionRequestShelterHooks } from "../../lib/adoptionRequestShelterHooks";
import { reviewHooks } from "../../lib/reviewHooks";
import { paths } from "../../routes/paths";

const NEEDS_REVIEW_STATUSES = ["pendingReview", "interview", "homeCheck"] as const;

const quickLinks = [
  {
    label: "My Shelter",
    description: "View your shelter's profile and team.",
    to: paths.myShelter,
    icon: Building2,
  },
  {
    label: "Animals",
    description: "List new animals and keep profiles up to date.",
    to: paths.animals,
    icon: PawPrint,
  },
  {
    label: "Adoption Requests",
    description: "Review, interview, and approve incoming requests.",
    to: paths.adoptionRequests,
    icon: ClipboardList,
  },
];

/** Statistics and recent records are both derived client-side from the shelter's own animals/adoption-requests lists — there is no dashboard-stats or activity-log endpoint on the backend. */
export const ShelterEmployeeOverview = () => {
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;

  const shelterQuery = shelterEmployeeShelterHooks.useMyShelterDetail(shelterId);
  const animalsQuery = animalHooks.useAnimals({ shelterId }, { enabled: Boolean(shelterId) });
  const requestsQuery = adoptionRequestShelterHooks.useShelterAdoptionRequests();
  const reviewsQuery = reviewHooks.useTargetReviews("shelter", shelterId);

  const stats = useMemo(() => {
    const animals = animalsQuery.data ?? [];
    const requests = requestsQuery.data ?? [];

    return {
      totalAnimals: animals.length,
      availableAnimals: animals.filter((animal) => animal.adoptionStatus === "available").length,
      totalRequests: requests.length,
      needsReview: requests.filter((request) =>
        (NEEDS_REVIEW_STATUSES as readonly string[]).includes(request.status),
      ).length,
    };
  }, [animalsQuery.data, requestsQuery.data]);

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading your shelter overview…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="mt-8">
        <ErrorState title="Couldn't load your shelter profile" onRetry={() => profileQuery.refetch()} />
      </div>
    );
  }

  if (!shelterId) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" aria-hidden />}
          title="You're not assigned to a shelter yet"
          description="Contact your administrator to be added to a shelter."
        />
      </div>
    );
  }

  const hasStatsError = shelterQuery.isError || animalsQuery.isError || requestsQuery.isError;
  const isStatsLoading = shelterQuery.isLoading || animalsQuery.isLoading || requestsQuery.isLoading;

  const handleRetry = () => {
    shelterQuery.refetch();
    animalsQuery.refetch();
    requestsQuery.refetch();
  };

  return (
    <div className="mt-8 flex flex-col gap-8">
      {shelterQuery.data && (
        <div className="rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
          <p className="text-sm text-slate-500">Your shelter</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{shelterQuery.data.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{shelterQuery.data.city}</p>
        </div>
      )}

      {hasStatsError ? (
        <ErrorState title="Couldn't load shelter statistics" onRetry={handleRetry} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total animals" value={isStatsLoading ? "…" : stats.totalAnimals} icon={PawPrint} index={0} />
          <StatCard
            label="Available"
            value={isStatsLoading ? "…" : stats.availableAnimals}
            icon={CheckCircle2}
            tone="accent"
            index={1}
          />
          <StatCard label="Total requests" value={isStatsLoading ? "…" : stats.totalRequests} icon={ClipboardList} index={2} />
          <StatCard
            label="Needs review"
            value={isStatsLoading ? "…" : stats.needsReview}
            icon={ClipboardList}
            tone="accent"
            index={3}
          />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent records</h2>
        <div className="mt-4">
          <RecentRecordsFeed
            animals={animalsQuery.data}
            requests={requestsQuery.data}
            isLoading={isStatsLoading}
            isError={hasStatsError}
            onRetry={handleRetry}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, index) => (
            <QuickLinkCard key={link.to} {...link} index={index} />
          ))}
        </div>
      </div>

      {reviewsQuery.isSuccess && (
        <ReviewsSection
          reviews={reviewsQuery.data.slice(0, 3)}
          emptyMessage="No reviews yet."
          replyLabel="Shelter reply"
        />
      )}
    </div>
  );
};
