import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  ErrorState,
  ImageUploader,
  Input,
  Spinner,
  Textarea,
  UserAvatar,
} from "@paw-match/ui";
import { getApiErrorMessage } from "@paw-match/api-client";
import { getAverageRating } from "@paw-match/utilities";
import { vetProfileFormSchema } from "@paw-match/validation";
import type { VetProfileFormValues } from "@paw-match/validation";
import type { UpdateVetProfilePayload, VetProfile } from "@paw-match/types";
import { useAuth } from "../../lib/auth";
import { vetProfileSelfHooks } from "../../lib/vetProfileSelfHooks";
import { userAccountHooks } from "../../lib/userAccountHooks";

const weekDays: { label: string; value: VetProfileFormValues["availableDays"][number] }[] = [
  { label: "Sun", value: "sunday" },
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
];

const consultationTypeOptions: { label: string; value: VetProfileFormValues["consultationTypes"][number] }[] = [
  { label: "Vet consultation", value: "vetConsultation" },
  { label: "Behavior training", value: "behaviorTraining" },
];

const toFormValues = (profile: VetProfile): VetProfileFormValues => ({
  specialization: profile.specialization ?? "",
  bio: profile.bio ?? "",
  experienceYears: profile.experienceYears,
  availableDays: profile.availableDays,
  consultationTypes: profile.consultationTypes,
});

const toPayload = (values: VetProfileFormValues): UpdateVetProfilePayload => ({
  specialization: values.specialization || undefined,
  bio: values.bio || undefined,
  experienceYears: values.experienceYears,
  availableDays: values.availableDays,
  consultationTypes: values.consultationTypes,
});

/**
 * Identity display (name/photo) deliberately uses `auth.user`, never
 * `profile.userId` — the VetProfile type's `userId` populate is nullable in
 * practice (confirmed against real seed data) whereas `auth.user` is always
 * the reliably-present authenticated session's own data. Only vet-specific
 * fields (specialization/bio/etc., shelterId, reviews) come from the
 * VetProfile response.
 */
const MyProfilePage = () => {
  const auth = useAuth();
  const profileQuery = vetProfileSelfHooks.useMyVetProfile();
  const updateMutation = vetProfileSelfHooks.useUpdateMyVetProfile();

  const [stagedPhoto, setStagedPhoto] = useState<File[]>([]);
  const [isConfirmingPhotoDelete, setIsConfirmingPhotoDelete] = useState(false);
  const uploadPhotoMutation = userAccountHooks.useUploadProfileImage();
  const replacePhotoMutation = userAccountHooks.useReplaceProfileImage();
  const deletePhotoMutation = userAccountHooks.useDeleteProfileImage();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<VetProfileFormValues>({ resolver: zodResolver(vetProfileFormSchema) });

  useEffect(() => {
    if (profileQuery.data) reset(toFormValues(profileQuery.data));
  }, [profileQuery.data, reset]);

  const availableDays = watch("availableDays") ?? [];
  const consultationTypes = watch("consultationTypes") ?? [];

  const toggleDay = (day: VetProfileFormValues["availableDays"][number]) => {
    setValue(
      "availableDays",
      availableDays.includes(day) ? availableDays.filter((existing) => existing !== day) : [...availableDays, day],
      { shouldDirty: true },
    );
  };

  const toggleConsultationType = (type: VetProfileFormValues["consultationTypes"][number]) => {
    setValue(
      "consultationTypes",
      consultationTypes.includes(type)
        ? consultationTypes.filter((existing) => existing !== type)
        : [...consultationTypes, type],
      { shouldDirty: true },
    );
  };

  const onSubmit = (values: VetProfileFormValues) => {
    updateMutation.mutate(toPayload(values));
  };

  const hasExistingPhoto = Boolean(auth.user?.profileImage);
  const isPhotoMutating =
    uploadPhotoMutation.isPending || replacePhotoMutation.isPending || deletePhotoMutation.isPending;
  const photoError = uploadPhotoMutation.error ?? replacePhotoMutation.error ?? deletePhotoMutation.error;

  const handlePhotoSave = () => {
    const file = stagedPhoto[0];
    if (!file) return;
    const mutation = hasExistingPhoto ? replacePhotoMutation : uploadPhotoMutation;
    mutation.mutate(file, {
      onSuccess: (updatedUser) => {
        auth.updateUser(updatedUser);
        setStagedPhoto([]);
      },
    });
  };

  const handlePhotoDelete = () => {
    deletePhotoMutation.mutate(undefined, {
      onSuccess: (updatedUser) => {
        auth.updateUser(updatedUser);
        setIsConfirmingPhotoDelete(false);
      },
    });
  };

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading your profile…" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  const profile = profileQuery.data;
  const averageRating = getAverageRating(profile.reviews);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My Profile</h1>
      <p className="mt-2 max-w-xl text-slate-600">Keep your specialization, bio, and availability current.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <form
            className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Specialization" error={errors.specialization?.message} {...register("specialization")} />
              <Input
                label="Experience (years)"
                type="number"
                min={0}
                max={80}
                error={errors.experienceYears?.message}
                {...register("experienceYears", { valueAsNumber: true })}
              />
            </div>

            <Textarea label="Bio" rows={4} error={errors.bio?.message} {...register("bio")} />

            <div>
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

            <div>
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

            {updateMutation.isError && (
              <p role="alert" className="text-sm text-red-600">
                {getApiErrorMessage(updateMutation.error)}
              </p>
            )}
            {updateMutation.isSuccess && !isDirty && (
              <p role="status" className="text-sm text-accent-700">
                Profile updated.
              </p>
            )}

            <Button type="submit" className="self-start" isLoading={updateMutation.isPending} disabled={!isDirty}>
              Save changes
            </Button>
          </form>

          {profile.shelterId && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Affiliated shelter</h2>
              <p className="mt-2 text-sm text-slate-600">
                {profile.shelterId.name}, {profile.shelterId.city}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
              {averageRating !== undefined && (
                <Badge tone="brand">
                  {averageRating.toFixed(1)} / 5 ({profile.reviews.length})
                </Badge>
              )}
            </div>
            {profile.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {profile.reviews.map((review) => (
                  <li key={review._id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-900">{review.rating} / 5</p>
                    {review.comment && <p className="mt-1 text-sm text-slate-600">{review.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile photo</h2>
          <div className="mt-4 flex items-center gap-4">
            <UserAvatar
              firstName={auth.user?.firstName}
              lastName={auth.user?.lastName}
              profileImage={auth.user?.profileImage}
              size="md"
            />
          </div>

          <div className="mt-4">
            <ImageUploader
              label="Choose photo"
              files={stagedPhoto}
              onFilesChange={setStagedPhoto}
              disabled={isPhotoMutating}
              hint="JPEG, PNG, GIF, or WebP. Max 5MB."
            />
          </div>

          {stagedPhoto.length > 0 && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" isLoading={isPhotoMutating} onClick={handlePhotoSave}>
                {hasExistingPhoto ? "Replace photo" : "Upload photo"}
              </Button>
              <Button size="sm" variant="secondary" disabled={isPhotoMutating} onClick={() => setStagedPhoto([])}>
                Cancel
              </Button>
            </div>
          )}

          {hasExistingPhoto && stagedPhoto.length === 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              {!isConfirmingPhotoDelete ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPhotoMutating}
                  onClick={() => setIsConfirmingPhotoDelete(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete photo
                </Button>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
                    <p className="text-sm text-red-700">Delete your profile photo?</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPhotoMutating}
                      onClick={() => setIsConfirmingPhotoDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      isLoading={deletePhotoMutation.isPending}
                      onClick={handlePhotoDelete}
                    >
                      Confirm delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {photoError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {getApiErrorMessage(photoError)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
