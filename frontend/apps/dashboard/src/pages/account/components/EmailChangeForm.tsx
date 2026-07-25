import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@paw-match/ui";
import {
  requestEmailUpdateSchema,
  verifyCodeSchema,
  type RequestEmailUpdateFormValues,
  type VerifyCodeInput,
} from "@paw-match/validation";
import { getApiErrorMessage, getApiStatus } from "@paw-match/api-client";
import { useAuth } from "../../../lib/auth";
import { userAccountHooks } from "../../../lib/userAccountHooks";
import { paths } from "../../../routes/paths";

export const EmailChangeForm = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [expiresInMinutes, setExpiresInMinutes] = useState<number | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const requestMutation = userAccountHooks.useRequestEmailUpdate();
  const verifyMutation = userAccountHooks.useVerifyEmailUpdate();

  const requestForm = useForm<RequestEmailUpdateFormValues>({
    resolver: zodResolver(requestEmailUpdateSchema),
  });

  const verifyForm = useForm<VerifyCodeInput>({
    resolver: zodResolver(verifyCodeSchema),
  });

  const onRequestSubmit = (values: RequestEmailUpdateFormValues) => {
    setRequestError(null);

    requestMutation.mutate(
      { newEmail: values.newEmail },
      {
        onSuccess: (result) => {
          setPendingEmail(result.email);
          setExpiresInMinutes(result.expiresInMinutes);
        },
        onError: (error) => {
          setRequestError(getApiErrorMessage(error, "Could not request an email change."));
        },
      },
    );
  };

  const onVerifySubmit = (values: VerifyCodeInput) => {
    setVerifyError(null);
    setRemainingAttempts(null);

    verifyMutation.mutate(
      { verificationCode: values.verificationCode },
      {
        onSuccess: () => {
          // The backend clears auth cookies on a successful email change —
          // reflect that immediately and send the user to sign in again.
          auth.clearSession();
          navigate(paths.login, { replace: true, state: { justEmailChanged: true } });
        },
        onError: (error) => {
          setVerifyError(getApiErrorMessage(error, "Could not verify the code. Please try again."));
          const status = getApiStatus(error);
          if (status === 400) {
            const data = (error as { response?: { data?: { remainingAttempts?: number } } }).response?.data;
            if (typeof data?.remainingAttempts === "number") {
              setRemainingAttempts(data.remainingAttempts);
            }
          }
        },
      },
    );
  };

  const startOver = () => {
    setPendingEmail(null);
    setExpiresInMinutes(null);
    setVerifyError(null);
    setRemainingAttempts(null);
    verifyForm.reset();
  };

  if (!pendingEmail) {
    return (
      <form className="flex flex-col gap-5" onSubmit={requestForm.handleSubmit(onRequestSubmit)} noValidate>
        <p className="text-sm text-slate-600">
          We'll send a 6-digit verification code to your new email address. Your account email won't change
          until you verify that code.
        </p>

        {requestError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {requestError}
          </p>
        )}

        <Input
          label="New email address"
          type="email"
          autoComplete="email"
          error={requestForm.formState.errors.newEmail?.message}
          {...requestForm.register("newEmail")}
        />

        <Button type="submit" className="self-start" isLoading={requestForm.formState.isSubmitting}>
          Send verification code
        </Button>
      </form>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={verifyForm.handleSubmit(onVerifySubmit)} noValidate>
      <p role="status" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
        A verification code was sent to {pendingEmail}
        {expiresInMinutes != null ? `. It expires in ${expiresInMinutes} minutes.` : "."}
      </p>

      {verifyError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {verifyError}
          {remainingAttempts != null && ` (${remainingAttempts} attempt(s) remaining)`}
        </p>
      )}

      <Input
        label="6-digit verification code"
        inputMode="numeric"
        maxLength={6}
        autoComplete="one-time-code"
        error={verifyForm.formState.errors.verificationCode?.message}
        {...verifyForm.register("verificationCode")}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={verifyForm.formState.isSubmitting}>
          Verify and update email
        </Button>
        <Button type="button" variant="secondary" onClick={startOver}>
          Use a different email
        </Button>
      </div>
    </form>
  );
};
