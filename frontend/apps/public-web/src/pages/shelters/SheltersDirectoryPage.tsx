import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Container, EmptyState, ErrorState } from "@paw-match/ui";
import { useDebouncedValue } from "@paw-match/hooks";
import type { Species } from "@paw-match/types";
import { shelterHooks } from "../../lib/shelterHooks";
import { paths } from "../../routes/paths";
import { ShelterFilters, type ShelterFiltersValue } from "./components/ShelterFilters";
import { ShelterCard } from "./components/ShelterCard";
import { ShelterCardSkeleton } from "./components/ShelterCardSkeleton";
import { NearestSheltersPanel } from "./components/NearestSheltersPanel";

type DirectoryTab = "all" | "nearest";

const initialFilters: ShelterFiltersValue = { search: "", city: "", species: "" };

const SheltersDirectoryPage = () => {
  const [tab, setTab] = useState<DirectoryTab>("all");
  const [filters, setFilters] = useState<ShelterFiltersValue>(initialFilters);

  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const debouncedCity = useDebouncedValue(filters.city, 350);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      city: debouncedCity || undefined,
      species: (filters.species || undefined) as Species | undefined,
    }),
    [debouncedSearch, debouncedCity, filters.species],
  );

  const sheltersQuery = shelterHooks.useShelters(queryParams);

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Find a shelter
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Browse verified, approved shelters, or search by your current
          location to find the ones closest to you.
        </p>
      </div>

      <div
        className="mt-8 flex gap-2 border-b border-slate-200"
        role="tablist"
        aria-label="Shelter search mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "all"}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "all"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setTab("all")}
        >
          Browse all
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "nearest"}
          className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "nearest"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setTab("nearest")}
        >
          Near me
        </button>
      </div>

      {tab === "all" ? (
        <div className="mt-8">
          <ShelterFilters value={filters} onChange={setFilters} />

          <div className="mt-8">
            {sheltersQuery.isPending && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ShelterCardSkeleton key={index} />
                ))}
              </div>
            )}

            {sheltersQuery.isError && (
              <ErrorState
                description="We couldn't load shelters right now."
                onRetry={() => sheltersQuery.refetch()}
              />
            )}

            {sheltersQuery.isSuccess && sheltersQuery.data.length === 0 && (
              <EmptyState
                icon={<SearchX className="h-6 w-6" aria-hidden />}
                title="No shelters match your search"
                description="Try a different city, species, or search term."
              />
            )}

            {sheltersQuery.isSuccess && sheltersQuery.data.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sheltersQuery.data.map((shelter) => (
                  <ShelterCard
                    key={shelter._id}
                    shelter={shelter}
                    to={`${paths.shelters}/${shelter._id}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <NearestSheltersPanel />
      )}
    </Container>
  );
};

export default SheltersDirectoryPage;
