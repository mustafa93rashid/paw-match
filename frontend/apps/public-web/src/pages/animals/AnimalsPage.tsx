import { useEffect, useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import {
  Container,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Select,
  Spinner,
} from "@paw-match/ui";
import { useDebouncedValue } from "@paw-match/hooks";
import type { Animal, Species } from "@paw-match/types";
import { useAuth } from "../../lib/auth";
import { animalHooks } from "../../lib/animalHooks";
import { AnimalCard } from "./components/AnimalCard";
import { AnimalCardSkeleton } from "./components/AnimalCardSkeleton";
import { SignInPrompt } from "../../components/SignInPrompt";

const speciesOptions: { label: string; value: Species }[] = [
  { label: "Dogs", value: "dog" },
  { label: "Cats", value: "cat" },
  { label: "Birds", value: "bird" },
  { label: "Rabbits", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const sizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

type SortOption = "newest" | "name-asc" | "age-asc" | "age-desc";

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Newest first", value: "newest" },
  { label: "Name (A–Z)", value: "name-asc" },
  { label: "Youngest first", value: "age-asc" },
  { label: "Oldest first", value: "age-desc" },
];

const PAGE_SIZE = 9;

/** Normalizes age to months so "years" and "months" animals sort consistently. */
const ageInMonths = (animal: Animal) =>
  animal.ageUnit === "years" ? animal.age * 12 : animal.age;

const AnimalsPage = () => {
  const auth = useAuth();
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [gender, setGender] = useState("");
  const [size, setSize] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      species: (species || undefined) as Species | undefined,
      gender: (gender || undefined) as "male" | "female" | undefined,
      size: (size || undefined) as "small" | "medium" | "large" | undefined,
    }),
    [debouncedSearch, species, gender, size],
  );

  const animalsQuery = animalHooks.useAnimals(queryParams, {
    enabled: auth.isAuthenticated,
  });

  // The result set changes whenever filters or sort change — go back to page 1.
  useEffect(() => {
    setPage(1);
  }, [queryParams, sort]);

  const sortedAnimals = useMemo(() => {
    if (!animalsQuery.data) return [];

    const list = [...animalsQuery.data];

    switch (sort) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "age-asc":
        list.sort((a, b) => ageInMonths(a) - ageInMonths(b));
        break;
      case "age-desc":
        list.sort((a, b) => ageInMonths(b) - ageInMonths(a));
        break;
      case "newest":
      default:
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }

    return list;
  }, [animalsQuery.data, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedAnimals.length / PAGE_SIZE));
  const pagedAnimals = sortedAnimals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (auth.isLoading) {
    return (
      <Container className="py-16">
        <Spinner label="Checking your session…" />
      </Container>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Container className="py-16">
        <SignInPrompt
          title="Sign in to browse animals"
          description="Animal profiles are only available to signed-in accounts. Sign in or create an account to see who's waiting for a home."
        />
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Available animals
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Browse animals from verified shelters across the network.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Input
            label="Search animals"
            hideLabel
            placeholder="Search by name, breed, or description"
            leadingIcon={<Search className="h-4 w-4" aria-hidden />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          label="Species"
          hideLabel
          placeholder="All species"
          options={speciesOptions}
          value={species}
          onChange={(event) => setSpecies(event.target.value)}
        />
        <Select
          label="Size"
          hideLabel
          placeholder="Any size"
          options={sizeOptions}
          value={size}
          onChange={(event) => setSize(event.target.value)}
        />
        <Select
          label="Gender"
          hideLabel
          placeholder="Any gender"
          options={genderOptions}
          value={gender}
          onChange={(event) => setGender(event.target.value)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-full sm:w-56">
          <Select
            label="Sort by"
            options={sortOptions}
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
          />
        </div>
      </div>

      <div className="mt-8">
        {animalsQuery.isPending && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <AnimalCardSkeleton key={index} />
            ))}
          </div>
        )}

        {animalsQuery.isError && (
          <ErrorState
            description="We couldn't load animals right now."
            onRetry={() => animalsQuery.refetch()}
          />
        )}

        {animalsQuery.isSuccess && sortedAnimals.length === 0 && (
          <EmptyState
            icon={<SearchX className="h-6 w-6" aria-hidden />}
            title="No animals match your search"
            description="Try a different species, size, or search term."
          />
        )}

        {animalsQuery.isSuccess && sortedAnimals.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pagedAnimals.map((animal) => (
                <AnimalCard key={animal._id} animal={animal} />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-10"
            />
          </>
        )}
      </div>
    </Container>
  );
};

export default AnimalsPage;
