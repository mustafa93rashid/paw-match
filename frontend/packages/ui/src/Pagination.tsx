import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@paw-match/utilities";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Client-side pagination controls — for resources whose backend has no server-side pagination. */
export const Pagination = ({ page, totalPages, onPageChange, className }: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Previous
      </button>

      <span className="text-sm text-slate-600" aria-current="page">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
};
