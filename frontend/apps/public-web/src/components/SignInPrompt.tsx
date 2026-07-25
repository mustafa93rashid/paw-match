import { useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { ButtonLink, EmptyState } from "@paw-match/ui";
import { paths } from "../routes/paths";

export interface SignInPromptProps {
  title: string;
  description: string;
}

/** Honest "sign in to continue" state for content that genuinely requires auth on the backend. */
export const SignInPrompt = ({ title, description }: SignInPromptProps) => {
  const location = useLocation();

  return (
    <EmptyState
      icon={<LogIn className="h-6 w-6" aria-hidden />}
      title={title}
      description={description}
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink to={paths.login} state={{ from: location }}>
            Sign in
          </ButtonLink>
          <ButtonLink to={paths.signup} variant="secondary">
            Create an account
          </ButtonLink>
        </div>
      }
    />
  );
};
