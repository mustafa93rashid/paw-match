import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CalendarClock, User } from "lucide-react";
import { Button, Container, EmptyState, ErrorState, Spinner, Textarea } from "@paw-match/ui";
import {
  requestVetAppointmentSchema,
  type RequestVetAppointmentFormValues,
} from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import { vetProfileHooks } from "../../lib/vetProfileHooks";
import { vetAppointmentHooks } from "../../lib/vetAppointmentHooks";
import { paths } from "../../routes/paths";

const dayLabels: Record<string, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

const RequestVetAppointmentPage = () => {
  const { vetId } = useParams<{ vetId: string }>();
  const navigate = useNavigate();
  const vetQuery = vetProfileHooks.useVet(vetId);
  const requestMutation = vetAppointmentHooks.useRequestVetAppointment();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestVetAppointmentFormValues>({
    resolver: zodResolver(requestVetAppointmentSchema),
  });

  if (vetQuery.isPending) {
    return (
      <Container className="py-16">
        <Spinner label="Loading veterinarian…" />
      </Container>
    );
  }

  if (vetQuery.isError) {
    const status = (vetQuery.error as { response?: { status?: number } })?.response?.status;

    if (status === 404) {
      return (
        <Container className="py-16">
          <EmptyState
            icon={<User className="h-6 w-6" aria-hidden />}
            title="Veterinarian not found"
            description="This profile may no longer be available."
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

  // Orphaned VetProfile.userId reference — nothing valid to request against.
  if (!vet.userId) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
          title="This veterinarian's profile is unavailable"
          description="The account linked to this profile could not be found, so a request can't be submitted."
        />
      </Container>
    );
  }

  const vetUserId = vet.userId._id;

  const onSubmit = (values: RequestVetAppointmentFormValues) => {
    setFormError(null);

    requestMutation.mutate(
      { vetId: vetUserId, requestMessage: values.requestMessage || undefined },
      {
        onSuccess: () => {
          navigate(paths.vetAppointments, { state: { justRequested: true } });
        },
        onError: (error) => {
          setFormError(
            getApiErrorMessage(error, "Could not submit your appointment request. Please try again."),
          );
        },
      },
    );
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Request an appointment
        </h1>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-600">
            {vet.userId.profileImage ? (
              <img
                src={vet.userId.profileImage.url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-6 w-6" aria-hidden />
            )}
          </span>
          <div>
            <p className="font-semibold text-slate-900">
              Dr. {vet.userId.firstName} {vet.userId.lastName}
            </p>
            <p className="text-sm text-slate-600">{vet.specialization ?? "General practice"}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <p>
            This submits a request only — it does not book a specific date or
            time.{" "}
            {vet.availableDays.length > 0
              ? `Dr. ${vet.userId.lastName} generally works on ${vet.availableDays
                  .map((day) => dayLabels[day] ?? day)
                  .join(", ")}.`
              : "The veterinarian hasn't listed general working days yet."}{" "}
            The veterinarian will review your request and schedule an exact
            time, or let you know if it can't be accommodated.
          </p>
        </div>

        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <Textarea
            label="Message to the veterinarian (optional)"
            placeholder="Describe the reason for your visit, your animal's symptoms, or anything the vet should know."
            error={errors.requestMessage?.message}
            {...register("requestMessage")}
          />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={isSubmitting}>
              Submit request
            </Button>
            <Link
              to={paths.veterinarianDetail(vet.userId._id)}
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

export default RequestVetAppointmentPage;
