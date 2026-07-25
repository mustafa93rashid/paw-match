import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Pagination, TableSkeleton } from "@paw-match/ui";
import { useDebouncedValue } from "@paw-match/hooks";
import type { ApplicationStatus, ApplicationType } from "@paw-match/types";
import { staffApplicationHooks } from "../../lib/staffApplicationHooks";
import { ApplicationsFilters } from "./components/ApplicationsFilters";
import type { ApplicationsFiltersValue } from "./components/ApplicationsFilters";
import { ApplicationsTable } from "./components/ApplicationsTable";

const PAGE_SIZE = 10;
const APPLICATIONS_TABLE_COLUMN_COUNT = 6;

const emptyFilters: ApplicationsFiltersValue = { search: "", applicationType: "", status: "" };

/**
 * Unlike Shelters/Users (which fetch everything and filter client-side),
 * search/applicationType/status here map to real GET /staff-applications
 * query params (see staffApplication.controller.js's getAll) — so filters
 * are sent to the backend, same convention as the Animal module's list
 * pages. Only pagination stays client-side, since the backend has none.
 */
const ApplicationsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const [filters, setFilters] = useState<ApplicationsFiltersValue>(emptyFilters);
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const [page, setPage] = useState(1);

  const applicationsQuery = staffApplicationHooks.useStaffApplications({
    search: debouncedSearch || undefined,
    applicationType: (filters.applicationType || undefined) as ApplicationType | undefined,
    status: (filters.status || undefined) as ApplicationStatus | undefined,
  });

  const applications = applicationsQuery.data ?? [];
  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = applications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: ApplicationsFiltersValue) => {
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Applications</h1>
        <p className="mt-2 max-w-xl text-slate-600">
          Review Shelter Manager and Veterinarian applications submitted from the public website.
        </p>
      </div>

      <div className="mt-6">
        <ApplicationsFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {applicationsQuery.isLoading && (
          <TableSkeleton columns={APPLICATIONS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />
        )}

        {applicationsQuery.isError && (
          <ErrorState title="Couldn't load applications" onRetry={() => applicationsQuery.refetch()} />
        )}

        {applicationsQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No applications match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {applicationsQuery.isSuccess && pageItems.length > 0 && (
          <>
            <ApplicationsTable applications={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ApplicationsPage;
