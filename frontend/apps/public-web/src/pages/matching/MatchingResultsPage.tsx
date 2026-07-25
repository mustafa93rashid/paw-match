import { Link } from "react-router-dom";
import { Sparkles, UserCog } from "lucide-react";
import { Container, EmptyState, ErrorState } from "@paw-match/ui";
import { getMissingAdopterProfileFields, isAdopterProfileMissing } from "@paw-match/api-client";
import { matchingHooks } from "../../lib/matchingHooks";
import { paths } from "../../routes/paths";
import { AnimalCardSkeleton } from "../animals/components/AnimalCardSkeleton";
import { MatchedAnimalCard } from "./components/MatchedAnimalCard";

const fieldLabels: Record<string, string> = {
  homeType: "Home type",
  hasKids: "Whether you have kids",
  hasOtherPets: "Whether you have other pets",
  experienceLevel: "Experience level",
  dailyActivityLevel: "Daily activity level",
  isAllergic: "Allergy information",
  ownerType: "Household type",
};

const MatchingResultsPage = () => {
  // This route is already wrapped in RequireRole(["adopter"]), so by the
  // time this renders, auth has resolved and the user is a confirmed adopter.
  const matchedQuery = matchingHooks.useMatchedAnimals();

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Your matches
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Animals ranked by how well they fit your adopter profile.
        </p>
      </div>

      <div className="mt-8">
        {matchedQuery.isPending && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <AnimalCardSkeleton key={index} />
            ))}
          </div>
        )}

        {matchedQuery.isError && isAdopterProfileMissing(matchedQuery.error) && (
          <EmptyState
            icon={<UserCog className="h-6 w-6" aria-hidden />}
            title="Complete your adopter profile to see matches"
            description="We use your home environment, experience, and lifestyle to rank animals by compatibility."
            action={
              <Link
                to={paths.adopterProfile}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Complete your profile
              </Link>
            }
          />
        )}

        {matchedQuery.isError &&
          !isAdopterProfileMissing(matchedQuery.error) &&
          getMissingAdopterProfileFields(matchedQuery.error) && (
            <EmptyState
              icon={<UserCog className="h-6 w-6" aria-hidden />}
              title="A few more details are needed"
              description={`Please complete: ${
                getMissingAdopterProfileFields(matchedQuery.error)
                  ?.map((field) => fieldLabels[field] ?? field)
                  .join(", ") ?? ""
              }.`}
              action={
                <Link
                  to={paths.adopterProfile}
                  className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Finish your profile
                </Link>
              }
            />
          )}

        {matchedQuery.isError &&
          !isAdopterProfileMissing(matchedQuery.error) &&
          !getMissingAdopterProfileFields(matchedQuery.error) && (
            <ErrorState
              description="We couldn't load your matches right now."
              onRetry={() => matchedQuery.refetch()}
            />
          )}

        {matchedQuery.isSuccess && matchedQuery.data.length === 0 && (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" aria-hidden />}
            title="No animals available for matching right now"
            description="Every available animal from an approved shelter is included here, regardless of score — check back soon as new animals are added."
          />
        )}

        {matchedQuery.isSuccess && matchedQuery.data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matchedQuery.data.map((animal) => (
              <MatchedAnimalCard key={animal._id} animal={animal} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default MatchingResultsPage;
