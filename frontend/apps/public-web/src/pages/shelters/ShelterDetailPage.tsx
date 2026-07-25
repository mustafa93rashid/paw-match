import { useParams } from "react-router-dom";
import {
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  PawPrint,
  Phone,
} from "lucide-react";
import { Badge, Container, EmptyState, ErrorState, ReviewsSection } from "@paw-match/ui";
import { useAuth } from "../../lib/auth";
import { shelterHooks } from "../../lib/shelterHooks";
import { ShelterDetailSkeleton } from "./components/ShelterDetailSkeleton";
import { ShelterAnimalsSection } from "./components/ShelterAnimalsSection";

const ShelterDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const auth = useAuth();

  // Only one of these two queries is ever enabled at a time, so only one
  // network call fires depending on session state.
  const publicQuery = shelterHooks.useShelterDetail(auth.isAuthenticated ? undefined : id);
  const authedQuery = shelterHooks.useShelterDetailAuthed(auth.isAuthenticated ? id : undefined);

  const activeQuery = auth.isAuthenticated ? authedQuery : publicQuery;

  if (auth.isLoading || activeQuery.isPending) {
    return <ShelterDetailSkeleton />;
  }

  if (activeQuery.isError) {
    return (
      <Container className="py-16">
        <ErrorState
          description="We couldn't load this shelter right now."
          onRetry={() => activeQuery.refetch()}
        />
      </Container>
    );
  }

  const shelter = activeQuery.data;

  if (!shelter) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<PawPrint className="h-6 w-6" aria-hidden />}
          title="Shelter not found"
          description="This shelter may not be public yet, or the link is out of date."
        />
      </Container>
    );
  }

  const hasSocialLinks =
    shelter.socialLinks.website ||
    shelter.socialLinks.facebook ||
    shelter.socialLinks.instagram;

  // Only present on the authenticated (richer) response shape.
  const richDetail = auth.isAuthenticated ? authedQuery.data : undefined;

  return (
    <article>
      <div className="relative h-64 w-full overflow-hidden bg-slate-100 sm:h-80">
        {shelter.images[0] ? (
          <img
            src={shelter.images[0].url}
            alt=""
            className="h-full w-full object-cover"
          />
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {shelter.name}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {shelter.address}, {shelter.city}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {shelter.supportedSpecies.map((species) => (
                <Badge key={species} tone="brand" className="capitalize">
                  {species}
                </Badge>
              ))}
            </div>
          </div>

          {shelter.description && (
            <p className="mt-6 max-w-2xl leading-relaxed text-slate-600">
              {shelter.description}
            </p>
          )}

          <dl className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Phone className="h-4 w-4" aria-hidden /> Phone
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{shelter.phone}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Mail className="h-4 w-4" aria-hidden /> Email
              </dt>
              <dd className="mt-1 break-all text-sm text-slate-900">
                {shelter.email}
              </dd>
            </div>
            {shelter.operatingHours.open && shelter.operatingHours.close && (
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Clock className="h-4 w-4" aria-hidden /> Hours
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {shelter.operatingHours.open} – {shelter.operatingHours.close}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-slate-500">Capacity</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {shelter.capacity} animals
              </dd>
            </div>
          </dl>

          {hasSocialLinks && (
            <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
              {shelter.socialLinks.website && (
                <a
                  href={shelter.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
                >
                  <Globe className="h-4 w-4" aria-hidden /> Website
                </a>
              )}
              {shelter.socialLinks.facebook && (
                <a
                  href={shelter.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden /> Facebook
                </a>
              )}
              {shelter.socialLinks.instagram && (
                <a
                  href={shelter.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden /> Instagram
                </a>
              )}
            </div>
          )}

          {richDetail ? (
            <>
              <ShelterAnimalsSection animals={richDetail.animalIds} />
              <ReviewsSection
                reviews={richDetail.reviews}
                emptyMessage="No reviews yet for this shelter."
                replyLabel="Shelter reply"
              />
            </>
          ) : (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Sign in to see this shelter&apos;s available animals and adopter
              reviews.
            </div>
          )}
        </div>
      </Container>
    </article>
  );
};

export default ShelterDetailPage;
