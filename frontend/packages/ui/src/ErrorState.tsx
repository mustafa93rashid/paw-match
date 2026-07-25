import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@paw-match/utilities";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

export const ErrorState = ({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorStateProps) => (
  <div
    role="alert"
    className={cn(
      "flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center",
      className,
    )}
  >
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
      <AlertTriangle className="h-6 w-6" aria-hidden />
    </span>
    <div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
    </div>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
    {action}
  </div>
);
