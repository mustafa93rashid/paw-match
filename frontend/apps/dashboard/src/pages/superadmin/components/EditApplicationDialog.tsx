import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Input, Modal, Textarea } from "@paw-match/ui";
import {
  editShelterManagerApplicationSchema,
  editVetApplicationSchema,
  type EditShelterManagerApplicationFormValues,
  type EditVetApplicationFormValues,
} from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Species, StaffApplication, UpdateStaffApplicationPayload } from "@paw-match/types";
import { staffApplicationHooks } from "../../../lib/staffApplicationHooks";

export interface EditApplicationDialogProps {
  application: StaffApplication | null;
  onClose: () => void;
}

const speciesOptions: { label: string; value: Species }[] = [
  { label: "Dog", value: "dog" },
  { label: "Cat", value: "cat" },
  { label: "Bird", value: "bird" },
  { label: "Rabbit", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

const weekDays: { label: string; value: string }[] = [
  { label: "Sun", value: "sunday" },
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
];

const consultationTypeOptions: { label: string; value: string }[] = [
  { label: "Vet consultation", value: "vetConsultation" },
  { label: "Behavior training", value: "behaviorTraining" },
];

const toShelterFormValues = (application: StaffApplication): EditShelterManagerApplicationFormValues => ({
  phone: application.phone,
  address: application.address,
  shelterData: {
    name: application.shelterData?.name ?? "",
    email: application.shelterData?.email ?? "",
    phone: application.shelterData?.phone ?? "",
    description: application.shelterData?.description ?? "",
    address: application.shelterData?.address ?? "",
    city: application.shelterData?.city ?? "",
    supportedSpecies: application.shelterData?.supportedSpecies ?? [],
    capacity: application.shelterData?.capacity ?? 0,
    operatingHours: {
      open: application.shelterData?.operatingHours?.open ?? "",
      close: application.shelterData?.operatingHours?.close ?? "",
    },
    socialLinks: {
      facebook: application.shelterData?.socialLinks?.facebook ?? "",
      instagram: application.shelterData?.socialLinks?.instagram ?? "",
      website: application.shelterData?.socialLinks?.website ?? "",
    },
  },
});

const toVetFormValues = (application: StaffApplication): EditVetApplicationFormValues => ({
  phone: application.phone,
  address: application.address,
  vetData: {
    specialization: application.vetData?.specialization ?? "",
    bio: application.vetData?.bio ?? "",
    experienceYears: application.vetData?.experienceYears ?? 0,
    availableDays: application.vetData?.availableDays ?? [],
    consultationTypes: application.vetData?.consultationTypes ?? [],
  },
});

const toShelterPayload = (values: EditShelterManagerApplicationFormValues): UpdateStaffApplicationPayload => ({
  phone: values.phone,
  address: values.address,
  shelterData: {
    ...values.shelterData,
    description: values.shelterData.description || undefined,
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

const toVetPayload = (values: EditVetApplicationFormValues): UpdateStaffApplicationPayload => ({
  phone: values.phone,
  address: values.address,
  vetData: {
    ...values.vetData,
    specialization: values.vetData.specialization || undefined,
    bio: values.vetData.bio || undefined,
  },
});

/**
 * Business-information-only edit, "pending" applications only (the backend
 * 409s otherwise — enforced there, not just hidden here). Never touches
 * firstName/lastName/email/dateOfBirth/gender/applicationType — none of
 * those are in UpdateStaffApplicationPayload at all.
 */
export const EditApplicationDialog = ({ application, onClose }: EditApplicationDialogProps) => {
  const updateMutation = staffApplicationHooks.useUpdateStaffApplication();
  const isVet = application?.applicationType === "vet";

  const shelterForm = useForm<EditShelterManagerApplicationFormValues>({
    resolver: zodResolver(editShelterManagerApplicationSchema),
  });
  const vetForm = useForm<EditVetApplicationFormValues>({
    resolver: zodResolver(editVetApplicationSchema),
  });

  useEffect(() => {
    if (!application) return;

    if (application.applicationType === "vet") {
      vetForm.reset(toVetFormValues(application));
    } else {
      shelterForm.reset(toShelterFormValues(application));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application]);

  const availableDays = vetForm.watch("vetData.availableDays") ?? [];
  const consultationTypes = vetForm.watch("vetData.consultationTypes") ?? [];
  const supportedSpecies = shelterForm.watch("shelterData.supportedSpecies") ?? [];

  const toggleDay = (day: string) => {
    vetForm.setValue(
      "vetData.availableDays",
      (availableDays.includes(day as never)
        ? availableDays.filter((d) => d !== day)
        : [...availableDays, day]) as EditVetApplicationFormValues["vetData"]["availableDays"],
      { shouldDirty: true },
    );
  };

  const toggleConsultationType = (type: string) => {
    vetForm.setValue(
      "vetData.consultationTypes",
      (consultationTypes.includes(type as never)
        ? consultationTypes.filter((t) => t !== type)
        : [...consultationTypes, type]) as EditVetApplicationFormValues["vetData"]["consultationTypes"],
      { shouldDirty: true },
    );
  };

  const toggleSpecies = (species: Species) => {
    shelterForm.setValue(
      "shelterData.supportedSpecies",
      supportedSpecies.includes(species)
        ? supportedSpecies.filter((value) => value !== species)
        : [...supportedSpecies, species],
      { shouldDirty: true },
    );
  };

  const onSubmitShelter = (values: EditShelterManagerApplicationFormValues) => {
    if (!application) return;
    updateMutation.mutate({ id: application._id, payload: toShelterPayload(values) }, { onSuccess: onClose });
  };

  const onSubmitVet = (values: EditVetApplicationFormValues) => {
    if (!application) return;
    updateMutation.mutate({ id: application._id, payload: toVetPayload(values) }, { onSuccess: onClose });
  };

  const handleSave = isVet ? vetForm.handleSubmit(onSubmitVet) : shelterForm.handleSubmit(onSubmitShelter);

  return (
    <Modal
      isOpen={Boolean(application)}
      onClose={onClose}
      title={application ? `Edit ${application.firstName} ${application.lastName}'s application` : "Edit application"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={updateMutation.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Badge tone="neutral">Only pending applications can be edited</Badge>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Applicant</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              error={isVet ? vetForm.formState.errors.phone?.message : shelterForm.formState.errors.phone?.message}
              {...(isVet ? vetForm.register("phone") : shelterForm.register("phone"))}
            />
            <Input
              label="Address"
              error={
                isVet ? vetForm.formState.errors.address?.message : shelterForm.formState.errors.address?.message
              }
              {...(isVet ? vetForm.register("address") : shelterForm.register("address"))}
            />
          </div>
        </div>

        {!isVet && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Shelter information</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Input
                label="Shelter name"
                error={shelterForm.formState.errors.shelterData?.name?.message}
                {...shelterForm.register("shelterData.name")}
              />
              <Input
                label="Shelter email"
                type="email"
                error={shelterForm.formState.errors.shelterData?.email?.message}
                {...shelterForm.register("shelterData.email")}
              />
              <Input
                label="Shelter phone"
                error={shelterForm.formState.errors.shelterData?.phone?.message}
                {...shelterForm.register("shelterData.phone")}
              />
              <Input
                label="City"
                error={shelterForm.formState.errors.shelterData?.city?.message}
                {...shelterForm.register("shelterData.city")}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Shelter address"
                  error={shelterForm.formState.errors.shelterData?.address?.message}
                  {...shelterForm.register("shelterData.address")}
                />
              </div>
              <Input
                label="Capacity"
                type="number"
                min={0}
                error={shelterForm.formState.errors.shelterData?.capacity?.message}
                {...shelterForm.register("shelterData.capacity", { valueAsNumber: true })}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Shelter description"
                rows={3}
                error={shelterForm.formState.errors.shelterData?.description?.message}
                {...shelterForm.register("shelterData.description")}
              />
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Supported species</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {speciesOptions.map((option) => {
                  const isSelected = supportedSpecies.includes(option.value);
                  return (
                    <button key={option.value} type="button" onClick={() => toggleSpecies(option.value)} aria-pressed={isSelected}>
                      <Badge tone={isSelected ? "brand" : "neutral"} className="cursor-pointer capitalize">
                        {option.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Opening time"
                placeholder="09:00"
                error={shelterForm.formState.errors.shelterData?.operatingHours?.open?.message}
                {...shelterForm.register("shelterData.operatingHours.open")}
              />
              <Input
                label="Closing time"
                placeholder="17:00"
                error={shelterForm.formState.errors.shelterData?.operatingHours?.close?.message}
                {...shelterForm.register("shelterData.operatingHours.close")}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input label="Facebook" {...shelterForm.register("shelterData.socialLinks.facebook")} />
              <Input label="Instagram" {...shelterForm.register("shelterData.socialLinks.instagram")} />
              <Input label="Website" {...shelterForm.register("shelterData.socialLinks.website")} />
            </div>
          </div>
        )}

        {isVet && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Professional information</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Input
                label="Specialization"
                error={vetForm.formState.errors.vetData?.specialization?.message}
                {...vetForm.register("vetData.specialization")}
              />
              <Input
                label="Years of experience"
                type="number"
                min={0}
                error={vetForm.formState.errors.vetData?.experienceYears?.message}
                {...vetForm.register("vetData.experienceYears", { valueAsNumber: true })}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Bio"
                rows={3}
                error={vetForm.formState.errors.vetData?.bio?.message}
                {...vetForm.register("vetData.bio")}
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
                      availableDays.includes(day.value as never)
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
                      consultationTypes.includes(type.value as never)
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {updateMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(updateMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
};
