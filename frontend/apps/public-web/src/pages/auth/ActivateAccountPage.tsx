import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "@paw-match/ui";
import {
  activateAccountSchema,
  resendByEmailSchema,
  type ActivateAccountInput,
  type ResendByEmailInput,
} from "@paw-match/validation";
import { activateAccount, getApiErrorMessage, resendActivationEmail } from "@paw-match/api-client";
import { apiClient } from "../../lib/apiClient";
import { paths } from "../../routes/paths";
import { AuthLayout } from "./AuthLayout";

/**
 * Reached from the account-activation email sent when a Super Admin
 * approves a staff application (see StaffApplication's approval flow). A
 * separate page/endpoint from ResetPasswordPage/resetPassword — same token
 * mechanism, distinct meaning (first password ever, not a change).
 */
const ActivateAccountPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [isAlreadyActivated, setIsAlreadyActivated] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivateAccountInput>({ resolver: zodResolver(activateAccountSchema) });

  const {
    register: registerResend,
    handleSubmit: handleResendSubmit,
    formState: { errors: resendErrors },
  } = useForm<ResendByEmailInput>({ resolver: zodResolver(resendByEmailSchema) });

  const activateMutation = useMutation({
    mutationFn: (values: ActivateAccountInput) => activateAccount(apiClient, token as string, values),
    onSuccess: () => {
      navigate(paths.login, { replace: true, state: { justActivated: true } });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "This activation link is invalid or has expired.");
      setFormError(message);
      setIsAlreadyActivated(message.toLowerCase().includes("already been activated"));
    },
  });

  const resendMutation = useMutation({
    mutationFn: (values: ResendByEmailInput) => resendActivationEmail(apiClient, values),
    onSuccess: () => {
      setResendMessage("If that application was approved and not yet activated, a new activation email is on its way.");
    },
    onError: (error) => {
      setResendMessage(getApiErrorMessage(error, "Could not send a new activation email. Please try again."));
    },
  });

  if (!token) {
    return (
      <AuthLayout title="Invalid activation link">
        <p className="text-sm text-slate-600">
          This account activation link is missing or malformed.
        </p>
        <Link to={paths.login} className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  const onSubmit = (values: ActivateAccountInput) => {
    setFormError(null);
    setIsAlreadyActivated(false);
    activateMutation.mutate(values);
  };

  const onResendSubmit = (values: ResendByEmailInput) => {
    setResendMessage(null);
    resendMutation.mutate(values);
  };

  return (
    <AuthLayout
      title="Activate your account"
      description="Your application was approved. Set a password to activate your account."
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>{formError}</p>
            {isAlreadyActivated && (
              <Link to={paths.login} className="mt-1 inline-block font-medium underline">
                Back to sign in
              </Link>
            )}
          </div>
        )}

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Activate account
        </Button>
      </form>

      {/* Only offered once activation has actually failed — an expired or
          already-consumed link is the expected reason to need a fresh one,
          not something shown pre-emptively. */}
      {formError && !isAlreadyActivated && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-sm font-semibold text-slate-900">Link expired or already used?</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter the email you applied with and we'll send a new activation link.
          </p>

          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start"
            onSubmit={handleResendSubmit(onResendSubmit)}
            noValidate
          >
            <div className="flex-1">
              <Input
                label="Email address"
                hideLabel
                type="email"
                placeholder="you@example.com"
                error={resendErrors.email?.message}
                {...registerResend("email")}
              />
            </div>
            <Button type="submit" variant="secondary" isLoading={resendMutation.isPending}>
              Resend activation email
            </Button>
          </form>

          {resendMessage && (
            <p role="status" className="mt-3 text-sm text-slate-600">
              {resendMessage}
            </p>
          )}
        </div>
      )}
    </AuthLayout>
  );
};

export default ActivateAccountPage;
