import type { ReactNode } from "react";
import { cn } from "@paw-match/utilities";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center",
      className,
    )}
  >
    {icon && (
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        {icon}
      </span>
    )}
    <div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      )}
    </div>
    {action}
  </div>
);
