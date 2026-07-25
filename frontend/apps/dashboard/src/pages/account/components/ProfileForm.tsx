import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select } from "@paw-match/ui";
import { updateProfileSchema, type UpdateProfileFormValues } from "@paw-match/validation";
import { getApiErrorMessage, getApiFieldErrors } from "@paw-match/api-client";
import type { AuthUser, UpdateProfilePayload } from "@paw-match/types";
import { useAuth } from "../../../lib/auth";
import { userAccountHooks } from "../../../lib/userAccountHooks";

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const toDefaultValues = (profile: AuthUser): UpdateProfileFormValues => ({
  firstName: profile.firstName,
  lastName: profile.lastName,
  dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
  gender: profile.gender ?? "",
  phone: profile.phone ?? "",
  address: profile.address ?? "",
});

export interface ProfileFormProps {
  profile: AuthUser;
}

export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const auth = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [backendFieldErrors, setBackendFieldErrors] = useState<Record<string, string>>({});

  const updateProfileMutation = userAccountHooks.useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting, isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: toDefaultValues(profile),
  });

  // Re-baseline dirty-tracking whenever the server's copy changes (e.g.
  // after this same mutation succeeds and the profile query refetches).
  useEffect(() => {
    reset(toDefaultValues(profile));
  }, [profile, reset]);

  const onSubmit = (values: UpdateProfileFormValues) => {
    setFormError(null);
    setSuccessMessage(null);
    setBackendFieldErrors({});

    // Only send fields the user actually changed — never unchanged or
    // unsupported fields.
    const payload: UpdateProfilePayload = {};
    if (dirtyFields.firstName) payload.firstName = values.firstName || undefined;
    if (dirtyFields.lastName) payload.lastName = values.lastName || undefined;
    if (dirtyFields.dateOfBirth) payload.dateOfBirth = values.dateOfBirth || undefined;
    if (dirtyFields.gender) payload.gender = values.gender || undefined;
    if (dirtyFields.phone) payload.phone = values.phone || undefined;
    if (dirtyFields.address) payload.address = values.address || undefined;

    if (Object.keys(payload).length === 0) {
      return;
    }

    updateProfileMutation.mutate(payload, {
      onSuccess: (updatedUser) => {
        auth.updateUser(updatedUser);
        setSuccessMessage("Your profile has been updated.");
      },
      onError: (error) => {
        setFormError(getApiErrorMessage(error, "Could not update your profile. Please try again."));
        setBackendFieldErrors(getApiFieldErrors(error) ?? {});
      },
    });
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      {successMessage && (
        <p role="status" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {successMessage}
        </p>
      )}

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="First name"
          error={errors.firstName?.message ?? backendFieldErrors.firstName}
          {...register("firstName")}
        />
        <Input
          label="Last name"
          error={errors.lastName?.message ?? backendFieldErrors.lastName}
          {...register("lastName")}
        />
        <Input
          label="Date of birth"
          type="date"
          error={errors.dateOfBirth?.message ?? backendFieldErrors.dateOfBirth}
          {...register("dateOfBirth")}
        />
        <Select
          label="Gender"
          placeholder="Prefer not to say"
          options={genderOptions}
          error={errors.gender?.message ?? backendFieldErrors.gender}
          {...register("gender")}
        />
        <Input
          label="Phone"
          type="tel"
          error={errors.phone?.message ?? backendFieldErrors.phone}
          {...register("phone")}
        />
        <Input
          label="Address"
          error={errors.address?.message ?? backendFieldErrors.address}
          {...register("address")}
        />
      </div>

      <Button type="submit" className="self-start" isLoading={isSubmitting} disabled={!isDirty}>
        Save changes
      </Button>
    </form>
  );
};
