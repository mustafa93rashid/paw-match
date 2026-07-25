import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Pagination, TableSkeleton } from "@paw-match/ui";
import { isMatchingProfileComplete } from "@paw-match/utilities";
import { adopterProfileHooks } from "../../lib/adopterProfileHooks";
import { AdoptersFilters } from "./components/AdoptersFilters";
import type { AdoptersFiltersValue } from "./components/AdoptersFilters";
import { AdoptersTable } from "./components/AdoptersTable";

const PAGE_SIZE = 10;
const ADOPTERS_TABLE_COLUMN_COUNT = 6;

const emptyFilters: AdoptersFiltersValue = {
  search: "",
  homeType: "",
  experienceLevel: "",
  ownerType: "",
  completion: "",
};

const AdoptersPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const profilesQuery = adopterProfileHooks.useAllAdopterProfiles();
  const [filters, setFilters] = useState<AdoptersFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);

  const filteredProfiles = useMemo(() => {
    const profiles = profilesQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const fullName = profile.userId
        ? `${profile.userId.firstName} ${profile.userId.lastName}`.toLowerCase()
        : "";
      const matchesSearch =
        search.length === 0 ||
        fullName.includes(search) ||
        (profile.userId?.email.toLowerCase().includes(search) ?? false);
      const matchesHomeType = filters.homeType.length === 0 || profile.homeType === filters.homeType;
      const matchesExperience =
        filters.experienceLevel.length === 0 || profile.experienceLevel === filters.experienceLevel;
      const matchesOwnerType = filters.ownerType.length === 0 || profile.ownerType === filters.ownerType;
      const matchesCompletion =
        filters.completion.length === 0 ||
        (filters.completion === "complete") === isMatchingProfileComplete(profile);

      return matchesSearch && matchesHomeType && matchesExperience && matchesOwnerType && matchesCompletion;
    });
  }, [profilesQuery.data, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredProfiles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: AdoptersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Adopters</h1>
        <p className="mt-2 max-w-xl text-slate-600">
          Browse adopter profiles platform-wide and check how complete each one is for matching.
        </p>
      </div>

      <div className="mt-6">
        <AdoptersFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {profilesQuery.isLoading && <TableSkeleton columns={ADOPTERS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {profilesQuery.isError && (
          <ErrorState title="Couldn't load adopters" onRetry={() => profilesQuery.refetch()} />
        )}

        {profilesQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No adopters match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {profilesQuery.isSuccess && pageItems.length > 0 && (
          <>
            <AdoptersTable profiles={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdoptersPage;
