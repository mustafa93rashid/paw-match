import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Heart, LogOut, Loader2, PawPrint, Stethoscope, UserRound } from "lucide-react";
import { UserAvatar } from "@paw-match/ui";
import { cn } from "@paw-match/utilities";
import { useAuth } from "../../lib/auth";
import { paths } from "../../routes/paths";

interface MenuLink {
  label: string;
  to: string;
  icon: typeof UserRound;
}

const menuItemClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none",
    isActive && "bg-brand-50 text-brand-700",
  );

export const UserMenu = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  const links: MenuLink[] = [
    { label: "Profile", to: paths.account, icon: UserRound },
    ...(auth.user?.role === "adopter"
      ? [
          { label: "Adoption Profile", to: paths.adopterProfile, icon: Heart },
          { label: "My Appointments", to: paths.vetAppointments, icon: Stethoscope },
          { label: "My Adoptions", to: paths.adoptionRequests, icon: PawPrint },
        ]
      : []),
  ];

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // Move focus onto the first menu item as soon as the panel opens.
  useEffect(() => {
    if (isOpen) {
      itemRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const focusableItems = () => itemRefs.current.filter((el): el is HTMLElement => el !== null);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = focusableItems();
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await auth.logout();
      // Clear every cached query — most of it is user-scoped (adoptions,
      // appointments, reviews, notifications, account profile) and must
      // not leak into whoever signs in next on this device.
      queryClient.clear();
      setIsOpen(false);
      navigate(paths.home);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!auth.user) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="user-menu-panel"
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          isOpen && "bg-slate-100",
        )}
        onClick={() => setIsOpen((open) => !open)}
      >
        <UserAvatar
          firstName={auth.user.firstName}
          lastName={auth.user.lastName}
          profileImage={auth.user.profileImage}
          size="sm"
        />
        <span className="max-w-[9rem] truncate">
          {auth.user.firstName} {auth.user.lastName}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div
          id="user-menu-panel"
          role="menu"
          aria-label="User menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg"
          onKeyDown={onMenuKeyDown}
        >
          {links.map((link, index) => (
            <NavLink
              key={link.to}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              to={link.to}
              role="menuitem"
              className={menuItemClassName}
              onClick={() => setIsOpen(false)}
            >
              <link.icon className="h-4 w-4 text-slate-400" aria-hidden />
              {link.label}
            </NavLink>
          ))}

          <div className="my-1.5 border-t border-slate-200" />

          <button
            ref={(el) => {
              itemRefs.current[links.length] = el;
            }}
            type="button"
            role="menuitem"
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none disabled:opacity-60"
            onClick={handleLogout}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4 text-slate-400" aria-hidden />
            )}
            {isLoggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
};
