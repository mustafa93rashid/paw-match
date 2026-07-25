import { Loader2 } from "lucide-react";
import { cn } from "@paw-match/utilities";

export interface SpinnerProps {
  className?: string;
  label?: string;
}

export const Spinner = ({ className, label = "Loading" }: SpinnerProps) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      "flex flex-col items-center justify-center gap-3 py-16 text-slate-500",
      className,
    )}
  >
    <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden />
    <span className="text-sm">{label}</span>
  </div>
);
