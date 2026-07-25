import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@paw-match/utilities";

/** Scrollable card chrome around a semantic <table> — column definitions stay page-specific. */
export const Table = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm", className)}
    {...props}
  >
    <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
  </div>
);

/** Renders its children (TableHeaderCells) inside the single header row this table ever needs. */
export const TableHead = ({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("border-b border-slate-200 bg-slate-50", className)} {...props}>
    <tr>{children}</tr>
  </thead>
);

export const TableHeaderCell = ({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    scope="col"
    className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500", className)}
    {...props}
  >
    {children}
  </th>
);

export const TableBody = ({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("divide-y divide-slate-100", className)} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("transition-colors hover:bg-slate-50", className)} {...props}>
    {children}
  </tr>
);

export const TableCell = ({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-4 py-3 align-middle text-slate-700", className)} {...props}>
    {children}
  </td>
);
