import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, Select, Textarea } from "@paw-match/ui";
import { createAnimalFormSchema } from "@paw-match/validation";
import type { AnimalFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { Animal, AnimalPayload } from "@paw-match/types";
import { useAuth } from "../../../lib/auth";
import { animalManagementHooks } from "../../../lib/animalManagementHooks";
import { shelterAdminHooks } from "../../../lib/shelterAdminHooks";

export interface AnimalFormModalProps {
  isOpen: boolean;
  animal: Animal | null;
  onClose: () => void;
  /**
   * Set when this modal is opened from within a specific shelter's context
   * (Super Admin's shelter drill-down page, or reused later elsewhere) —
   * on create, shelterId is silently auto-applied from this and the
   * selector is hidden entirely, so Super Admin never has to re-pick the
   * shelter they already navigated into. Edit still shows the selector
   * (Super Admin only) so the existing shelter-transfer capability isn't
   * lost — it defaults to the animal's current shelter either way.
   */
  contextShelterId?: string;
}

const speciesOptions = [
  { label: "Dog", value: "dog" },
  { label: "Cat", value: "cat" },
  { label: "Bird", value: "bird" },
  { label: "Rabbit", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

const ageUnitOptions = [
  { label: "Months", value: "months" },
  { label: "Years", value: "years" },
];

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const sizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const healthStatusOptions = [
  { label: "Healthy", value: "healthy" },
  { label: "Needs care", value: "needsCare" },
  { label: "Special needs", value: "specialNeeds" },
  { label: "Under treatment", value: "underTreatment" },
];

const yesNoOptions = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const homeTypeOptions = [
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Farm", value: "farm" },
  { label: "Any", value: "any" },
];

const experienceLevelOptions = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
  { label: "Any", value: "any" },
];

const activityLevelOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const ownerTypeOptions = [
  { label: "Single", value: "single" },
  { label: "Family", value: "family" },
  { label: "Any", value: "any" },
];

const defaultValues: AnimalFormValues = {
  name: "",
  age: 0,
  ageUnit: "years",
  species: "dog",
  breed: "",
  gender: "male",
  size: "medium",
  color: "",
  healthStatus: "healthy",
  vaccinated: "false",
  description: "",
  homeType: "any",
  suitableForKids: "false",
  goodWithOtherPets: "false",
  experienceLevel: "any",
  dailyActivityLevel: "medium",
  ownerType: "any",
  hypoallergenic: "false",
  shelterId: "",
};

const toFormValues = (animal: Animal): AnimalFormValues => ({
  name: animal.name,
  age: animal.age,
  ageUnit: animal.ageUnit,
  species: animal.species,
  breed: animal.breed,
  gender: animal.gender,
  size: animal.size,
  color: animal.color,
  healthStatus: animal.healthStatus,
  vaccinated: animal.vaccinated ? "true" : "false",
  description: animal.description ?? "",
  homeType: animal.requirements.homeType,
  suitableForKids: animal.requirements.suitableForKids ? "true" : "false",
  goodWithOtherPets: animal.requirements.goodWithOtherPets ? "true" : "false",
  experienceLevel: animal.requirements.experienceLevel,
  dailyActivityLevel: animal.requirements.dailyActivityLevel,
  ownerType: animal.requirements.ownerType,
  hypoallergenic: animal.requirements.hypoallergenic ? "true" : "false",
  shelterId: animal.shelterId._id,
});

/**
 * shelterId is only ever included when `isSuperAdmin` — a shelterEmployee's
 * request must never carry it (the backend derives it from their own
 * profile on create, and 403s an update that includes it at all).
 */
const toPayload = (values: AnimalFormValues, isSuperAdmin: boolean): AnimalPayload => ({
  name: values.name,
  age: values.age,
  ageUnit: values.ageUnit,
  species: values.species,
  breed: values.breed,
  gender: values.gender,
  size: values.size,
  color: values.color,
  healthStatus: values.healthStatus,
  vaccinated: values.vaccinated === "true",
  description: values.description || undefined,
  requirements: {
    homeType: values.homeType,
    suitableForKids: values.suitableForKids === "true",
    goodWithOtherPets: values.goodWithOtherPets === "true",
    experienceLevel: values.experienceLevel,
    dailyActivityLevel: values.dailyActivityLevel,
    ownerType: values.ownerType,
    hypoallergenic: values.hypoallergenic === "true",
  },
  shelterId: isSuperAdmin ? values.shelterId : undefined,
});

/**
 * Covers both create and edit — the edit form always sends the full field
 * set (see AnimalPayload's doc comment), never a partial diff.
 *
 * Role-aware for the shelter selector only: a shelterEmployee manages their
 * own shelter exactly as before (no selector, no shelterId in the payload).
 * A Super Admin has no shelter of their own, so they must pick one — the
 * field is required before submit and, on edit, doubles as the backend's
 * shelter-transfer mechanism (PATCH /animals/:id with a new shelterId).
 */
export const AnimalFormModal = ({ isOpen, animal, onClose, contextShelterId }: AnimalFormModalProps) => {
  const auth = useAuth();
  const isSuperAdmin = auth.user?.role === "superadmin";
  const isCreatingWithContext = !animal && Boolean(contextShelterId);
  const showShelterSelector = isSuperAdmin && !isCreatingWithContext;

  const createMutation = animalManagementHooks.useCreateAnimal();
  const updateMutation = animalManagementHooks.useUpdateAnimal();
  const mutation = animal ? updateMutation : createMutation;

  const sheltersQuery = shelterAdminHooks.useAdminShelters({}, { enabled: showShelterSelector });

  // Only shelters the backend would actually accept (isShelterAvailable:
  // approved + verified + active) — plus the animal's current shelter when
  // editing, even if it no longer qualifies, so its name doesn't silently
  // disappear from the dropdown's initial value.
  const shelterOptions = useMemo(() => {
    const available = (sheltersQuery.data ?? [])
      .filter((shelter) => shelter.verificationStatus === "approved" && shelter.isVerified && shelter.isActive)
      .map((shelter) => ({ label: shelter.name, value: shelter._id }));

    if (animal && !available.some((option) => option.value === animal.shelterId._id)) {
      available.unshift({ label: `${animal.shelterId.name} (current)`, value: animal.shelterId._id });
    }

    return available;
  }, [sheltersQuery.data, animal]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnimalFormValues>({
    resolver: zodResolver(createAnimalFormSchema(isSuperAdmin)),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(animal ? toFormValues(animal) : { ...defaultValues, shelterId: contextShelterId ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, animal, contextShelterId, reset]);

  const onSubmit = (values: AnimalFormValues) => {
    const payload = toPayload(values, isSuperAdmin);

    if (animal) {
      updateMutation.mutate({ id: animal._id, payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={animal ? `Edit ${animal.name}` : "Add a new animal"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
            {animal ? "Save changes" : "Add animal"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        {!animal && (
          <p className="text-sm text-slate-600">
            New animals stay unavailable for adoption until you add at least one photo.
          </p>
        )}

        {showShelterSelector && (
          <div className="flex flex-col gap-1.5">
            <Select
              label="Shelter"
              placeholder={sheltersQuery.isLoading ? "Loading shelters…" : "Select a shelter"}
              options={shelterOptions}
              disabled={sheltersQuery.isLoading}
              error={errors.shelterId?.message}
              {...register("shelterId")}
            />
            {sheltersQuery.isError && (
              <p role="alert" className="text-sm text-red-600">
                Couldn't load the shelter list. Close and reopen this form to try again.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Breed" error={errors.breed?.message} {...register("breed")} />
          <Input
            label="Age"
            type="number"
            min={0}
            step="0.1"
            error={errors.age?.message}
            {...register("age", { valueAsNumber: true })}
          />
          <Select label="Age unit" options={ageUnitOptions} error={errors.ageUnit?.message} {...register("ageUnit")} />
          <Select label="Species" options={speciesOptions} error={errors.species?.message} {...register("species")} />
          <Select label="Gender" options={genderOptions} error={errors.gender?.message} {...register("gender")} />
          <Select label="Size" options={sizeOptions} error={errors.size?.message} {...register("size")} />
          <Input label="Color" error={errors.color?.message} {...register("color")} />
          <Select
            label="Health status"
            options={healthStatusOptions}
            error={errors.healthStatus?.message}
            {...register("healthStatus")}
          />
          <Select
            label="Vaccinated"
            options={yesNoOptions}
            error={errors.vaccinated?.message}
            {...register("vaccinated")}
          />
        </div>

        <Textarea label="Description" rows={3} error={errors.description?.message} {...register("description")} />

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Adoption requirements</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Select
              label="Home type"
              options={homeTypeOptions}
              error={errors.homeType?.message}
              {...register("homeType")}
            />
            <Select
              label="Owner type"
              options={ownerTypeOptions}
              error={errors.ownerType?.message}
              {...register("ownerType")}
            />
            <Select
              label="Experience level"
              options={experienceLevelOptions}
              error={errors.experienceLevel?.message}
              {...register("experienceLevel")}
            />
            <Select
              label="Daily activity level"
              options={activityLevelOptions}
              error={errors.dailyActivityLevel?.message}
              {...register("dailyActivityLevel")}
            />
            <Select
              label="Suitable for kids"
              options={yesNoOptions}
              error={errors.suitableForKids?.message}
              {...register("suitableForKids")}
            />
            <Select
              label="Good with other pets"
              options={yesNoOptions}
              error={errors.goodWithOtherPets?.message}
              {...register("goodWithOtherPets")}
            />
            <Select
              label="Hypoallergenic"
              options={yesNoOptions}
              error={errors.hypoallergenic?.message}
              {...register("hypoallergenic")}
            />
          </div>
        </div>

        {mutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
