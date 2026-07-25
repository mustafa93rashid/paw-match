import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "@paw-match/ui";
import { signInSchema, type SignInInput } from "@paw-match/validation";
import { getApiErrorMessage, signIn } from "@paw-match/api-client";
import { apiClient } from "../../lib/apiClient";
import { useAuth } from "../../lib/auth";
import { paths } from "../../routes/paths";
import { AuthLayout } from "./AuthLayout";

/**
 * Dashboard accounts are provisioned by a Super Admin (POST /user/create-user),
 * not self-service — so unlike the Public Website's sign-in page, there's no
 * "sign up" link here. An adopter account can still sign in successfully
 * (the backend doesn't role-restrict /auth/signin), but every real
 * Dashboard route is role-gated and will send them to /unauthorized rather
 * than looping back to this page.
 */
const SignInPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
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
      navigate(paths.home, { replace: true });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, "Invalid email or password"));
    },
  });

  const onSubmit = (values: SignInInput) => {
    setFormError(null);
    signInMutation.mutate(values);
  };

  return (
    <AuthLayout title="Dashboard sign in" description="For shelter staff, veterinarians, and admins.">
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

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" className="mt-2 w-full" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SignInPage;
