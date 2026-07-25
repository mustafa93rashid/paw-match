import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button, EmptyState, ErrorState, Pagination, TableSkeleton } from "@paw-match/ui";
import { shelterAdminHooks } from "../../lib/shelterAdminHooks";
import { ShelterFormModal } from "../../components/shelter/ShelterFormModal";
import { SheltersFilters } from "./components/SheltersFilters";
import type { SheltersFiltersValue } from "./components/SheltersFilters";
import { SheltersTable } from "./components/SheltersTable";

const PAGE_SIZE = 10;
const SHELTERS_TABLE_COLUMN_COUNT = 6;

const emptyFilters: SheltersFiltersValue = { search: "", verificationStatus: "", isActive: "" };

const SheltersPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const sheltersQuery = shelterAdminHooks.useAdminShelters();
  const [filters, setFilters] = useState<SheltersFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredShelters = useMemo(() => {
    const shelters = sheltersQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    return shelters.filter((shelter) => {
      const matchesSearch =
        search.length === 0 ||
        shelter.name.toLowerCase().includes(search) ||
        shelter.email.toLowerCase().includes(search) ||
        shelter.city.toLowerCase().includes(search);

      const matchesVerification =
        filters.verificationStatus.length === 0 || shelter.verificationStatus === filters.verificationStatus;

      const matchesActive = filters.isActive.length === 0 || String(shelter.isActive) === filters.isActive;

      return matchesSearch && matchesVerification && matchesActive;
    });
  }, [sheltersQuery.data, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredShelters.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredShelters.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: SheltersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Shelters</h1>
          <p className="mt-2 max-w-xl text-slate-600">Approve, verify, and manage every shelter on Paw Match.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Add shelter
        </Button>
      </div>

      <div className="mt-6">
        <SheltersFilters value={filters} onChange={handleFiltersChange} />
      </div>

      <div className="mt-6">
        {sheltersQuery.isLoading && <TableSkeleton columns={SHELTERS_TABLE_COLUMN_COUNT} rows={PAGE_SIZE} />}

        {sheltersQuery.isError && <ErrorState title="Couldn't load shelters" onRetry={() => sheltersQuery.refetch()} />}

        {sheltersQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No shelters match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {sheltersQuery.isSuccess && pageItems.length > 0 && (
          <>
            <SheltersTable shelters={pageItems} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>

      <ShelterFormModal isOpen={isCreateOpen} shelter={null} onClose={() => setIsCreateOpen(false)} />
    </motion.div>
  );
};

export default SheltersPage;
