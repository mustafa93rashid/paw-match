import { Skeleton } from "./Skeleton";
import { VisuallyHidden } from "./VisuallyHidden";
import { Table, TableBody, TableCell, TableRow } from "./Table";
import { cn } from "@paw-match/utilities";

export interface TableSkeletonProps {
  /** Number of placeholder rows. */
  rows?: number;
  /** Number of placeholder columns — should match the real table's column count. */
  columns: number;
  label?: string;
  className?: string;
}

/** Loading placeholder shaped like the real table it stands in for, built from the shared Skeleton atom (same spirit as ListSkeleton, tabular shape). */
export const TableSkeleton = ({ rows = 5, columns, label = "Loading", className }: TableSkeletonProps) => (
  <div role="status" aria-live="polite" className={className}>
    <VisuallyHidden>{label}</VisuallyHidden>
    <Table aria-hidden>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className={cn("hover:bg-transparent")}>
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <TableCell key={columnIndex}>
                <Skeleton className="h-4 w-full max-w-[10rem]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
