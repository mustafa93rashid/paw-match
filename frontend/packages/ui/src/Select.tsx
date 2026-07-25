import { useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@paw-match/utilities";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  hideLabel?: boolean;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select = ({
  label,
  hideLabel = false,
  options,
  placeholder,
  error,
  id,
  className,
  ...props
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className={cn("text-sm font-medium text-slate-700", hideLabel && "sr-only")}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full appearance-none rounded-lg border bg-white py-2.5 pl-3 pr-9 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            error
              ? "border-red-400 focus-visible:ring-red-500"
              : "border-slate-300 focus-visible:ring-brand-500",
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
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
