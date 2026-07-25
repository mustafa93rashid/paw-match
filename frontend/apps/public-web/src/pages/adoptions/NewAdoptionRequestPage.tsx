import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ClipboardCheck, PawPrint, UserCog } from "lucide-react";
import { Button, Container, EmptyState, ErrorState, Spinner, Textarea } from "@paw-match/ui";
import {
  createAdoptionRequestSchema,
  type CreateAdoptionRequestFormValues,
} from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import { isAdoptionRequestProfileComplete } from "@paw-match/utilities";
import { animalHooks } from "../../lib/animalHooks";
import { adopterProfileHooks } from "../../lib/adopterProfileHooks";
import { adoptionRequestHooks } from "../../lib/adoptionRequestHooks";
import { paths } from "../../routes/paths";

const NewAdoptionRequestPage = () => {
  const { animalId } = useParams<{ animalId: string }>();
  const navigate = useNavigate();
  const animalQuery = animalHooks.useAnimal(animalId);
  const profileQuery = adopterProfileHooks.useMyAdopterProfile();
  const createMutation = adoptionRequestHooks.useCreateAdoptionRequest();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdoptionRequestFormValues>({
    resolver: zodResolver(createAdoptionRequestSchema),
  });

  if (animalQuery.isPending || profileQuery.isPending) {
    return (
      <Container className="py-16">
        <Spinner label="Loading…" />
      </Container>
    );
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

  if (profileQuery.isError) {
    return (
      <Container className="py-16">
        <ErrorState
          description="We couldn't load your adopter profile right now."
          onRetry={() => profileQuery.refetch()}
        />
      </Container>
    );
  }

  const animal = animalQuery.data;

  if (!animal.isActive || animal.adoptionStatus !== "available") {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
          title="This animal isn't available for adoption right now"
          description="It may have already been adopted, placed on hold, or removed by the shelter."
          action={
            <Link
              to={paths.animalDetail(animal._id)}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Back to {animal.name}'s profile
            </Link>
          }
        />
      </Container>
    );
  }

  // Proactive check mirroring the backend's own isProfileCompleted predicate —
  // guides the adopter to fix this before they fill out the form, rather
  // than only reacting to the backend's 400 after submission.
  if (!isAdoptionRequestProfileComplete(profileQuery.data)) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<UserCog className="h-6 w-6" aria-hidden />}
          title="Complete your adopter profile first"
          description="Shelters need your home environment, experience, and lifestyle information before reviewing adoption requests."
          action={
            <Link
              to={paths.adopterProfile}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Complete your profile
            </Link>
          }
        />
      </Container>
    );
  }

  const primaryImage = animal.images.find((image) => image.isPrimary) ?? animal.images[0];

  const onSubmit = (values: CreateAdoptionRequestFormValues) => {
    setFormError(null);

    createMutation.mutate(
      { animalId: animal._id, message: values.message || undefined },
      {
        onSuccess: () => {
          navigate(paths.adoptionRequests, { state: { justRequested: true } });
        },
        onError: (error) => {
          setFormError(
            getApiErrorMessage(error, "Could not submit your adoption request. Please try again."),
          );
        },
      },
    );
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Request to adopt {animal.name}
        </h1>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-600">
            {primaryImage ? (
              <img src={primaryImage.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <PawPrint className="h-6 w-6" aria-hidden />
            )}
          </span>
          <div>
            <p className="font-semibold text-slate-900">{animal.name}</p>
            <p className="text-sm text-slate-600">
              {animal.breed} · {animal.shelterId.name}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <p>
            Submitting this form creates an adoption <strong>request</strong>{" "}
            for the shelter to review — it does not immediately approve or
            complete an adoption. The shelter will move your request through
            review, an interview, and a home check before making a decision.
          </p>
        </div>

        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <Textarea
            label="Message to the shelter (optional)"
            placeholder="Share why you'd be a good fit for this animal, or anything the shelter should know."
            error={errors.message?.message}
            {...register("message")}
          />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              Submit request
            </Button>
            <Link
              to={paths.animalDetail(animal._id)}
              className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default NewAdoptionRequestPage;
