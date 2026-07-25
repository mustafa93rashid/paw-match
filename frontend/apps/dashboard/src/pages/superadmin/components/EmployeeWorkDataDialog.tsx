import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, Select } from "@paw-match/ui";
import { employeeWorkDataSchema } from "@paw-match/validation";
import type { EmployeeWorkDataFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { ShelterEmployeeProfileAdminEntry, UpdateEmployeeWorkDataPayload } from "@paw-match/types";
import { shelterEmployeeAdminHooks } from "../../../lib/shelterEmployeeAdminHooks";

type ProfileWithUser = ShelterEmployeeProfileAdminEntry & {
  userId: NonNullable<ShelterEmployeeProfileAdminEntry["userId"]>;
};

export interface EmployeeWorkDataDialogProps {
  profile: ProfileWithUser | null;
  onClose: () => void;
}

const positionOptions = [
  { label: "Employee", value: "employee" },
  { label: "Manager", value: "manager" },
];

/** HTML date inputs need "YYYY-MM-DD"; the backend stores a full ISO datetime. */
const toDateInputValue = (value: string | null): string => (value ? value.slice(0, 10) : "");

/**
 * Superadmin only — the single dialog for assigning/changing position and
 * editing employeeNumber/hireDate, reused for promote, demote, and plain
 * edits alike (no separate "promote" vs "edit" UI). The backend only ever
 * accepts non-empty values for employeeNumber/hireDate (no explicit "clear"
 * mechanism), so an emptied field is simply omitted from the request,
 * leaving that field unchanged server-side.
 */
export const EmployeeWorkDataDialog = ({ profile, onClose }: EmployeeWorkDataDialogProps) => {
  const mutation = shelterEmployeeAdminHooks.useUpdateEmployeeWorkData();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeWorkDataFormValues>({ resolver: zodResolver(employeeWorkDataSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        position: profile.position,
        employeeNumber: profile.employeeNumber ?? "",
        hireDate: toDateInputValue(profile.hireDate),
      });
    }
  }, [profile, reset]);

  const onSubmit = (values: EmployeeWorkDataFormValues) => {
    if (!profile) return;
    const payload: UpdateEmployeeWorkDataPayload = {
      position: values.position,
      employeeNumber: values.employeeNumber || undefined,
      hireDate: values.hireDate || undefined,
    };
    mutation.mutate({ userId: profile.userId._id, payload }, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={Boolean(profile)}
      onClose={onClose}
      title={
        profile ? `Employment details — ${profile.userId.firstName} ${profile.userId.lastName}` : "Employment details"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={mutation.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Select label="Position" options={positionOptions} error={errors.position?.message} {...register("position")} />
        <Input
          label="Employee number"
          placeholder="Optional"
          error={errors.employeeNumber?.message}
          {...register("employeeNumber")}
        />
        <Input label="Hire date" type="date" error={errors.hireDate?.message} {...register("hireDate")} />
        {mutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
