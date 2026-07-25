import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Heart,
  MapPin,
  PawPrint,
  Phone,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge, Container, EmptyState, ErrorState, Spinner } from "@paw-match/ui";
import { useAuth } from "../../lib/auth";
import { animalHooks } from "../../lib/animalHooks";
import { paths } from "../../routes/paths";
import { SignInPrompt } from "../../components/SignInPrompt";
import { AnimalDetailSkeleton } from "./components/AnimalDetailSkeleton";

const adoptionStatusTone: Record<string, "brand" | "accent" | "neutral"> = {
  available: "accent",
  pending: "brand",
  adopted: "neutral",
  unavailable: "neutral",
};

const homeTypeLabels: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  farm: "Farm",
  any: "Any home type",
};

const experienceLabels: Record<string, string> = {
  beginner: "Beginner-friendly",
  intermediate: "Some experience helpful",
  expert: "Experienced owners only",
  any: "Any experience level",
};

const activityLabels: Record<string, string> = {
  low: "Low activity",
  medium: "Medium activity",
  high: "High activity",
};

const ownerTypeLabels: Record<string, string> = {
  single: "Single owners",
  family: "Families",
  any: "Any household",
};

const RequirementRow = ({ met, label }: { met: boolean; label: string }) => (
  <li className="flex items-center gap-2 text-sm text-slate-600">
    {met ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-500" aria-hidden />
    ) : (
      <XCircle className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
    )}
    {label}
  </li>
);

const AnimalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const auth = useAuth();
  const animalQuery = animalHooks.useAnimal(id, { enabled: auth.isAuthenticated });

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
          title="Sign in to view this animal"
          description="Animal profiles are only available to signed-in accounts."
        />
      </Container>
    );
  }

  if (animalQuery.isPending) {
    return <AnimalDetailSkeleton />;
  }

  if (animalQuery.isError) {
    const status = (animalQuery.error as { response?: { status?: number } })?.response?.status;

    if (status === 404) {
      return (
        <Container className="py-16">
          <EmptyState
            icon={<PawPrint className="h-6 w-6" aria-hidden />}
            title="Animal not found"
            description="This animal may no longer be available, or the link is out of date."
          />
        </Container>
      );
    }

    return (
      <Container className="py-16">
        <ErrorState
          description="We couldn't load this animal right now."
          onRetry={() => animalQuery.refetch()}
        />
      </Container>
    );
  }

  const animal = animalQuery.data;
  const primaryImage = animal.images.find((image) => image.isPrimary) ?? animal.images[0];
  const otherImages = animal.images.filter((image) => image !== primaryImage);

  return (
    <article>
      <div className="relative h-64 w-full overflow-hidden bg-slate-100 sm:h-80">
        {primaryImage ? (
          <img src={primaryImage.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <PawPrint className="h-16 w-16" aria-hidden />
          </div>
        )}
      </div>

      <Container className="relative -mt-16 pb-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {animal.name}
                </h1>
                <Badge tone={adoptionStatusTone[animal.adoptionStatus]} className="capitalize">
                  {animal.adoptionStatus}
                </Badge>
              </div>
              <p className="mt-1 text-slate-600">
                {animal.breed} · {animal.age} {animal.ageUnit} · {animal.gender}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {animal.vaccinated && (
                <Badge tone="accent">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Vaccinated
                </Badge>
              )}
              {animal.isActive && animal.adoptionStatus === "available" && (
                <Link
                  to={paths.newAdoptionRequest(animal._id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  Request to adopt
                </Link>
              )}
            </div>
          </div>

          {animal.isActive && animal.adoptionStatus === "available" && (
            <p className="mt-3 text-xs text-slate-500">
              Requesting to adopt submits your interest for the shelter to
              review — it doesn't reserve or approve the adoption
              immediately.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="neutral" className="capitalize">
              {animal.species}
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.size}
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.color}
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.healthStatus}
            </Badge>
          </div>

          {animal.description && (
            <p className="mt-6 max-w-2xl leading-relaxed text-slate-600">
              {animal.description}
            </p>
          )}

          {otherImages.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {otherImages.map((image) => (
                <div
                  key={image._id}
                  className="aspect-square overflow-hidden rounded-lg bg-slate-100"
                >
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 grid gap-8 border-t border-slate-200 pt-6 sm:grid-cols-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Heart className="h-5 w-5 text-brand-600" aria-hidden />
                Best suited for
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="neutral">
                  {homeTypeLabels[animal.requirements.homeType] ?? animal.requirements.homeType}
                </Badge>
                <Badge tone="neutral">
                  {experienceLabels[animal.requirements.experienceLevel] ??
                    animal.requirements.experienceLevel}
                </Badge>
                <Badge tone="neutral">
                  {activityLabels[animal.requirements.dailyActivityLevel] ??
                    animal.requirements.dailyActivityLevel}
                </Badge>
                <Badge tone="neutral">
                  {ownerTypeLabels[animal.requirements.ownerType] ?? animal.requirements.ownerType}
                </Badge>
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                <RequirementRow met={animal.requirements.suitableForKids} label="Good with kids" />
                <RequirementRow
                  met={animal.requirements.goodWithOtherPets}
                  label="Good with other pets"
                />
                <RequirementRow met={animal.requirements.hypoallergenic} label="Hypoallergenic" />
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">Shelter</h2>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                <Link
                  to={`${paths.shelters}/${animal.shelterId._id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {animal.shelterId.name}
                </Link>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {animal.shelterId.address}, {animal.shelterId.city}
                </p>
                {animal.shelterId.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    {animal.shelterId.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </article>
  );
};

export default AnimalDetailPage;
