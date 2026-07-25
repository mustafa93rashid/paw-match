import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PawPrint } from "lucide-react";
import { EmptyState, ErrorState, Pagination } from "@paw-match/ui";
import { shelterAdminHooks } from "../../lib/shelterAdminHooks";
import { animalHooks } from "../../lib/animalHooks";
import { ShelterOverviewFilters } from "./components/ShelterOverviewFilters";
import type { ShelterOverviewFiltersValue } from "./components/ShelterOverviewFilters";
import { ShelterAnimalCard } from "./components/ShelterAnimalCard";

const PAGE_SIZE = 9;
const SHELTER_CARD_SKELETON_COUNT = 6;

const emptyFilters: ShelterOverviewFiltersValue = {
  search: "",
  city: "",
  isActive: "",
  verificationStatus: "",
  sort: "name-asc",
};

const ShelterCardSkeleton = () => (
  <div className="h-[19rem] animate-pulse rounded-[28px] border border-slate-200 bg-white/70 p-5">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/3 rounded bg-slate-100" />
      </div>
    </div>
    <div className="mt-6 h-3 w-1/2 rounded bg-slate-100" />
    <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
  </div>
);

/**
 * Level 1 of Super Admin's shelter-first Animals flow (see
 * ShelterAnimalsPage for Level 2). Two requests total, regardless of how
 * many shelters exist: GET /shelters/admin/all (existing admin-shelters
 * hook, unfiltered — same one SheltersPage already uses) and a single
 * unfiltered GET /animals (existing animals hook — the backend has no
 * pagination anyway, so every other list page in this app already fetches
 * its full result set in one call). Per-shelter animal/available counts
 * are derived client-side from that one animals fetch — no per-card
 * request, no new backend endpoint.
 */
const AnimalShelterOverviewPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const sheltersQuery = shelterAdminHooks.useAdminShelters();
  const animalsQuery = animalHooks.useAnimals({});

  const [filters, setFilters] = useState<ShelterOverviewFiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);

  const animalCountsByShelter = useMemo(() => {
    const counts = new Map<string, { total: number; available: number }>();

    for (const animal of animalsQuery.data ?? []) {
      const shelterId = animal.shelterId._id;
      const existing = counts.get(shelterId) ?? { total: 0, available: 0 };
      existing.total += 1;
      if (animal.adoptionStatus === "available") existing.available += 1;
      counts.set(shelterId, existing);
    }

    return counts;
  }, [animalsQuery.data]);

  const cityOptions = useMemo(() => {
    const cities = new Set((sheltersQuery.data ?? []).map((shelter) => shelter.city));
    return Array.from(cities)
      .sort((a, b) => a.localeCompare(b))
      .map((city) => ({ label: city, value: city }));
  }, [sheltersQuery.data]);

  const filteredShelters = useMemo(() => {
    const shelters = sheltersQuery.data ?? [];
    const search = filters.search.trim().toLowerCase();

    const filtered = shelters.filter((shelter) => {
      const matchesSearch = search.length === 0 || shelter.name.toLowerCase().includes(search);
      const matchesCity = filters.city.length === 0 || shelter.city === filters.city;
      const matchesActive = filters.isActive.length === 0 || String(shelter.isActive) === filters.isActive;
      const matchesVerification =
        filters.verificationStatus.length === 0 || shelter.verificationStatus === filters.verificationStatus;

      return matchesSearch && matchesCity && matchesActive && matchesVerification;
    });

    const sorted = [...filtered];
    switch (filters.sort) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "animal-count":
        sorted.sort(
          (a, b) => (animalCountsByShelter.get(b._id)?.total ?? 0) - (animalCountsByShelter.get(a._id)?.total ?? 0),
        );
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [sheltersQuery.data, filters, animalCountsByShelter]);

  const totalPages = Math.max(1, Math.ceil(filteredShelters.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredShelters.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: ShelterOverviewFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const isLoading = sheltersQuery.isLoading || animalsQuery.isLoading;
  const isError = sheltersQuery.isError || animalsQuery.isError;

  const handleRetry = () => {
    sheltersQuery.refetch();
    animalsQuery.refetch();
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Animals</h1>
        <p className="mt-2 max-w-xl text-slate-600">
          Select a shelter to view, add, and manage its animals.
        </p>
      </div>

      <div className="mt-6">
        <ShelterOverviewFilters value={filters} onChange={handleFiltersChange} cityOptions={cityOptions} />
      </div>

      <div className="mt-6">
        {isError && <ErrorState title="Couldn't load shelters" onRetry={handleRetry} />}

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: SHELTER_CARD_SKELETON_COUNT }).map((_, index) => (
              <ShelterCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!isLoading && !isError && pageItems.length === 0 && (
          <EmptyState
            icon={<PawPrint className="h-6 w-6" aria-hidden />}
            title="No shelters match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {!isLoading && !isError && pageItems.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((shelter, index) => (
                <ShelterAnimalCard
                  key={shelter._id}
                  shelter={shelter}
                  animalCount={animalCountsByShelter.get(shelter._id)?.total ?? 0}
                  availableCount={animalCountsByShelter.get(shelter._id)?.available ?? 0}
                  index={index}
                />
              ))}
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AnimalShelterOverviewPage;
