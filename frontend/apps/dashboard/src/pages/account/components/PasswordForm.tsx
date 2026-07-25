import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@paw-match/ui";
import { changePasswordSchema, type ChangePasswordFormValues } from "@paw-match/validation";
import { getApiErrorMessage } from "@paw-match/api-client";
import { useAuth } from "../../../lib/auth";
import { userAccountHooks } from "../../../lib/userAccountHooks";
import { paths } from "../../../routes/paths";

export const PasswordForm = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const changePasswordMutation = userAccountHooks.useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = (values: ChangePasswordFormValues) => {
    setFormError(null);

    changePasswordMutation.mutate(values, {
      onSuccess: () => {
        reset();
        // The backend clears auth cookies on a successful password change —
        // reflect that immediately rather than leaving the UI showing a
        // signed-in state that no longer has a valid session.
        auth.clearSession();
        navigate(paths.login, { replace: true, state: { justPasswordChanged: true } });
      },
      onError: (error) => {
        setFormError(getApiErrorMessage(error, "Could not change your password. Please try again."));
      },
    });
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        {...register("confirmNewPassword")}
      />

      <p className="text-xs text-slate-500">
        You'll be signed out and asked to sign in again after changing your password.
      </p>

      <Button type="submit" className="self-start" isLoading={isSubmitting}>
        Change password
      </Button>
    </form>
  );
};
