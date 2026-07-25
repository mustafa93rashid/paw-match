import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PageLoader } from "@paw-match/ui";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { RequireAuth, RequireGuestOnly, RequireRole } from "./lib/auth";
import { RequireDashboardAccess } from "./components/guards/RequireDashboardAccess";
import { RequireApprovedShelter } from "./components/guards/RequireApprovedShelter";
import { paths } from "./routes/paths";
import { ComingSoonPage } from "./pages/ComingSoonPage";

const SignInPage = lazy(() => import("./pages/auth/SignInPage"));
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SheltersPage = lazy(() => import("./pages/superadmin/SheltersPage"));
const UsersPage = lazy(() => import("./pages/superadmin/UsersPage"));
const ApplicationsPage = lazy(() => import("./pages/superadmin/ApplicationsPage"));
const MyShelterPage = lazy(() => import("./pages/shelterEmployee/MyShelterPage"));
const ShelterEmployeesPage = lazy(() => import("./pages/shelterEmployee/ShelterEmployeesPage"));
const AnimalsEntryPage = lazy(() => import("./pages/AnimalsEntryPage"));
const ShelterAnimalsPage = lazy(() => import("./pages/superadmin/ShelterAnimalsPage"));
const AdoptionRequestsPage = lazy(() => import("./pages/shelterEmployee/AdoptionRequestsPage"));
const MyProfilePage = lazy(() => import("./pages/vet/MyProfilePage"));
const AppointmentsPage = lazy(() => import("./pages/vet/AppointmentsPage"));
const ReviewsPage = lazy(() => import("./pages/reviews/ReviewsPage"));
const AccountPage = lazy(() => import("./pages/account/AccountPage"));
const AdoptersPage = lazy(() => import("./pages/superadmin/AdoptersPage"));
const AdopterDetailPage = lazy(() => import("./pages/adopters/AdopterDetailPage"));

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route element={<RequireGuestOnly redirectTo={paths.home} />}>
        <Route path="login" element={<SignInPage />} />
      </Route>

      {/* Never redirects again — the one safe landing spot for an
          authenticated user whose role/position doesn't grant Dashboard
          access. */}
      <Route path="unauthorized" element={<UnauthorizedPage />} />

      {/* Unauthenticated visitors go to /login here; authenticated visitors
          without Dashboard access fall through to /unauthorized below —
          never back to /login, which would bounce them straight back via
          RequireGuestOnly. */}
      <Route element={<RequireAuth redirectTo={paths.login} />}>
        {/* Role AND (for shelterEmployee) ShelterEmployeeProfile.position —
            an Employee never reaches anything nested here, not even briefly. */}
        <Route element={<RequireDashboardAccess />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />

            <Route element={<RequireRole roles={["shelterEmployee"]} redirectTo={paths.home} />}>
              <Route path="shelter">
                <Route index element={<MyShelterPage />} />
                <Route path="employees" element={<ShelterEmployeesPage />} />
              </Route>

              {/* Manager-only AND shelter must be approved+verified+active —
                  a Manager without an approved shelter sees a locked state
                  instead of the real management UI. */}
              <Route element={<RequireApprovedShelter />}>
                <Route path="adoption-requests" element={<AdoptionRequestsPage />} />
              </Route>
            </Route>

            {/* Animal Management is shared between Manager and Super Admin —
                the backend's canManageAnimal grants superadmin access to
                every shelter's animals. This MUST stay a single path="animals"
                route: React Router resolves a URL to exactly one matching
                route branch before any component renders, so two separate
                <Route path="animals"> definitions under different RequireRole
                guards silently make the second one unreachable (the first
                match wins and its guard redirects everyone else away) — that
                was the actual bug behind "Super Admin Animals page is
                broken." AnimalsEntryPage dispatches to the right page
                internally instead. RequireApprovedShelter still applies to
                a Manager exactly as before; it bypasses entirely for
                superadmin (see that guard's own comment). */}
            <Route element={<RequireRole roles={["shelterEmployee", "superadmin"]} redirectTo={paths.home} />}>
              <Route element={<RequireApprovedShelter />}>
                <Route path="animals" element={<AnimalsEntryPage />} />
              </Route>
            </Route>

            {/* /animals/shelters/:shelterId has no shelterEmployee
                equivalent, so it's safe as its own exclusive block — no
                path collision with the route above. */}
            <Route element={<RequireRole roles={["superadmin"]} redirectTo={paths.home} />}>
              <Route path="animals/shelters/:shelterId" element={<ShelterAnimalsPage />} />
            </Route>

            <Route element={<RequireRole roles={["vet"]} redirectTo={paths.home} />}>
              <Route path="vet-profile" element={<MyProfilePage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
            </Route>

            <Route element={<RequireRole roles={["shelterEmployee", "vet"]} redirectTo={paths.home} />}>
              <Route path="reviews" element={<ReviewsPage />} />
            </Route>

            <Route element={<RequireRole roles={["superadmin"]} redirectTo={paths.home} />}>
              <Route path="shelters" element={<SheltersPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="adopters" element={<AdoptersPage />} />
            </Route>

            {/* /adopters/:userId has no shelterEmployee-wide list equivalent —
                a Shelter Employee only ever reaches it via a specific
                adoption request's adopter link (see
                AdoptionRequestQuickViewModal), never the /adopters list
                above, which stays superadmin-only in both the route guard
                and the sidebar. Safe as its own block: no path collision
                with "adopters" since ":userId" always has a segment. */}
            <Route element={<RequireRole roles={["superadmin", "shelterEmployee"]} redirectTo={paths.home} />}>
              <Route path="adopters/:userId" element={<AdopterDetailPage />} />
            </Route>

            <Route
              path="notifications"
              element={<ComingSoonPage title="Notifications" description="Your full notification history." />}
            />
            <Route path="account" element={<AccountPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  </Suspense>
);

export default App;
