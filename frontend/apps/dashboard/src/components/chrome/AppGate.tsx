import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { AppLoader } from "@paw-match/ui";
import { useAuth } from "../../lib/auth";

const MINIMUM_VISIBLE_MS = 2000;

/**
 * Mirrors apps/public-web/src/components/chrome/AppGate.tsx exactly — same
 * loader, same minimum-visible-duration behavior — wired to this app's own
 * AuthProvider instance so the Dashboard's initial session check never
 * flashes unauthenticated content either.
 */
export const AppGate = ({ children }: { children: ReactNode }) => {
  const { isLoading } = useAuth();
  const [minimumElapsed, setMinimumElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinimumElapsed(true), MINIMUM_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  const showLoader = isLoading || !minimumElapsed;

  return (
    <>
      <AnimatePresence>{showLoader && <AppLoader key="app-loader" />}</AnimatePresence>
      {!showLoader && children}
    </>
  );
};
