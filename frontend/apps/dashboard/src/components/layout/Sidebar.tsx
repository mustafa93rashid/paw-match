import { useEffect, useState, type ComponentType } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PawPrint,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { Logo } from "@paw-match/ui";
import { cn } from "@paw-match/utilities";
import { useAuth } from "../../lib/auth";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { shelterEmployeeShelterHooks } from "../../lib/shelterEmployeeShelterHooks";
import { paths } from "../../routes/paths";

interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
}

const vetAndSuperadminNav: Record<"vet" | "superadmin", NavItem[]> = {
  vet: [
    { label: "Overview", to: paths.home, icon: LayoutDashboard },
    { label: "My Profile", to: paths.vetProfile, icon: UserRound },
    { label: "Appointments", to: paths.appointments, icon: CalendarDays },
    { label: "Reviews", to: paths.reviews, icon: Star },
  ],
  superadmin: [
    { label: "Overview", to: paths.home, icon: LayoutDashboard },
    { label: "Shelters", to: paths.shelters, icon: Building2 },
    { label: "Users", to: paths.users, icon: Users },
    { label: "Animals", to: paths.animals, icon: PawPrint },
    { label: "Applications", to: paths.applications, icon: ClipboardCheck },
    { label: "Adopters", to: paths.adopters, icon: Heart },
  ],
};

/**
 * A shelterEmployee reaching this component is already guaranteed by
 * RequireDashboardAccess to be an active Manager — no is-manager check is
 * needed here. What still varies is the shelter's own status: Animals and
 * Adoption Requests only unlock once it's approved+verified+active, mirroring
 * RequireApprovedShelter's route guard exactly (same cached queries, no
 * extra requests) — the nav must never show a link to a page that would
 * just show a locked state.
 */
const useShelterEmployeeNav = (enabled: boolean): NavItem[] => {
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile({ enabled });
  const shelterId = profileQuery.data?.shelterId?._id;
  const shelterQuery = shelterEmployeeShelterHooks.useMyShelterDetail(enabled ? shelterId : undefined);

  const shelter = shelterQuery.data;
  const isApproved = Boolean(shelter && shelter.verificationStatus === "approved" && shelter.isVerified && shelter.isActive);

  const items: NavItem[] = [
    { label: "Overview", to: paths.home, icon: LayoutDashboard },
    { label: "My Shelter", to: paths.myShelter, icon: Building2 },
  ];

  if (isApproved) {
    items.push(
      { label: "Animals", to: paths.animals, icon: PawPrint },
      { label: "Adoption Requests", to: paths.adoptionRequests, icon: ClipboardList },
    );
  }

  items.push({ label: "Reviews", to: paths.reviews, icon: Star });

  return items;
};

const navLinkClassName = ({ isActive }: { isActive: boolean }, isCollapsed: boolean) =>
  cn(
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700",
    isActive && "bg-brand-50 text-brand-700",
    isCollapsed && "justify-center px-2.5",
  );

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const NavList = ({ items, isCollapsed }: { items: NavItem[]; isCollapsed: boolean }) => (
  <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1 px-3">
    {items.map((item) => (
      <NavLink key={item.to} to={item.to} end={item.to === paths.home} className={(state) => navLinkClassName(state, isCollapsed)}>
        <item.icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
        {isCollapsed && (
          <span className="pointer-events-none absolute start-full ms-3 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
            {item.label}
          </span>
        )}
      </NavLink>
    ))}
  </nav>
);

/**
 * Fixed bottom section — Logout only (user identity + profile access stay
 * in TopBar, unchanged). Lives outside the scrollable nav area on purpose
 * (see Sidebar's flex-column structure below) so it never scrolls out of
 * view regardless of how many nav links are above it. Same
 * collapsed-state hover-tooltip convention as NavList's own items, for a
 * consistent affordance.
 */
const SidebarFooter = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await auth.logout();
      queryClient.clear();
      navigate(paths.home);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!auth.user) return null;

  return (
    <div className="border-t border-slate-200 p-3">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label="Log out"
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60",
          isCollapsed && "justify-center px-2.5",
        )}
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden />
        {!isCollapsed && <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>}
        {isCollapsed && (
          <span className="pointer-events-none absolute start-full ms-3 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
            Logout
          </span>
        )}
      </button>
    </div>
  );
};

/**
 * Small icon-only collapse/expand control, docked beside the logo. Desktop
 * only — the mobile drawer has no collapse concept, so it never renders
 * this. rtl:-scale-x-100 mirrors the directional Panel* icon glyph so it
 * still reads correctly if this app ever runs under dir="rtl"; no RTL mode
 * is currently configured anywhere in this codebase, so today it's always
 * the unmirrored LTR glyph.
 */
const CollapseToggleButton = ({
  isCollapsed,
  onToggleCollapsed,
}: {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}) => (
  <button
    type="button"
    onClick={onToggleCollapsed}
    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 active:bg-slate-200"
  >
    {isCollapsed ? (
      <PanelLeftOpen className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
    ) : (
      <PanelLeftClose className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
    )}
  </button>
);

export const Sidebar = ({ isCollapsed, onToggleCollapsed, isMobileOpen, onCloseMobile }: SidebarProps) => {
  const auth = useAuth();
  const role = auth.user?.role;

  const shelterEmployeeItems = useShelterEmployeeNav(role === "shelterEmployee");
  const items =
    role === "shelterEmployee"
      ? shelterEmployeeItems
      : role === "vet" || role === "superadmin"
        ? vetAndSuperadminNav[role]
        : [];

  // Let Escape close the mobile drawer from anywhere on the page.
  useEffect(() => {
    if (!isMobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseMobile();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  return (
    <>
      {/* Desktop fixed sidebar — flex-column, full viewport height. The nav
          area is the only scrollable region (flex-1 + overflow-y-auto), so
          the footer below it never moves regardless of nav item count. */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-30 hidden h-screen flex-col border-e border-slate-200 bg-white/85 backdrop-blur-xl transition-[width] duration-300 ease-in-out lg:flex",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4",
            isCollapsed && "flex-col justify-center gap-1.5 px-2 py-2",
          )}
        >
          {isCollapsed ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
              <PawPrint className="h-4 w-4" aria-hidden />
            </span>
          ) : (
            <Logo />
          )}
          <CollapseToggleButton isCollapsed={isCollapsed} onToggleCollapsed={onToggleCollapsed} />
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <NavList items={items} isCollapsed={isCollapsed} />
        </div>

        <SidebarFooter isCollapsed={isCollapsed} />
      </aside>

      {/* Mobile drawer — overlay only, always renders expanded-style (no
          collapse concept here), same fixed-footer structure. */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              aria-hidden
              onClick={onCloseMobile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: document.documentElement.dir === "rtl" ? 288 : -288 }}
              animate={{ x: 0 }}
              exit={{ x: document.documentElement.dir === "rtl" ? 288 : -288 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="fixed inset-y-0 start-0 z-50 flex h-screen w-72 flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-4">
                <Logo />
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <NavList items={items} isCollapsed={false} />
              </div>
              <SidebarFooter isCollapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
