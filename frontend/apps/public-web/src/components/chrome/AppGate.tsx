import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { AppLoader } from "@paw-match/ui";
import { useAuth } from "../../lib/auth";

const MINIMUM_VISIBLE_MS = 2000;

/**
 * Gates the entire app behind AuthProvider's own `isLoading` — the existing
 * one-time session-check flag (GET /user/profile on mount) — rather than
 * introducing a second, independent "app ready" state. Routes never mount
 * until that check resolves, so nothing (e.g. a logged-out Navbar) can
 * flash before flipping to the authenticated state.
 *
 * The loader also stays visible for a minimum duration so it never flashes
 * on/off on a fast connection: if auth resolves before MINIMUM_VISIBLE_MS,
 * we wait out the rest of that timer before hiding it; if auth takes
 * longer, the loader simply stays up until it's actually done (no
 * artificial cutoff).
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
