import type { ReactNode } from "react";

/** Screen-reader-only text: visually hidden but announced by assistive tech. */
export const VisuallyHidden = ({ children }: { children: ReactNode }) => (
  <span className="sr-only">{children}</span>
);
