import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "@paw-match/ui";
import { signUpSchema, type SignUpInput } from "@paw-match/validation";
import { getApiErrorMessage, getApiFieldErrors, signUp } from "@paw-match/api-client";
import { apiClient } from "../../lib/apiClient";
import { paths } from "../../routes/paths";
import { AuthLayout } from "./AuthLayout";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const signUpMutation = useMutation({
    mutationFn: (values: SignUpInput) =>
      signUp(apiClient, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      }),
    onSuccess: (_result, values) => {
      // Kept only in router state (in-memory) so "resend code" on the next
      // page can re-submit the same payload — never persisted to storage.
      navigate(paths.signupVerify, {
        state: {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
        },
      });
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error);
      const knownFields = ["firstName", "lastName", "email", "password"] as const;

      if (fieldErrors) {
        let mappedAny = false;

        for (const field of knownFields) {
          if (fieldErrors[field]) {
            setError(field, { message: fieldErrors[field] });
            mappedAny = true;
          }
        }

        if (mappedAny) return;
      }

      setFormError(
        getApiErrorMessage(error, "Could not create your account. Please try again."),
      );
    },
  });

  const onSubmit = (values: SignUpInput) => {
    setFormError(null);
    signUpMutation.mutate(values);
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Join Paw Match to start finding your new best friend."
      footer={
        <>
          Already have an account?{" "}
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

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" className="mt-2 w-full" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SignUpPage;
