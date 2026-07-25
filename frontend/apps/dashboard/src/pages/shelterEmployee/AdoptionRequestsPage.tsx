import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Pagination, Spinner, TableSkeleton } from "@paw-match/ui";
import type { AdoptionRequestStatus } from "@paw-match/types";
import { adoptionRequestShelterHooks } from "../../lib/adoptionRequestShelterHooks";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { AdoptionRequestsFilters } from "./components/AdoptionRequestsFilters";
import type { AdoptionRequestsFiltersValue } from "./components/AdoptionRequestsFilters";
import { AdoptionRequestsTable } from "./components/AdoptionRequestsTable";

const PAGE_SIZE = 10;
const REQUESTS_TABLE_COLUMN_COUNT = 5;

const emptyFilters: AdoptionRequestsFiltersValue = { search: "", status: "" };

const AdoptionRequestsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;

  const [filters, setFilters] = useState<AdoptionRequestsFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);

  const requestsQuery = adoptionRequestShelterHooks.useShelterAdoptionRequests(
    filters.status ? { status: filters.status as AdoptionRequestStatus } : {},
  );

  const filteredRequests = useMemo(() => {
    const requests = requestsQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    if (search.length === 0) return requests;

    return requests.filter((request) => {
      const adopterName = request.adopterId
        ? `${request.adopterId.firstName} ${request.adopterId.lastName}`.toLowerCase()
        : "";
      return (
        adopterName.includes(search) ||
        (request.adopterId?.email.toLowerCase().includes(search) ?? false) ||
        request.animalId.name.toLowerCase().includes(search)
      );
    });
  }, [requestsQuery.data, filters.search]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: AdoptionRequestsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  if (!shelterId) {
    return (
      <EmptyState
        title="You're not assigned to a shelter yet"
        description="Contact your administrator to be added to a shelter."
      />
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Adoption Requests</h1>
      <p className="mt-2 max-w-xl text-slate-600">Review, interview, and approve incoming requests.</p>

      <div className="mt-6">
        <AdoptionRequestsFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {requestsQuery.isLoading && <TableSkeleton columns={REQUESTS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {requestsQuery.isError && (
          <ErrorState title="Couldn't load adoption requests" onRetry={() => requestsQuery.refetch()} />
        )}

        {requestsQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No adoption requests match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {requestsQuery.isSuccess && pageItems.length > 0 && (
          <>
            <AdoptionRequestsTable requests={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdoptionRequestsPage;
