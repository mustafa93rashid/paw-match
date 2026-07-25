import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, LogOut, Loader2, Menu, PawPrint, Stethoscope, UserRound, X } from "lucide-react";
import { ButtonLink, Container, Logo, UserAvatar, VisuallyHidden } from "@paw-match/ui";
import { cn } from "@paw-match/utilities";
import { useAuth } from "../../lib/auth";
import { paths } from "../../routes/paths";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

const baseNavLinks = [
  { label: "Home", to: paths.home },
  { label: "Shelters", to: paths.shelters },
  { label: "Animals", to: paths.animals },
  { label: "Veterinarians", to: paths.veterinarians },
  { label: "Matching", to: paths.matching },
];

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
    isActive && "bg-brand-50 text-brand-700 hover:bg-brand-50 hover:text-brand-700",
  );

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const auth = useAuth();
  const queryClient = useQueryClient();

  // Close the mobile panel whenever the route changes.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Let Escape close the mobile panel from anywhere on the page.
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <NavLink to={paths.home} className="shrink-0" aria-label="Paw Match home">
          <Logo />
        </NavLink>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {baseNavLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={navLinkClassName} end={link.to === paths.home}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {auth.isAuthenticated ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <NavLink to={paths.login} className={navLinkClassName}>
                Log in
              </NavLink>
              <ButtonLink to={paths.signup} size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-panel"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" aria-hidden />
          ) : (
            <Menu className="h-6 w-6" aria-hidden />
          )}
          <VisuallyHidden>{isMenuOpen ? "Close menu" : "Open menu"}</VisuallyHidden>
        </button>
      </Container>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-nav-panel"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-200 md:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              <nav aria-label="Primary">
                <ul className="flex flex-col gap-1">
                  {baseNavLinks.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        end={link.to === paths.home}
                        className={({ isActive }) =>
                          cn(
                            "block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100",
                            isActive && "bg-brand-50 text-brand-700",
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-4">
                {auth.isAuthenticated && auth.user ? (
                  <>
                    <div className="flex items-center justify-between gap-3 px-1 pb-1">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UserAvatar
                          firstName={auth.user.firstName}
                          lastName={auth.user.lastName}
                          profileImage={auth.user.profileImage}
                        />
                        <span className="truncate text-sm font-medium text-slate-900">
                          {auth.user.firstName} {auth.user.lastName}
                        </span>
                      </div>
                      <NotificationBell />
                    </div>

                    <NavLink
                      to={paths.account}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100",
                          isActive && "bg-brand-50 text-brand-700",
                        )
                      }
                    >
                      <UserRound className="h-4 w-4 text-slate-400" aria-hidden />
                      Profile
                    </NavLink>

                    {auth.user.role === "adopter" && (
                      <>
                        <NavLink
                          to={paths.adopterProfile}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100",
                              isActive && "bg-brand-50 text-brand-700",
                            )
                          }
                        >
                          <Heart className="h-4 w-4 text-slate-400" aria-hidden />
                          Adoption Profile
                        </NavLink>
                        <NavLink
                          to={paths.vetAppointments}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100",
                              isActive && "bg-brand-50 text-brand-700",
                            )
                          }
                        >
                          <Stethoscope className="h-4 w-4 text-slate-400" aria-hidden />
                          My Appointments
                        </NavLink>
                        <NavLink
                          to={paths.adoptionRequests}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100",
                              isActive && "bg-brand-50 text-brand-700",
                            )
                          }
                        >
                          <PawPrint className="h-4 w-4 text-slate-400" aria-hidden />
                          My Adoptions
                        </NavLink>
                      </>
                    )}

                    <div className="my-1 border-t border-slate-200" />

                    <button
                      type="button"
                      disabled={isLoggingOut}
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-base font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />
                      ) : (
                        <LogOut className="h-4 w-4 text-slate-400" aria-hidden />
                      )}
                      {isLoggingOut ? "Signing out…" : "Log out"}
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to={paths.login}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Log in
                    </NavLink>
                    <ButtonLink to={paths.signup}>Sign up</ButtonLink>
                  </>
                )}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
