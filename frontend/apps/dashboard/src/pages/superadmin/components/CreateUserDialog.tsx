import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button, Input, Modal, Select } from "@paw-match/ui";
import { createUserSchema } from "@paw-match/validation";
import type { CreateUserFormValues } from "@paw-match/validation";
import { getApiErrorMessage, getApiFieldErrors } from "@paw-match/api-client";
import type { AdminUser, CreateUserPayload } from "@paw-match/types";
import { userManagementHooks } from "../../../lib/userManagementHooks";
import { shelterEmployeeAdminHooks } from "../../../lib/shelterEmployeeAdminHooks";

export interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleOptions: { label: string; value: CreateUserFormValues["role"] }[] = [
  { label: "Shelter Employee", value: "shelterEmployee" },
  { label: "Veterinarian", value: "vet" },
  { label: "Adopter", value: "adopter" },
];

const positionOptions = [
  { label: "Manager", value: "manager" },
  { label: "Employee", value: "employee" },
];

const defaultValues: CreateUserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "adopter",
  position: "",
};

/**
 * Super Admin only. POST /user/create-user doesn't accept a `position` field
 * at all (only firstName/lastName/email/password/role — see
 * createUserByAdminValidation) — a fresh shelterEmployee profile always
 * starts as "employee" by schema default. So "Manager" selected here means a
 * *second* request after creation: PUT /shelter-employee-profile/:id/work-data.
 * "Employee" needs no second call at all, since that's already the default.
 * If that second call fails, the user still exists — this is surfaced as a
 * distinct, retryable partial-failure state, never silently dropped.
 */
export const CreateUserDialog = ({ isOpen, onClose }: CreateUserDialogProps) => {
  const createMutation = userManagementHooks.useCreateUser();
  const workDataMutation = shelterEmployeeAdminHooks.useUpdateEmployeeWorkData();

  const [createdUser, setCreatedUser] = useState<AdminUser | null>(null);
  const [positionFailure, setPositionFailure] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<CreateUserFormValues>({ resolver: zodResolver(createUserSchema), defaultValues });

  const selectedRole = watch("role");
  const isShelterEmployee = selectedRole === "shelterEmployee";

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      setCreatedUser(null);
      setPositionFailure(null);
    }
  }, [isOpen, reset]);

  // Selecting away from shelterEmployee: hide the field, clear its value and
  // any validation error, and never send it in the request.
  useEffect(() => {
    if (!isShelterEmployee) {
      setValue("position", "");
      clearErrors("position");
    }
  }, [isShelterEmployee, setValue, clearErrors]);

  const handleClose = () => {
    if (createMutation.isPending || workDataMutation.isPending) return;
    onClose();
  };

  const retryPosition = () => {
    if (!createdUser) return;
    setPositionFailure(null);
    workDataMutation.mutate(
      { userId: createdUser._id, payload: { position: "manager" } },
      {
        onSuccess: onClose,
        onError: (error) => setPositionFailure(getApiErrorMessage(error)),
      },
    );
  };

  const onSubmit = (values: CreateUserFormValues) => {
    const payload: CreateUserPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role,
    };

    createMutation.mutate(payload, {
      onSuccess: (user) => {
        if (values.role === "shelterEmployee" && values.position === "manager") {
          setCreatedUser(user);
          workDataMutation.mutate(
            { userId: user._id, payload: { position: "manager" } },
            {
              onSuccess: onClose,
              onError: (error) => setPositionFailure(getApiErrorMessage(error)),
            },
          );
        } else {
          onClose();
        }
      },
    });
  };

  const fieldErrors = getApiFieldErrors(createMutation.error);
  const isPending = createMutation.isPending || workDataMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add a new user"
      footer={
        createdUser ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={retryPosition} isLoading={workDataMutation.isPending}>
              Retry setting Manager
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} isLoading={isPending} disabled={isPending}>
              Create user
            </Button>
          </>
        )
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {createdUser && positionFailure && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p className="text-sm text-amber-800">
              {createdUser.firstName} {createdUser.lastName} was created successfully, but setting their
              position to Manager failed: {positionFailure}. They currently have Employee access. You can retry
              below, or fix this later from Change Role.
            </p>
          </div>
        )}

        <fieldset disabled={Boolean(createdUser)} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              error={errors.firstName?.message ?? fieldErrors?.firstName}
              {...register("firstName")}
            />
            <Input
              label="Last name"
              error={errors.lastName?.message ?? fieldErrors?.lastName}
              {...register("lastName")}
            />
          </div>
          <Input
            label="Email"
            type="email"
            error={errors.email?.message ?? fieldErrors?.email}
            {...register("email")}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type="password"
              error={errors.password?.message ?? fieldErrors?.password}
              {...register("password")}
            />
            <p className="text-xs text-slate-500">
              At least 8 characters, with an uppercase letter, lowercase letter, number, and symbol.
            </p>
          </div>
          <Select
            label="Role"
            options={roleOptions}
            error={errors.role?.message ?? fieldErrors?.role}
            {...register("role")}
          />

          <AnimatePresence initial={false}>
            {isShelterEmployee && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Select
                  label="Employment Position"
                  placeholder="Select a position"
                  options={positionOptions}
                  error={errors.position?.message}
                  {...register("position")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </fieldset>

        {createMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(createMutation.error)}
          </p>
        )}
      </form>
    </Modal>
  );
};
