import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Container, Input, Select, Textarea } from "@paw-match/ui";
import { vetApplicationSchema, type VetApplicationFormValues } from "@paw-match/validation";
import { getApiErrorMessage, submitStaffApplication } from "@paw-match/api-client";
import type { SubmitStaffApplicationPayload } from "@paw-match/types";
import { apiClient } from "../../lib/apiClient";
import { paths } from "../../routes/paths";

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const weekDays: { label: string; value: VetApplicationFormValues["vetData"]["availableDays"][number] }[] = [
  { label: "Sun", value: "sunday" },
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
];

const consultationTypeOptions: {
  label: string;
  value: VetApplicationFormValues["vetData"]["consultationTypes"][number];
}[] = [
  { label: "Vet consultation", value: "vetConsultation" },
  { label: "Behavior training", value: "behaviorTraining" },
];

const defaultValues: VetApplicationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  gender: "",
  vetData: {
    specialization: "",
    bio: "",
    experienceYears: 0,
    availableDays: [],
    consultationTypes: [],
  },
};

const toPayload = (values: VetApplicationFormValues): SubmitStaffApplicationPayload => ({
  firstName: values.firstName,
  lastName: values.lastName,
  email: values.email,
  phone: values.phone,
  address: values.address,
  dateOfBirth: values.dateOfBirth || undefined,
  gender: values.gender || undefined,
  applicationType: "vet",
  vetData: {
    specialization: values.vetData.specialization || undefined,
    bio: values.vetData.bio || undefined,
    experienceYears: values.vetData.experienceYears,
    availableDays: values.vetData.availableDays,
    consultationTypes: values.vetData.consultationTypes,
  },
});

/**
 * Approval creates User.role "vet" + a corresponding VetProfile from this
 * same data — see staffApplication.controller.js's approve().
 */
const VetApplyPage = () => {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VetApplicationFormValues>({
    resolver: zodResolver(vetApplicationSchema),
    defaultValues,
  });

  const availableDays = watch("vetData.availableDays") ?? [];
  const consultationTypes = watch("vetData.consultationTypes") ?? [];

  const toggleDay = (day: VetApplicationFormValues["vetData"]["availableDays"][number]) => {
    setValue(
      "vetData.availableDays",
      availableDays.includes(day) ? availableDays.filter((existing) => existing !== day) : [...availableDays, day],
      { shouldDirty: true },
    );
  };

  const toggleConsultationType = (
    type: VetApplicationFormValues["vetData"]["consultationTypes"][number],
  ) => {
    setValue(
      "vetData.consultationTypes",
      consultationTypes.includes(type)
        ? consultationTypes.filter((existing) => existing !== type)
        : [...consultationTypes, type],
      { shouldDirty: true },
    );
  };

  const submitMutation = useMutation({
    mutationFn: (payload: SubmitStaffApplicationPayload) => submitStaffApplication(apiClient, payload),
    onSuccess: (result) => {
      navigate(paths.applyVerify, { state: result });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, "Could not submit your application. Please try again."));
    },
  });

  const onSubmit = (values: VetApplicationFormValues) => {
    setFormError(null);
    submitMutation.mutate(toPayload(values));
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Apply to join as a veterinarian
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Tell us about yourself and your professional background. Our team reviews every
          application before an account is created — you'll be notified by email once a decision
          has been made.
        </p>

        <form className="mt-8 flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Your information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="First name" error={errors.firstName?.message} {...register("firstName")} />
              <Input label="Last name" error={errors.lastName?.message} {...register("lastName")} />
              <Input
                label="Email address"
                type="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
              <Input
                label="Date of birth"
                type="date"
                error={errors.dateOfBirth?.message}
                {...register("dateOfBirth")}
              />
              <Select
                label="Gender"
                placeholder="Prefer not to say"
                options={genderOptions}
                error={errors.gender?.message}
                {...register("gender")}
              />
              <div className="sm:col-span-2">
                <Input label="Address" error={errors.address?.message} {...register("address")} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Professional information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Specialization"
                placeholder="e.g. Small animal surgery"
                error={errors.vetData?.specialization?.message}
                {...register("vetData.specialization")}
              />
              <Input
                label="Years of experience"
                type="number"
                min={0}
                error={errors.vetData?.experienceYears?.message}
                {...register("vetData.experienceYears", { valueAsNumber: true })}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Bio"
                rows={3}
                placeholder="A short professional summary shelters and adopters will see."
                error={errors.vetData?.bio?.message}
                {...register("vetData.bio")}
              />
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Available days</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      availableDays.includes(day.value)
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Consultation types</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {consultationTypeOptions.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleConsultationType(type.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      consultationTypes.includes(type.value)
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <Button type="submit" className="w-full sm:w-auto" isLoading={isSubmitting}>
            Submit application
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default VetApplyPage;
