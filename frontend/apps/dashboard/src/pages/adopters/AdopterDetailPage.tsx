import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronRight, UserRoundX } from "lucide-react";
import { Badge, EmptyState, ErrorState, Spinner, UserAvatar } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import { isMatchingProfileComplete } from "@paw-match/utilities";
import { adopterProfileHooks } from "../../lib/adopterProfileHooks";
import { useAuth } from "../../lib/auth";
import { paths } from "../../routes/paths";

const homeTypeLabel: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  farm: "Farm",
};

const experienceLabel: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

const activityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const ownerTypeLabel: Record<string, string> = {
  single: "Single",
  family: "Family",
};

const speciesLabel: Record<string, string> = {
  dog: "Dogs",
  cat: "Cats",
  bird: "Birds",
  rabbit: "Rabbits",
  fish: "Fish",
  other: "Other",
};

const yesNoLabel = (value: boolean | null): string => (value === null ? "—" : value ? "Yes" : "No");

const completionTone: Record<"complete" | "incomplete", BadgeTone> = {
  complete: "accent",
  incomplete: "danger",
};

/**
 * Reachable from two places with different backend authorization: Super
 * Admin's Adopters list (superadmin only) and a Shelter Employee reviewing
 * a specific adoption request (superadmin + shelterEmployee, no global list
 * — see AdoptionRequestQuickViewModal). Both land on the exact same
 * GET /adopter-profile/:userId-backed page; only the breadcrumb differs.
 */
const AdopterDetailPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const profileQuery = adopterProfileHooks.useAdopterProfileByUserId(userId);

  const isSuperAdmin = auth.user?.role === "superadmin";

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading adopter…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <ErrorState title="Couldn't load this adopter" onRetry={() => profileQuery.refetch()} />;
  }

  if (!profileQuery.data) {
    return (
      <EmptyState
        icon={<UserRoundX className="h-6 w-6" aria-hidden />}
        title="No adopter profile yet"
        description="This adopter hasn't filled out their adoption profile."
      />
    );
  }

  const profile = profileQuery.data;

  // userId is null when the referenced User account no longer exists —
  // populate() resolves an unresolvable ref to null rather than erroring
  // (confirmed against real data). Nothing useful to show without it.
  if (!profile.userId) {
    return (
      <EmptyState
        icon={<UserRoundX className="h-6 w-6" aria-hidden />}
        title="Adopter account no longer exists"
        description="This adoption profile refers to a user account that has since been deleted."
      />
    );
  }

  const user = profile.userId;
  const complete = isMatchingProfileComplete(profile);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isSuperAdmin ? (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link to={paths.adopters} className="hover:text-slate-700 hover:underline">
            Adopters
          </Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
          <span className="truncate font-medium text-slate-700">
            {user.firstName} {user.lastName}
          </span>
        </nav>
      ) : (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
          Back
        </button>
      )}

      <div className="mt-4 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            profileImage={user.profileImage}
          />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <Badge tone={completionTone[complete ? "complete" : "incomplete"]}>
          {complete ? "Complete profile" : "Incomplete profile"}
        </Badge>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
        <h2 className="text-base font-semibold text-slate-900">Contact</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {user.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Phone</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{user.phone}</dd>
            </div>
          )}
          {user.address && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Address</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{user.address}</dd>
            </div>
          )}
          {user.gender && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Gender</dt>
              <dd className="mt-0.5 font-medium capitalize text-slate-700">{user.gender}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
        <h2 className="text-base font-semibold text-slate-900">Adoption profile</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Home type</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {profile.homeType ? homeTypeLabel[profile.homeType] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Household type</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {profile.ownerType ? ownerTypeLabel[profile.ownerType] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Experience level</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {profile.experienceLevel ? experienceLabel[profile.experienceLevel] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Daily activity level</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {profile.dailyActivityLevel ? activityLabel[profile.dailyActivityLevel] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Has kids at home</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{yesNoLabel(profile.hasKids)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Has other pets</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{yesNoLabel(profile.hasOtherPets)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Allergic to animals</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{yesNoLabel(profile.isAllergic)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Preferred species</dt>
            <dd className="mt-0.5 flex flex-wrap gap-1.5">
              {profile.preferredSpecies.length > 0 ? (
                profile.preferredSpecies.map((species) => (
                  <Badge key={species} tone="neutral">
                    {speciesLabel[species] ?? species}
                  </Badge>
                ))
              ) : (
                <span className="font-medium text-slate-700">—</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </motion.div>
  );
};

export default AdopterDetailPage;
