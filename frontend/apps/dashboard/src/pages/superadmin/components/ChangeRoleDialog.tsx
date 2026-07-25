import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button, Modal, Select, Spinner } from "@paw-match/ui";
import { changeRoleSchema } from "@paw-match/validation";
import type { ChangeRoleFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import type { AdminUser } from "@paw-match/types";
import { userManagementHooks } from "../../../lib/userManagementHooks";
import { shelterEmployeeAdminHooks } from "../../../lib/shelterEmployeeAdminHooks";

export interface ChangeRoleDialogProps {
  user: AdminUser | null;
  onClose: () => void;
}

const roleOptions: { label: string; value: ChangeRoleFormValues["role"] }[] = [
  { label: "Shelter Employee", value: "shelterEmployee" },
  { label: "Veterinarian", value: "vet" },
  { label: "Adopter", value: "adopter" },
];

const positionOptions = [
  { label: "Manager", value: "manager" },
  { label: "Employee", value: "employee" },
];

/**
 * Only reachable for non-superadmin rows (see UsersTable) — the backend also
 * rejects a role change on a superadmin account with a 403.
 *
 * Three distinct flows, since Manager/Employee lives on a separate
 * ShelterEmployeeProfile document, not on User.role, and PUT /user/:id/role
 * doesn't accept a position field at all:
 *
 * 1. Role changes TO shelterEmployee (from vet/adopter): PUT .../role first,
 *    then — only if "Manager" was selected — PUT .../work-data (a fresh
 *    profile already defaults to "employee", so nothing extra is needed for
 *    that choice).
 * 2. Role STAYS shelterEmployee, only the position changes: role is never
 *    touched at all — this is purely a PUT .../work-data call.
 * 3. Role changes AWAY from shelterEmployee: only PUT .../role — the backend
 *    already deletes the old ShelterEmployeeProfile and provisions a fresh
 *    profile for the new role, so no stale position data is ever sent.
 */
export const ChangeRoleDialog = ({ user, onClose }: ChangeRoleDialogProps) => {
  const roleMutation = userManagementHooks.useUpdateUserRole();
  const workDataMutation = shelterEmployeeAdminHooks.useUpdateEmployeeWorkData();
  const profilesQuery = shelterEmployeeAdminHooks.useAllShelterEmployeeProfilesAdmin();

  const [positionFailure, setPositionFailure] = useState<string | null>(null);

  const currentProfile = profilesQuery.data?.find((profile) => profile.userId?._id === user?._id);
  const currentPosition = currentProfile?.position ?? "";
  const wasShelterEmployee = user?.role === "shelterEmployee";
  const isProfileLoading = wasShelterEmployee && profilesQuery.isLoading;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<ChangeRoleFormValues>({ resolver: zodResolver(changeRoleSchema) });

  const selectedRole = watch("role");
  const isShelterEmployee = selectedRole === "shelterEmployee";

  useEffect(() => {
    if (user && user.role !== "superadmin") {
      reset({
        role: user.role,
        position: user.role === "shelterEmployee" ? currentPosition : "",
      });
      setPositionFailure(null);
    }
  }, [user, currentPosition, reset]);

  useEffect(() => {
    if (!isShelterEmployee) {
      setValue("position", "");
      clearErrors("position");
    }
  }, [isShelterEmployee, setValue, clearErrors]);

  const isPending = roleMutation.isPending || workDataMutation.isPending;

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const onSubmit = (values: ChangeRoleFormValues) => {
    if (!user) return;
    setPositionFailure(null);

    // Case 2: role unchanged, only the position moved.
    if (wasShelterEmployee && values.role === "shelterEmployee") {
      if (values.position === currentPosition) {
        onClose();
        return;
      }

      workDataMutation.mutate(
        { userId: user._id, payload: { position: values.position || "employee" } },
        {
          onSuccess: onClose,
          onError: (error) => setPositionFailure(getApiErrorMessage(error)),
        },
      );
      return;
    }

    // Case 1 or 3: the role itself is changing.
    roleMutation.mutate(
      { id: user._id, role: values.role },
      {
        onSuccess: () => {
          if (values.role === "shelterEmployee" && values.position === "manager") {
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
      },
    );
  };

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={handleClose}
      title={user ? `Change role for ${user.firstName} ${user.lastName}` : "Change role"}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isPending} disabled={isProfileLoading}>
            Save role
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {positionFailure && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p className="text-sm text-amber-800">
              The role change was saved, but updating the position failed: {positionFailure}. You can try again
              from this dialog.
            </p>
          </div>
        )}

        {isProfileLoading ? (
          <Spinner label="Loading current position…" />
        ) : (
          <>
            <Select label="Role" options={roleOptions} error={errors.role?.message} {...register("role")} />

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
          </>
        )}

        {roleMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {getApiErrorMessage(roleMutation.error)}
          </p>
        )}
      </div>
    </Modal>
  );
};
