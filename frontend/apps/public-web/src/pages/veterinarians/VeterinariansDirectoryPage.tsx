import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { Container, EmptyState, ErrorState, Input, Spinner } from "@paw-match/ui";
import { useDebouncedValue } from "@paw-match/hooks";
import { useAuth } from "../../lib/auth";
import { vetProfileHooks } from "../../lib/vetProfileHooks";
import { SignInPrompt } from "../../components/SignInPrompt";
import { VetCard } from "./components/VetCard";
import { VetCardSkeleton } from "./components/VetCardSkeleton";

const VeterinariansDirectoryPage = () => {
  const auth = useAuth();
  const [specialization, setSpecialization] = useState("");
  const debouncedSpecialization = useDebouncedValue(specialization, 350);

  const queryParams = useMemo(
    () => ({ specialization: debouncedSpecialization || undefined }),
    [debouncedSpecialization],
  );

  const vetsQuery = vetProfileHooks.useVets(queryParams, { enabled: auth.isAuthenticated });

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
          title="Sign in to browse veterinarians"
          description="Veterinarian profiles are only available to signed-in accounts."
        />
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Veterinarians
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Browse veterinarians connected to the shelter network and request a
          consultation.
        </p>
      </div>

      <div className="mt-8 max-w-md">
        <Input
          label="Search by specialization"
          hideLabel
          placeholder="Search by specialization"
          leadingIcon={<Search className="h-4 w-4" aria-hidden />}
          value={specialization}
          onChange={(event) => setSpecialization(event.target.value)}
        />
      </div>

      <div className="mt-8">
        {vetsQuery.isPending && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <VetCardSkeleton key={index} />
            ))}
          </div>
        )}

        {vetsQuery.isError && (
          <ErrorState
            description="We couldn't load veterinarians right now."
            onRetry={() => vetsQuery.refetch()}
          />
        )}

        {vetsQuery.isSuccess && vetsQuery.data.length === 0 && (
          <EmptyState
            icon={<SearchX className="h-6 w-6" aria-hidden />}
            title="No veterinarians match your search"
            description="Try a different specialization."
          />
        )}

        {vetsQuery.isSuccess && vetsQuery.data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vetsQuery.data.map((vet) => (
              <VetCard key={vet._id} vet={vet} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default VeterinariansDirectoryPage;
