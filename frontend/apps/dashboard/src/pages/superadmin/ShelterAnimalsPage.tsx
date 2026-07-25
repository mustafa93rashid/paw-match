import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge, EmptyState, ErrorState, Spinner } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import { shelterAdminHooks } from "../../lib/shelterAdminHooks";
import { animalHooks } from "../../lib/animalHooks";
import { AnimalManagementBoard } from "../shelterEmployee/components/AnimalManagementBoard";
import { paths } from "../../routes/paths";

const verificationTone: Record<string, BadgeTone> = {
  pending: "neutral",
  approved: "brand",
  rejected: "danger",
};

const verificationLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/**
 * Level 2 of Super Admin's shelter-first Animals flow. shelterId comes
 * from the route param and is threaded straight into AnimalManagementBoard
 * — Super Admin never re-selects the shelter after landing here (create,
 * edit, filters, everything below is already scoped). Shelters are fetched
 * via the same GET /shelters/admin/all admin-shelters hook the overview
 * grid uses (same query key, so this is very likely a cache hit — no
 * network round trip — when navigated to from that grid); the single
 * additional request here is a shelterId-scoped GET /animals for the
 * header's animal-count summary, independent of whatever filters/tabs the
 * board below is currently using.
 */
const ShelterAnimalsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const { shelterId } = useParams<{ shelterId: string }>();

  const sheltersQuery = shelterAdminHooks.useAdminShelters();
  const shelter = sheltersQuery.data?.find((item) => item._id === shelterId);

  const animalsSummaryQuery = animalHooks.useAnimals({ shelterId }, { enabled: Boolean(shelterId) });
  const animalCount = animalsSummaryQuery.data?.length;

  if (sheltersQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading shelter…" />
      </div>
    );
  }

  if (sheltersQuery.isError) {
    return <ErrorState title="Couldn't load shelter" onRetry={() => sheltersQuery.refetch()} />;
  }

  if (!shelter) {
    return (
      <EmptyState
        title="Shelter not found"
        description="This shelter may have been removed. Go back and choose another shelter."
      />
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link to={paths.animals} className="hover:text-slate-700 hover:underline">
          Animals
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
        <Link to={paths.animals} className="hover:text-slate-700 hover:underline">
          Shelters
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
        <span className="truncate font-medium text-slate-700">{shelter.name}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={paths.animals}
            aria-label="Back to shelters"
            title="Back to shelters"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </Link>

          {shelter.logo ? (
            <img src={shelter.logo.url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-semibold text-brand-700">
              {shelter.name.slice(0, 2).toUpperCase()}
            </span>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-slate-900">{shelter.name}</h1>
            <p className="truncate text-sm text-slate-500">{shelter.city}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={verificationTone[shelter.verificationStatus]}>
            {verificationLabel[shelter.verificationStatus]}
          </Badge>
          <Badge tone={shelter.isActive ? "accent" : "neutral"}>{shelter.isActive ? "Active" : "Inactive"}</Badge>
          <Badge tone="neutral">{animalCount === undefined ? "…" : animalCount} animals</Badge>
        </div>
      </div>

      <div className="mt-8">
        <AnimalManagementBoard
          shelterId={shelter._id}
          isSuperAdmin
          title="Animals"
          description={`Manage ${shelter.name}'s animal roster.`}
          showStatusTabs
        />
      </div>
    </motion.div>
  );
};

export default ShelterAnimalsPage;
