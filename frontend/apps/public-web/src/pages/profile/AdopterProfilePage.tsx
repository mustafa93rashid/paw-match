import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button, Container, ErrorState, Select, Spinner } from "@paw-match/ui";
import { adopterProfileSchema, type AdopterProfileFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { UpdateAdopterProfilePayload } from "@paw-match/types";
import { adopterProfileHooks } from "../../lib/adopterProfileHooks";
import { paths } from "../../routes/paths";

const homeTypeOptions = [
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Farm", value: "farm" },
];

const experienceOptions = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
];

const activityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const ownerTypeOptions = [
  { label: "Single", value: "single" },
  { label: "Family", value: "family" },
];

const yesNoOptions = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const AdopterProfilePage = () => {
  const profileQuery = adopterProfileHooks.useMyAdopterProfile();
  const updateMutation = adopterProfileHooks.useUpdateAdopterProfile();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdopterProfileFormValues>({ resolver: zodResolver(adopterProfileSchema) });

  // Pre-fill the form once the existing profile (if any) has loaded.
  useEffect(() => {
    if (profileQuery.data) {
      const profile = profileQuery.data;
      reset({
        homeType: profile.homeType ?? undefined,
        hasKids: profile.hasKids === null ? undefined : (String(profile.hasKids) as "true" | "false"),
        hasOtherPets:
          profile.hasOtherPets === null ? undefined : (String(profile.hasOtherPets) as "true" | "false"),
        experienceLevel: profile.experienceLevel ?? undefined,
        dailyActivityLevel: profile.dailyActivityLevel ?? undefined,
        isAllergic:
          profile.isAllergic === null ? undefined : (String(profile.isAllergic) as "true" | "false"),
        ownerType: profile.ownerType ?? undefined,
      });
    }
  }, [profileQuery.data, reset]);

  if (profileQuery.isPending) {
    return (
      <Container className="py-16">
        <Spinner label="Loading your profile…" />
      </Container>
    );
  }

  if (profileQuery.isError) {
    return (
      <Container className="py-16">
        <ErrorState
          description="We couldn't load your profile right now."
          onRetry={() => profileQuery.refetch()}
        />
      </Container>
    );
  }

  const isFirstTime = profileQuery.data === null;

  const onSubmit = (values: AdopterProfileFormValues) => {
    setFormError(null);

    const payload: UpdateAdopterProfilePayload = {
      homeType: values.homeType,
      hasKids: values.hasKids === "true",
      hasOtherPets: values.hasOtherPets === "true",
      experienceLevel: values.experienceLevel,
      dailyActivityLevel: values.dailyActivityLevel,
      isAllergic: values.isAllergic === "true",
      ownerType: values.ownerType,
    };

    updateMutation.mutate(payload, {
      onError: (error) => {
        setFormError(getApiErrorMessage(error, "Could not save your profile. Please try again."));
      },
    });
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {isFirstTime ? "Complete your adopter profile" : "Update your adopter profile"}
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          This information powers your match results — the more accurate it is, the better your
          matches will be.
        </p>

        {updateMutation.isSuccess && (
          <div className="mt-6 flex flex-col items-start gap-3 rounded-xl bg-accent-50 p-4 text-sm text-accent-700 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
              Your profile has been saved.
            </span>
            <Link
              to={paths.matching}
              className="inline-flex items-center gap-1 font-medium text-accent-800 hover:underline"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              See your matches
            </Link>
          </div>
        )}

        <form
          className="mt-8 grid gap-6 sm:grid-cols-2"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {formError && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2"
            >
              {formError}
            </p>
          )}

          <Select
            label="Home type"
            placeholder="Select your home type"
            options={homeTypeOptions}
            error={errors.homeType?.message}
            {...register("homeType")}
          />

          <Select
            label="Household type"
            placeholder="Select your household type"
            options={ownerTypeOptions}
            error={errors.ownerType?.message}
            {...register("ownerType")}
          />

          <Select
            label="Do you have kids at home?"
            placeholder="Select an option"
            options={yesNoOptions}
            error={errors.hasKids?.message}
            {...register("hasKids")}
          />

          <Select
            label="Do you have other pets?"
            placeholder="Select an option"
            options={yesNoOptions}
            error={errors.hasOtherPets?.message}
            {...register("hasOtherPets")}
          />

          <Select
            label="Pet ownership experience"
            placeholder="Select your experience level"
            options={experienceOptions}
            error={errors.experienceLevel?.message}
            {...register("experienceLevel")}
          />

          <Select
            label="Daily activity level"
            placeholder="Select your activity level"
            options={activityOptions}
            error={errors.dailyActivityLevel?.message}
            {...register("dailyActivityLevel")}
          />

          <Select
            label="Do you have allergies to animals?"
            placeholder="Select an option"
            options={yesNoOptions}
            error={errors.isAllergic?.message}
            {...register("isAllergic")}
          />

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full sm:w-auto" isLoading={updateMutation.isPending}>
              Save profile
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default AdopterProfilePage;
