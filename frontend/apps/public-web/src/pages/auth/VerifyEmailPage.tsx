import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "@paw-match/ui";
import { verifyCodeSchema, type VerifyCodeInput } from "@paw-match/validation";
import { getApiErrorMessage, signUp, verifySignUp } from "@paw-match/api-client";
import { apiClient } from "../../lib/apiClient";
import { paths } from "../../routes/paths";
import { AuthLayout } from "./AuthLayout";

interface VerifyEmailLocationState {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as VerifyEmailLocationState | null;

  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VerifyCodeInput>({ resolver: zodResolver(verifyCodeSchema) });

  const verifyMutation = useMutation({
    mutationFn: (values: VerifyCodeInput) =>
      verifySignUp(apiClient, { email: state!.email, verificationCode: values.verificationCode }),
    onSuccess: () => {
      navigate(paths.login, {
        replace: true,
        state: { justVerified: true },
      });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, "Invalid verification code"));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () =>
      signUp(apiClient, {
        firstName: state!.firstName,
        lastName: state!.lastName,
        email: state!.email,
        password: state!.password,
      }),
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
      <AuthLayout title="Verification session expired">
        <p className="text-sm text-slate-600">
          We couldn&apos;t find an in-progress signup. Please start over.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate(paths.signup)}>
          Back to sign up
        </Button>
      </AuthLayout>
    );
  }

  const onSubmit = (values: VerifyCodeInput) => {
    setFormError(null);
    verifyMutation.mutate(values);
  };

  return (
    <AuthLayout
      title="Verify your email"
      description={`Enter the 6-digit code we sent to ${state.email}. It expires in 10 minutes.`}
      footer={
        <>
          Wrong email?{" "}
          <Link to={paths.signup} className="font-medium text-brand-700 hover:underline">
            Start over
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
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
          Send a new code
        </Button>
      </form>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
