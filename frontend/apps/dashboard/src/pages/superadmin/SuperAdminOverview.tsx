import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  PawPrint,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge, EmptyState, ErrorState } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { ApplicationType } from "@paw-match/types";
import { QuickLinkCard } from "../../components/dashboard/QuickLinkCard";
import { StatCard } from "../../components/dashboard/StatCard";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { shelterAdminHooks } from "../../lib/shelterAdminHooks";
import { userManagementHooks } from "../../lib/userManagementHooks";
import { animalHooks } from "../../lib/animalHooks";
import { staffApplicationHooks } from "../../lib/staffApplicationHooks";
import { paths } from "../../routes/paths";

const quickLinks = [
  {
    label: "Shelters",
    description: "Approve, verify, and manage every shelter on Paw Match.",
    to: paths.shelters,
    icon: Building2,
  },
  {
    label: "Users",
    description: "Manage accounts, roles, and account status platform-wide.",
    to: paths.users,
    icon: Users,
  },
  {
    label: "Applications",
    description: "Review pending Shelter Manager and Veterinarian applications.",
    to: paths.applications,
    icon: ClipboardCheck,
  },
];

const applicationTypeLabel: Record<ApplicationType, string> = {
  shelterManager: "Shelter Manager",
  vet: "Veterinarian",
};

const applicationTypeTone: Record<ApplicationType, BadgeTone> = {
  shelterManager: "brand",
  vet: "accent",
};

/**
 * Statistics and recent activity are all derived client-side from existing
 * admin list endpoints (shelters, users, animals, staff applications) —
 * there is no dashboard-stats aggregate endpoint on the backend, and none
 * was added here. Pending applications are fetched once, server-filtered
 * (status=pending), and reused for both the stat card and the "Latest
 * applications" list below — no duplicate request for the same data.
 */
export const SuperAdminOverview = () => {
  const sheltersQuery = shelterAdminHooks.useAdminShelters();
  const usersQuery = userManagementHooks.useAdminUsers();
  const animalsQuery = animalHooks.useAnimals({});
  const pendingApplicationsQuery = staffApplicationHooks.useStaffApplications({ status: "pending" });

  const stats = useMemo(() => {
    const shelters = sheltersQuery.data ?? [];
    const users = usersQuery.data ?? [];
    const animals = animalsQuery.data ?? [];
    const applications = pendingApplicationsQuery.data ?? [];

    return {
      totalShelters: shelters.length,
      pendingShelters: shelters.filter((shelter) => shelter.verificationStatus === "pending").length,
      activeShelters: shelters.filter((shelter) => shelter.isActive).length,
      totalUsers: users.length,
      totalAnimals: animals.length,
      availableAnimals: animals.filter((animal) => animal.adoptionStatus === "available").length,
      pendingApplications: applications.length,
    };
  }, [sheltersQuery.data, usersQuery.data, animalsQuery.data, pendingApplicationsQuery.data]);

  const hasStatsError =
    sheltersQuery.isError || usersQuery.isError || animalsQuery.isError || pendingApplicationsQuery.isError;
  const isStatsLoading =
    sheltersQuery.isLoading || usersQuery.isLoading || animalsQuery.isLoading || pendingApplicationsQuery.isLoading;

  const handleRetry = () => {
    sheltersQuery.refetch();
    usersQuery.refetch();
    animalsQuery.refetch();
    pendingApplicationsQuery.refetch();
  };

  const latestApplications = (pendingApplicationsQuery.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="mt-8 flex flex-col gap-8">
      {hasStatsError ? (
        <ErrorState title="Couldn't load Dashboard statistics" onRetry={handleRetry} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total shelters" value={isStatsLoading ? "…" : stats.totalShelters} icon={Building2} index={0} />
          <StatCard
            label="Pending shelter approval"
            value={isStatsLoading ? "…" : stats.pendingShelters}
            icon={ClipboardCheck}
            tone="accent"
            index={1}
          />
          <StatCard label="Active shelters" value={isStatsLoading ? "…" : stats.activeShelters} icon={ShieldCheck} index={2} />
          <StatCard label="Total users" value={isStatsLoading ? "…" : stats.totalUsers} icon={Users} tone="accent" index={3} />
          <StatCard label="Total animals" value={isStatsLoading ? "…" : stats.totalAnimals} icon={PawPrint} index={4} />
          <StatCard
            label="Available animals"
            value={isStatsLoading ? "…" : stats.availableAnimals}
            icon={CheckCircle2}
            tone="accent"
            index={5}
          />
          <StatCard
            label="Pending staff applications"
            value={isStatsLoading ? "…" : stats.pendingApplications}
            icon={ClipboardList}
            index={6}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Latest applications</h2>
          <Link to={paths.applications} className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4">
          {pendingApplicationsQuery.isError ? (
            <ErrorState title="Couldn't load applications" onRetry={() => pendingApplicationsQuery.refetch()} />
          ) : latestApplications.length === 0 && !pendingApplicationsQuery.isLoading ? (
            <EmptyState title="No applications pending review" description="New Shelter Manager and Veterinarian applications will appear here." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {pendingApplicationsQuery.isLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <li key={index} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
                      </li>
                    ))
                  : latestApplications.map((application) => (
                      <li key={application._id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {application.firstName} {application.lastName}
                          </p>
                          <p className="truncate text-xs text-slate-500">{application.email}</p>
                        </div>
                        <Badge tone={applicationTypeTone[application.applicationType]}>
                          {applicationTypeLabel[application.applicationType]}
                        </Badge>
                      </li>
                    ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
        <div className="mt-4">
          <RecentActivityFeed
            shelters={sheltersQuery.data}
            users={usersQuery.data}
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
    </div>
  );
};
