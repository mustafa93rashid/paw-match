import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { Button, Input } from "@paw-match/ui";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@paw-match/validation";
import { forgotPassword, getApiErrorMessage } from "@paw-match/api-client";
import { apiClient } from "../../lib/apiClient";
import { paths } from "../../routes/paths";
import { AuthLayout } from "./AuthLayout";

const ForgotPasswordPage = () => {
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: ForgotPasswordInput) => forgotPassword(apiClient, values),
    onSuccess: (message) => {
      setFormError(null);
      setSubmittedMessage(message);
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    },
  });

  if (submittedMessage) {
    return (
      <AuthLayout title="Check your email">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <MailCheck className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-sm text-slate-600">{submittedMessage}</p>
          <Link to={paths.login} className="text-sm font-medium text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = (values: ForgotPasswordInput) => {
    setFormError(null);
    forgotPasswordMutation.mutate(values);
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to reset your password."
      footer={
        <>
          Remembered it?{" "}
          <Link to={paths.login} className="font-medium text-brand-700 hover:underline">
            Sign in
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

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
