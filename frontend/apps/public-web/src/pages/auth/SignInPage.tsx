import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "@paw-match/ui";
import { signInSchema, type SignInInput } from "@paw-match/validation";
import { getApiErrorMessage, signIn } from "@paw-match/api-client";
import { apiClient } from "../../lib/apiClient";
import { useAuth } from "../../lib/auth";
import { paths } from "../../routes/paths";
import { AuthLayout } from "./AuthLayout";

interface SignInLocationState {
  from?: { pathname?: string };
  justVerified?: boolean;
  justReset?: boolean;
  justPasswordChanged?: boolean;
  justEmailChanged?: boolean;
}

const SignInPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as SignInLocationState | null;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const signInMutation = useMutation({
    mutationFn: (values: SignInInput) => signIn(apiClient, values),
    onSuccess: (user) => {
      auth.login(user);
      navigate(locationState?.from?.pathname ?? paths.home, { replace: true });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, "Invalid email or password"));
    },
  });

  const successMessage = locationState?.justVerified
    ? "Your email is verified. Please sign in."
    : locationState?.justReset
      ? "Your password has been reset. Please sign in."
      : locationState?.justPasswordChanged
        ? "Your password has been changed. Please sign in again."
        : locationState?.justEmailChanged
          ? "Your email has been changed. Please sign in with your new email address."
          : null;

  const onSubmit = (values: SignInInput) => {
    setFormError(null);
    signInMutation.mutate(values);
  };

  return (
    <AuthLayout
      title="Sign in"
      description="Welcome back to Paw Match."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to={paths.signup} className="font-medium text-brand-700 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {successMessage && (
          <p role="status" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
            {successMessage}
          </p>
        )}

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

        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Link
            to={paths.forgotPassword}
            className="self-end text-sm font-medium text-brand-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="mt-2 w-full" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SignInPage;
