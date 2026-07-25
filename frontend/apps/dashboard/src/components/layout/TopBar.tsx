import { Link } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { Badge, UserAvatar } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { UserRole } from "@paw-match/types";
import { useAuth } from "../../lib/auth";
import { paths } from "../../routes/paths";
import { NotificationBell } from "./NotificationBell";

const roleBadgeTone: Record<UserRole, BadgeTone> = {
  superadmin: "brand",
  shelterEmployee: "accent",
  vet: "accent",
  adopter: "neutral",
};

const roleLabel: Record<UserRole, string> = {
  superadmin: "Super Admin",
  shelterEmployee: "Shelter Employee",
  vet: "Veterinarian",
  adopter: "Adopter",
};

export interface TopBarProps {
  onOpenMobileNav: () => void;
}

/** Logout lives in the Sidebar's fixed bottom section — see Sidebar's SidebarFooter. User identity + profile access stay here, unchanged. */
export const TopBar = ({ onOpenMobileNav }: TopBarProps) => {
  const auth = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="relative hidden max-w-sm flex-1 sm:block">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search…"
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 ps-9 pe-4 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:border-brand-300 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          />
        </div>

        <div className="ms-auto flex items-center gap-2">
          <NotificationBell />

          {auth.user && (
            <Link
              to={paths.account}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 py-1.5 ps-1.5 pe-3 transition-colors hover:bg-slate-50"
            >
              <UserAvatar
                firstName={auth.user.firstName}
                lastName={auth.user.lastName}
                profileImage={auth.user.profileImage}
                size="sm"
              />
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-medium leading-tight text-slate-900">
                  {auth.user.firstName} {auth.user.lastName}
                </span>
                <Badge tone={roleBadgeTone[auth.user.role]} className="mt-0.5 w-fit px-1.5 py-0 text-[10px]">
                  {roleLabel[auth.user.role]}
                </Badge>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
