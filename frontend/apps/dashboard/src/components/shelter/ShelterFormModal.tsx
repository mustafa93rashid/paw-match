import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Input, Modal, Textarea } from "@paw-match/ui";
import { shelterFormSchema } from "@paw-match/validation";
import type { ShelterFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminShelter, ShelterPayload, Species } from "@paw-match/types";
import { shelterWriteHooks } from "../../lib/shelterWriteHooks";

/** Minimal shape both AdminShelter (superadmin) and ShelterEmployeeShelterDetail (shelterEmployee manager) satisfy — the only fields this form reads or writes. */
type ShelterFormSource = Pick<
  AdminShelter,
  "_id" | "name" | "email" | "phone" | "description" | "address" | "city" | "capacity" | "supportedSpecies" | "operatingHours" | "socialLinks"
>;

export interface ShelterFormModalProps {
  isOpen: boolean;
  shelter: ShelterFormSource | null;
  onClose: () => void;
  /** Called with the created/updated shelter's id on success — lets a shelterEmployee's onboarding flow know creation finished. */
  onSuccess?: () => void;
}

const speciesOptions: { label: string; value: Species }[] = [
  { label: "Dog", value: "dog" },
  { label: "Cat", value: "cat" },
  { label: "Bird", value: "bird" },
  { label: "Rabbit", value: "rabbit" },
  { label: "Fish", value: "fish" },
  { label: "Other", value: "other" },
];

const defaultValues: ShelterFormValues = {
  name: "",
  email: "",
  phone: "",
  description: "",
  address: "",
  city: "",
  capacity: 0,
  supportedSpecies: [],
  operatingHoursOpen: "",
  operatingHoursClose: "",
  facebook: "",
  instagram: "",
  website: "",
};

const toFormValues = (shelter: ShelterFormSource): ShelterFormValues => ({
  name: shelter.name,
  email: shelter.email,
  phone: shelter.phone,
  description: shelter.description ?? "",
  address: shelter.address,
  city: shelter.city,
  capacity: shelter.capacity,
  supportedSpecies: shelter.supportedSpecies,
  operatingHoursOpen: shelter.operatingHours.open ?? "",
  operatingHoursClose: shelter.operatingHours.close ?? "",
  facebook: shelter.socialLinks.facebook ?? "",
  instagram: shelter.socialLinks.instagram ?? "",
  website: shelter.socialLinks.website ?? "",
});

const toPayload = (values: ShelterFormValues): ShelterPayload => ({
  name: values.name,
  email: values.email,
  phone: values.phone,
  description: values.description || undefined,
  address: values.address,
  city: values.city,
  capacity: values.capacity,
  supportedSpecies: values.supportedSpecies,
  operatingHours: {
    open: values.operatingHoursOpen || null,
    close: values.operatingHoursClose || null,
  },
  socialLinks: {
    facebook: values.facebook || null,
    instagram: values.instagram || null,
    website: values.website || null,
  },
});

/**
 * Create + edit combined, reused by both the Super Admin Shelters page and
 * a shelterEmployee manager's My Shelter page — the underlying
 * POST/PATCH /shelters endpoints are identical regardless of caller role
 * (see shelterWrite.ts). Always resubmits the full object on edit, same
 * convention as AnimalFormModal.
 */
export const ShelterFormModal = ({ isOpen, shelter, onClose, onSuccess }: ShelterFormModalProps) => {
  const createMutation = shelterWriteHooks.useCreateShelter();
  const updateMutation = shelterWriteHooks.useUpdateShelter();
  const mutation = shelter ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ShelterFormValues>({ resolver: zodResolver(shelterFormSchema), defaultValues });

  useEffect(() => {
    if (isOpen) reset(shelter ? toFormValues(shelter) : defaultValues);
  }, [isOpen, shelter, reset]);

  const onSubmit = (values: ShelterFormValues) => {
    const payload = toPayload(values);

    if (shelter) {
      updateMutation.mutate({ id: shelter._id, payload }, { onSuccess: () => { onClose(); onSuccess?.(); } });
    } else {
      createMutation.mutate(payload, { onSuccess: () => { onClose(); onSuccess?.(); } });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shelter ? `Edit ${shelter.name}` : "Add a new shelter"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
            {shelter ? "Save changes" : "Create shelter"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        {!shelter && (
          <p className="text-sm text-slate-600">
            New shelters stay pending until a Super Admin approves them.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Shelter name" error={errors.name?.message} {...register("name")} />
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
          <Input
            label="Capacity"
            type="number"
            min={0}
            error={errors.capacity?.message}
            {...register("capacity", { valueAsNumber: true })}
          />
          <Input label="Address" error={errors.address?.message} {...register("address")} />
          <Input label="City" error={errors.city?.message} {...register("city")} />
        </div>

        <Textarea label="Description" rows={3} error={errors.description?.message} {...register("description")} />

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Supported species</h3>
          <Controller
            control={control}
            name="supportedSpecies"
            render={({ field }) => (
              <div className="mt-2 flex flex-wrap gap-2">
                {speciesOptions.map((option) => {
                  const isSelected = field.value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          isSelected
                            ? field.value.filter((value) => value !== option.value)
                            : [...field.value, option.value],
                        )
                      }
                      aria-pressed={isSelected}
                    >
                      <Badge tone={isSelected ? "brand" : "neutral"} className="cursor-pointer capitalize">
                        {option.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.supportedSpecies?.message && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.supportedSpecies.message}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Operating hours</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              label="Opens"
              placeholder="09:00"
              error={errors.operatingHoursOpen?.message}
              {...register("operatingHoursOpen")}
            />
            <Input
              label="Closes"
              placeholder="17:00"
              error={errors.operatingHoursClose?.message}
              {...register("operatingHoursClose")}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Social links</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Input label="Facebook" placeholder="https://facebook.com/…" error={errors.facebook?.message} {...register("facebook")} />
            <Input label="Instagram" placeholder="https://instagram.com/…" error={errors.instagram?.message} {...register("instagram")} />
            <Input label="Website" placeholder="https://…" error={errors.website?.message} {...register("website")} />
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
