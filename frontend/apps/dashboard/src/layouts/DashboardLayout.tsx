import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ScrollProgressBar, ScrollToTopButton, SkipLink } from "@paw-match/ui";
import { cn } from "@paw-match/utilities";
import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";

export const DashboardLayout = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-brand-50/50 via-white to-accent-50/40">
      <ScrollProgressBar />
      <SkipLink targetId="main-content" />

      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed((collapsed) => !collapsed)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/*
        Single shared source of truth for the sidebar-offset: isCollapsed
        lives here and both this wrapper and <Sidebar> read the same value,
        so navbar + main content always agree with the sidebar's actual
        width — never a separately-tracked local state.

        `ps-64`/`ps-20` (padding-inline-start, RTL-safe) are applied via an
        exclusive ternary rather than a base class + conditional override.
        Two Tailwind utilities that set the same CSS property don't "cascade"
        by DOM class order — only by the order Tailwind happens to emit them
        in the generated stylesheet — so having both `ps-64` and `ps-20`
        present at once left the collapsed state stuck at the expanded
        width. Picking exactly one class per state removes the ambiguity
        entirely. Unset on mobile (<lg) either way, so the overlay sidebar
        never reduces content width there.
      */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out",
          isCollapsed ? "lg:ps-20" : "lg:ps-64",
        )}
      >
        <TopBar onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <ScrollToTopButton />
    </div>
  );
};
