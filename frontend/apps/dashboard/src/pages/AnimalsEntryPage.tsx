import { lazy } from "react";
import { useAuth } from "../lib/auth";

const ManagerAnimalsPage = lazy(() => import("./shelterEmployee/AnimalsPage"));
const AnimalShelterOverviewPage = lazy(() => import("./superadmin/AnimalShelterOverviewPage"));

/**
 * Single entry point for the shared /animals path. This has to be one
 * route, not two separate <Route path="animals"> definitions under
 * different RequireRole guards — React Router resolves a URL to exactly
 * one matching route branch before anything renders, so two routes for the
 * same path only ever match the first one defined; the second is
 * permanently unreachable regardless of its own guard. Dispatching by role
 * inside a single element is the correct way to vary the page per role at
 * the same URL — see App.tsx's animals route for the guard that wraps this.
 * Both branches stay lazy (code-split) so neither role's bundle pulls in
 * the other's page code — App.tsx's existing top-level <Suspense> already
 * covers this nested lazy() pair, no new boundary needed.
 */
const AnimalsEntryPage = () => {
  const auth = useAuth();

  return auth.user?.role === "superadmin" ? <AnimalShelterOverviewPage /> : <ManagerAnimalsPage />;
};

export default AnimalsEntryPage;
