import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@paw-match/utilities";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  leadingIcon?: ReactNode;
  error?: string;
}

export const Input = ({
  label,
  hideLabel = false,
  leadingIcon,
  error,
  id,
  className,
  ...props
}: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={cn("text-sm font-medium text-slate-700", hideLabel && "sr-only")}
      >
        {label}
      </label>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full rounded-lg border bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            error
              ? "border-red-400 focus-visible:ring-red-500"
              : "border-slate-300 focus-visible:ring-brand-500",
            leadingIcon ? "pl-9 pr-3" : "px-3",
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
