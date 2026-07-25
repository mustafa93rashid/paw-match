import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "@paw-match/ui";
import { resetPasswordSchema, type ResetPasswordInput } from "@paw-match/validation";
import { getApiErrorMessage, resetPassword } from "@paw-match/api-client";
import { apiClient } from "../../lib/apiClient";
import { paths } from "../../routes/paths";
import { AuthLayout } from "./AuthLayout";

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordInput) => resetPassword(apiClient, token as string, values),
    onSuccess: () => {
      navigate(paths.login, { replace: true, state: { justReset: true } });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, "This reset link is invalid or has expired."));
    },
  });

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link">
        <p className="text-sm text-slate-600">
          This password reset link is missing or malformed.
        </p>
        <Link
          to={paths.forgotPassword}
          className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  const onSubmit = (values: ResetPasswordInput) => {
    setFormError(null);
    resetPasswordMutation.mutate(values);
  };

  return (
    <AuthLayout title="Reset your password" description="Choose a new password for your account.">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>{formError}</p>
            <Link to={paths.forgotPassword} className="mt-1 inline-block font-medium underline">
              Request a new link
            </Link>
          </div>
        )}

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
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
