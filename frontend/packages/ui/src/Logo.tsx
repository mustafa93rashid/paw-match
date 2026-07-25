import { PawPrint } from "lucide-react";
import { cn } from "@paw-match/utilities";

export interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps) => (
  <span className={cn("inline-flex items-center gap-2", className)}>
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
      <PawPrint className="h-5 w-5" aria-hidden />
    </span>
    <span className="text-lg font-semibold tracking-tight text-slate-900">
      Paw Match
    </span>
  </span>
);
