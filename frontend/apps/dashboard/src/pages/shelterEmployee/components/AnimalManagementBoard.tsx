import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button, EmptyState, ErrorState, Pagination } from "@paw-match/ui";
import { useDebouncedValue } from "@paw-match/hooks";
import { cn } from "@paw-match/utilities";
import type { AdoptionStatus, Animal, Species } from "@paw-match/types";
import { animalHooks } from "../../../lib/animalHooks";
import { animalManagementHooks } from "../../../lib/animalManagementHooks";
import { AnimalsFilters } from "./AnimalsFilters";
import type { AnimalsFiltersValue } from "./AnimalsFilters";
import { AnimalCard } from "./AnimalCard";
import { AnimalCardSkeleton } from "./AnimalCardSkeleton";
import { AnimalFormModal } from "./AnimalFormModal";
import { AnimalImagesModal } from "./AnimalImagesModal";
import { AnimalQuickViewModal } from "./AnimalQuickViewModal";
import { DeleteAnimalDialog } from "./DeleteAnimalDialog";

const PAGE_SIZE = 9;

type StatusTab = "all" | "available" | "pending" | "adopted" | "inactive";

const statusTabs: { label: string; value: StatusTab }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Pending", value: "pending" },
  { label: "Adopted", value: "adopted" },
  { label: "Inactive", value: "inactive" },
];

const emptyFilters: AnimalsFiltersValue = {
  search: "",
  species: "",
  adoptionStatus: "",
  healthStatus: "",
  sort: "newest",
};

const sortAnimals = (animals: Animal[], sort: string): Animal[] => {
  const sorted = [...animals];
  switch (sort) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "age-asc":
      return sorted.sort((a, b) => a.age - b.age);
    case "age-desc":
      return sorted.sort((a, b) => b.age - a.age);
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

export interface AnimalManagementBoardProps {
  /** Always resolved by the caller — the Manager's own shelter, or the shelter Super Admin drilled into. Never optional here; callers handle their own "which shelter" loading/empty states first. */
  shelterId: string;
  isSuperAdmin: boolean;
  title: string;
  description: string;
  /**
   * Super Admin's shelter drill-down only. Adds the All/Available/Pending/
   * Adopted/Inactive tabs (the "Inactive" tab is only meaningful for Super
   * Admin — GET /animals forces isActive:true for every other role
   * regardless of query params) and hides AnimalsFilters' own
   * adoption-status dropdown so the same concept isn't controlled twice.
   */
  showStatusTabs?: boolean;
}

/**
 * The actual animal management UI (filters, grid, pagination, all
 * mutations) — extracted so both the Manager's own-shelter page and Super
 * Admin's per-shelter drill-down page can share one implementation instead
 * of maintaining two. shelterId is always injected by the caller and
 * applied automatically to every request; neither caller ever exposes a
 * "pick a shelter" control here.
 */
export const AnimalManagementBoard = ({
  shelterId,
  isSuperAdmin,
  title,
  description,
  showStatusTabs = false,
}: AnimalManagementBoardProps) => {
  const [filters, setFilters] = useState<AnimalsFiltersValue>(emptyFilters);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<{ open: boolean; animal: Animal | null }>({
    open: false,
    animal: null,
  });
  const [viewTarget, setViewTarget] = useState<Animal | null>(null);
  const [imagesTarget, setImagesTarget] = useState<Animal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);

  const restoreMutation = animalManagementHooks.useRestoreAnimal();

  const resolvedAdoptionStatus = showStatusTabs
    ? statusTab === "available" || statusTab === "pending" || statusTab === "adopted"
      ? (statusTab as AdoptionStatus)
      : undefined
    : ((filters.adoptionStatus || undefined) as AdoptionStatus | undefined);

  const resolvedIsActive = showStatusTabs && statusTab === "inactive" ? "false" : undefined;

  const animalsQuery = animalHooks.useAnimals(
    {
      shelterId,
      search: debouncedSearch || undefined,
      species: (filters.species || undefined) as Species | undefined,
      adoptionStatus: resolvedAdoptionStatus,
      healthStatus: filters.healthStatus || undefined,
      isActive: resolvedIsActive,
    },
    { enabled: Boolean(shelterId) },
  );

  const sortedAnimals = useMemo(
    () => sortAnimals(animalsQuery.data ?? [], filters.sort),
    [animalsQuery.data, filters.sort],
  );

  const totalPages = Math.max(1, Math.ceil(sortedAnimals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedAnimals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (value: AnimalsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const handleStatusTabChange = (tab: StatusTab) => {
    setStatusTab(tab);
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-xl text-slate-600">{description}</p>
        </div>
        <Button onClick={() => setFormTarget({ open: true, animal: null })}>
          <Plus className="h-4 w-4" aria-hidden />
          Add animal
        </Button>
      </div>

      {showStatusTabs && (
        <div className="mt-6 flex flex-wrap gap-1.5 border-b border-slate-200 pb-px">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusTabChange(tab.value)}
              className={cn(
                "-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                statusTab === tab.value
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <AnimalsFilters value={filters} onChange={handleFiltersChange} hideAdoptionStatus={showStatusTabs} />
      </div>

      <div className="mt-6">
        {animalsQuery.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <AnimalCardSkeleton key={index} />
            ))}
          </div>
        )}

        {animalsQuery.isError && <ErrorState title="Couldn't load animals" onRetry={() => animalsQuery.refetch()} />}

        {animalsQuery.isSuccess && pageItems.length === 0 && (
          <EmptyState
            title="No animals match your filters"
            description="Try a different search term or clear the filters above."
          />
        )}

        {animalsQuery.isSuccess && pageItems.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((animal, index) => (
                <AnimalCard
                  key={animal._id}
                  animal={animal}
                  index={index}
                  onView={() => setViewTarget(animal)}
                  onEdit={() => setFormTarget({ open: true, animal })}
                  onManageImages={() => setImagesTarget(animal)}
                  onDelete={() => setDeleteTarget(animal)}
                  onRestore={() => restoreMutation.mutate(animal._id)}
                />
              ))}
            </div>
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
      </div>

      <AnimalFormModal
        isOpen={formTarget.open}
        animal={formTarget.animal}
        onClose={() => setFormTarget({ open: false, animal: null })}
        contextShelterId={isSuperAdmin ? shelterId : undefined}
      />
      <AnimalQuickViewModal animal={viewTarget} onClose={() => setViewTarget(null)} />
      <AnimalImagesModal animal={imagesTarget} onClose={() => setImagesTarget(null)} />
      <DeleteAnimalDialog animal={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
};
