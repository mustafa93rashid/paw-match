import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Container, Input } from "@paw-match/ui";
import { verifyApplicationSchema, type VerifyApplicationInput } from "@paw-match/validation";
import { getApiErrorMessage, resendVerificationCode, verifyStaffApplication } from "@paw-match/api-client";
import type { SubmitStaffApplicationResult } from "@paw-match/types";
import { apiClient } from "../../lib/apiClient";
import { paths } from "../../routes/paths";

/**
 * Shared by both application types — the backend endpoint (POST
 * /staff-applications/verify) and the "application" concept itself don't
 * distinguish shelterManager vs vet at this step. "Resend code" calls the
 * dedicated POST /staff-applications/resend-verification endpoint — only
 * the email needs to be carried in router state now, not the whole
 * submitted payload (the backend already has it on file).
 */
const ApplicationVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SubmitStaffApplicationResult | null;

  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VerifyApplicationInput>({ resolver: zodResolver(verifyApplicationSchema) });

  const verifyMutation = useMutation({
    mutationFn: (values: VerifyApplicationInput) =>
      verifyStaffApplication(apiClient, {
        email: state!.email,
        verificationCode: values.verificationCode,
      }),
    onSuccess: () => {
      navigate(paths.home, {
        replace: true,
        state: { applicationSubmitted: true },
      });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, "Invalid verification code"));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerificationCode(apiClient, { email: state!.email }),
    onSuccess: () => {
      setFormError(null);
      setResendMessage("A new verification code has been sent to your email.");
      reset();
    },
    onError: (error) => {
      setResendMessage(null);
      setFormError(getApiErrorMessage(error, "Could not send a new code. Please try again."));
    },
  });

  if (!state?.email) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Verification session expired
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            We couldn&apos;t find an in-progress application. Please start over.
          </p>
          <Link
            to={paths.home}
            className="mt-6 inline-block font-medium text-brand-700 hover:underline"
          >
            Back to home
          </Link>
        </div>
      </Container>
    );
  }

  const onSubmit = (values: VerifyApplicationInput) => {
    setFormError(null);
    verifyMutation.mutate(values);
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the 6-digit code we sent to {state.email}. It expires in 10 minutes.
        </p>

        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          {resendMessage && (
            <p role="status" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
              {resendMessage}
            </p>
          )}

          <Input
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            error={errors.verificationCode?.message}
            {...register("verificationCode")}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Verify email
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            isLoading={resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
          >
            Resend verification code
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Only the most recently sent code works — requesting a new one invalidates any earlier code.
        </p>

        <p className="mt-6 text-center text-sm text-slate-600">
          Wrong email?{" "}
          <Link to={paths.home} className="font-medium text-brand-700 hover:underline">
            Start over
          </Link>
        </p>
      </div>
    </Container>
  );
};

export default ApplicationVerifyPage;
