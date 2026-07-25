import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Badge, Button, Container, Input, Select, Textarea } from "@paw-match/ui";
import {
  shelterManagerApplicationSchema,
  type ShelterManagerApplicationFormValues,
} from "@paw-match/validation";
import { getApiErrorMessage, submitStaffApplication } from "@paw-match/api-client";
import type { Species, SubmitStaffApplicationPayload } from "@paw-match/types";
import { apiClient } from "../../lib/apiClient";
import { paths } from "../../routes/paths";

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const speciesOptions: { label: string; value: Species }[] = [
  { label: "Dog", value: "dog" },
  { label: "Cat", value: "cat" },
  { label: "Bird", value: "bird" },
  { label: "Rabbit", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

const defaultValues: ShelterManagerApplicationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  gender: "",
  shelterData: {
    name: "",
    email: "",
    phone: "",
    description: "",
    address: "",
    city: "",
    supportedSpecies: [],
    capacity: 0,
    operatingHours: { open: "", close: "" },
    socialLinks: { facebook: "", instagram: "", website: "" },
  },
};

const toPayload = (values: ShelterManagerApplicationFormValues): SubmitStaffApplicationPayload => ({
  firstName: values.firstName,
  lastName: values.lastName,
  email: values.email,
  phone: values.phone,
  address: values.address,
  dateOfBirth: values.dateOfBirth || undefined,
  gender: values.gender || undefined,
  applicationType: "shelterManager",
  shelterData: {
    name: values.shelterData.name,
    email: values.shelterData.email,
    phone: values.shelterData.phone,
    description: values.shelterData.description || undefined,
    address: values.shelterData.address,
    city: values.shelterData.city,
    supportedSpecies: values.shelterData.supportedSpecies,
    capacity: values.shelterData.capacity,
    operatingHours: {
      open: values.shelterData.operatingHours.open || undefined,
      close: values.shelterData.operatingHours.close || undefined,
    },
    socialLinks: {
      facebook: values.shelterData.socialLinks.facebook || undefined,
      instagram: values.shelterData.socialLinks.instagram || undefined,
      website: values.shelterData.socialLinks.website || undefined,
    },
  },
});

/**
 * Applying always requests the Manager position — there is no way for a
 * public applicant to request "employee" (see ShelterManagerApplicationSchema
 * and the backend's staffApplication.validate.js, neither of which accept a
 * position field at all). Approval creates User.role "shelterEmployee" +
 * ShelterEmployeeProfile.position "manager" + the Shelter itself, all linked
 * together — see staffApplication.controller.js's approve().
 */
const ShelterManagerApplyPage = () => {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShelterManagerApplicationFormValues>({
    resolver: zodResolver(shelterManagerApplicationSchema),
    defaultValues,
  });

  const selectedSpecies = watch("shelterData.supportedSpecies") ?? [];

  const toggleSpecies = (species: Species) => {
    setValue(
      "shelterData.supportedSpecies",
      selectedSpecies.includes(species)
        ? selectedSpecies.filter((value) => value !== species)
        : [...selectedSpecies, species],
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

  const onSubmit = (values: ShelterManagerApplicationFormValues) => {
    setFormError(null);
    submitMutation.mutate(toPayload(values));
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Apply to create and manage a shelter
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Tell us about yourself and the shelter you'd like to run. Our team reviews every
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
            <h2 className="text-lg font-semibold text-slate-900">Shelter information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Shelter name"
                error={errors.shelterData?.name?.message}
                {...register("shelterData.name")}
              />
              <Input
                label="Shelter email"
                type="email"
                error={errors.shelterData?.email?.message}
                {...register("shelterData.email")}
              />
              <Input
                label="Shelter phone"
                error={errors.shelterData?.phone?.message}
                {...register("shelterData.phone")}
              />
              <Input
                label="City"
                error={errors.shelterData?.city?.message}
                {...register("shelterData.city")}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Shelter address"
                  error={errors.shelterData?.address?.message}
                  {...register("shelterData.address")}
                />
              </div>
              <Input
                label="Capacity"
                type="number"
                min={0}
                error={errors.shelterData?.capacity?.message}
                {...register("shelterData.capacity", { valueAsNumber: true })}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Shelter description"
                rows={3}
                error={errors.shelterData?.description?.message}
                {...register("shelterData.description")}
              />
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Supported species</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {speciesOptions.map((option) => {
                  const isSelected = selectedSpecies.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleSpecies(option.value)}
                      aria-pressed={isSelected}
                    >
                      <Badge tone={isSelected ? "brand" : "neutral"} className="cursor-pointer capitalize">
                        {option.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              {errors.shelterData?.supportedSpecies?.message && (
                <p role="alert" className="mt-1.5 text-sm text-red-600">
                  {errors.shelterData.supportedSpecies.message}
                </p>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Opening time"
                placeholder="09:00"
                error={errors.shelterData?.operatingHours?.open?.message}
                {...register("shelterData.operatingHours.open")}
              />
              <Input
                label="Closing time"
                placeholder="17:00"
                error={errors.shelterData?.operatingHours?.close?.message}
                {...register("shelterData.operatingHours.close")}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input
                label="Facebook"
                placeholder="https://facebook.com/..."
                error={errors.shelterData?.socialLinks?.facebook?.message}
                {...register("shelterData.socialLinks.facebook")}
              />
              <Input
                label="Instagram"
                placeholder="https://instagram.com/..."
                error={errors.shelterData?.socialLinks?.instagram?.message}
                {...register("shelterData.socialLinks.instagram")}
              />
              <Input
                label="Website"
                placeholder="https://..."
                error={errors.shelterData?.socialLinks?.website?.message}
                {...register("shelterData.socialLinks.website")}
              />
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

export default ShelterManagerApplyPage;
