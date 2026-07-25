import { Link, useParams } from "react-router-dom";
import { AlertTriangle, CalendarPlus, MapPin, Stethoscope, User } from "lucide-react";
import { Badge, Container, EmptyState, ErrorState, ReviewsSection, Spinner } from "@paw-match/ui";
import { useAuth } from "../../lib/auth";
import { vetProfileHooks } from "../../lib/vetProfileHooks";
import { SignInPrompt } from "../../components/SignInPrompt";
import { paths } from "../../routes/paths";
import { VeterinarianDetailSkeleton } from "./components/VeterinarianDetailSkeleton";

const consultationLabels: Record<string, string> = {
  vetConsultation: "Vet consultation",
  behaviorTraining: "Behavior training",
};

const dayLabels: Record<string, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

const VeterinarianDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const auth = useAuth();
  const vetQuery = vetProfileHooks.useVet(userId, { enabled: auth.isAuthenticated });

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
          title="Sign in to view this veterinarian"
          description="Veterinarian profiles are only available to signed-in accounts."
        />
      </Container>
    );
  }

  if (vetQuery.isPending) {
    return <VeterinarianDetailSkeleton />;
  }

  if (vetQuery.isError) {
    const status = (vetQuery.error as { response?: { status?: number } })?.response?.status;

    if (status === 404) {
      return (
        <Container className="py-16">
          <EmptyState
            icon={<User className="h-6 w-6" aria-hidden />}
            title="Veterinarian not found"
            description="This profile may no longer be available, or the link is out of date."
          />
        </Container>
      );
    }

    return (
      <Container className="py-16">
        <ErrorState
          description="We couldn't load this veterinarian right now."
          onRetry={() => vetQuery.refetch()}
        />
      </Container>
    );
  }

  const vet = vetQuery.data;

  // The referenced User account doesn't exist (orphaned reference) — Mongoose
  // populate() returns null rather than erroring. Nothing meaningful (name,
  // contact, a valid id to request an appointment against) can be shown.
  if (!vet.userId) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
          title="This veterinarian's profile is unavailable"
          description="The account linked to this profile could not be found."
        />
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-600">
              {vet.userId.profileImage ? (
                <img
                  src={vet.userId.profileImage.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-9 w-9" aria-hidden />
              )}
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Dr. {vet.userId.firstName} {vet.userId.lastName}
              </h1>
              <p className="mt-1 text-slate-600">{vet.specialization ?? "General practice"}</p>
              {vet.shelterId ? (
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {vet.shelterId.name}, {vet.shelterId.city}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-600">Independent veterinarian</p>
              )}
            </div>
          </div>

          {auth.user?.role === "adopter" && (
            <Link
              to={paths.newVetAppointment(vet.userId._id)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Request appointment
            </Link>
          )}
        </div>

        {vet.bio && <p className="mt-6 max-w-2xl leading-relaxed text-slate-600">{vet.bio}</p>}

        <dl className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Stethoscope className="h-4 w-4" aria-hidden /> Experience
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {vet.experienceYears} {vet.experienceYears === 1 ? "year" : "years"}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">Consultation types</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {vet.consultationTypes.length > 0 ? (
                vet.consultationTypes.map((type) => (
                  <Badge key={type} tone="accent">
                    {consultationLabels[type] ?? type}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-600">Not specified</span>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">Available days</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {vet.availableDays.length > 0
                ? vet.availableDays.map((day) => dayLabels[day] ?? day).join(", ")
                : "Not specified"}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-slate-500">
          Available days are general working days only — requesting an
          appointment does not book a specific time. The veterinarian
          schedules an exact date and time after reviewing your request.
        </p>

        <ReviewsSection
          reviews={vet.reviews}
          emptyMessage="No reviews yet for this veterinarian."
          replyLabel="Veterinarian reply"
        />
      </div>
    </Container>
  );
};

export default VeterinarianDetailPage;
