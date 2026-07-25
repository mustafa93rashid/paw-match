import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@paw-match/utilities";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hideLabel?: boolean;
  error?: string;
}

export const Textarea = ({
  label,
  hideLabel = false,
  error,
  id,
  className,
  rows = 4,
  ...props
}: TextareaProps) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={textareaId}
        className={cn("text-sm font-medium text-slate-700", hideLabel && "sr-only")}
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          error
            ? "border-red-400 focus-visible:ring-red-500"
            : "border-slate-300 focus-visible:ring-brand-500",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
