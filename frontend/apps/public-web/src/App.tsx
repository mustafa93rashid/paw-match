import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PageLoader } from "@paw-match/ui";
import { RootLayout } from "./layouts/RootLayout";
import { RequireAuth, RequireGuestOnly, RequireRole } from "./lib/auth";
import { paths } from "./routes/paths";
import HomePage from "./pages/home/HomePage";

// Every other route is code-split — only fetched when actually navigated
// to. PageLoader is the shared Suspense fallback (see packages/ui).
const SheltersDirectoryPage = lazy(() => import("./pages/shelters/SheltersDirectoryPage"));
const ShelterDetailPage = lazy(() => import("./pages/shelters/ShelterDetailPage"));
const AnimalsPage = lazy(() => import("./pages/animals/AnimalsPage"));
const AnimalDetailPage = lazy(() => import("./pages/animals/AnimalDetailPage"));
const MatchingResultsPage = lazy(() => import("./pages/matching/MatchingResultsPage"));
const AdopterProfilePage = lazy(() => import("./pages/profile/AdopterProfilePage"));
const VeterinariansDirectoryPage = lazy(
  () => import("./pages/veterinarians/VeterinariansDirectoryPage"),
);
const VeterinarianDetailPage = lazy(
  () => import("./pages/veterinarians/VeterinarianDetailPage"),
);
const VetAppointmentsPage = lazy(() => import("./pages/appointments/VetAppointmentsPage"));
const RequestVetAppointmentPage = lazy(
  () => import("./pages/appointments/RequestVetAppointmentPage"),
);
const AdoptionRequestsPage = lazy(() => import("./pages/adoptions/AdoptionRequestsPage"));
const NewAdoptionRequestPage = lazy(() => import("./pages/adoptions/NewAdoptionRequestPage"));
const ReviewFormPage = lazy(() => import("./pages/reviews/ReviewFormPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const AccountPage = lazy(() => import("./pages/account/AccountPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SignInPage = lazy(() => import("./pages/auth/SignInPage"));
const SignUpPage = lazy(() => import("./pages/auth/SignUpPage"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const ActivateAccountPage = lazy(() => import("./pages/auth/ActivateAccountPage"));
const ShelterManagerApplyPage = lazy(() => import("./pages/apply/ShelterManagerApplyPage"));
const VetApplyPage = lazy(() => import("./pages/apply/VetApplyPage"));
const ApplicationVerifyPage = lazy(() => import("./pages/apply/ApplicationVerifyPage"));

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shelters" element={<SheltersDirectoryPage />} />
        <Route path="shelters/:id" element={<ShelterDetailPage />} />
        <Route path="animals" element={<AnimalsPage />} />
        <Route path="animals/:id" element={<AnimalDetailPage />} />

        {/* GET /vet-profile and GET /vet-profile/:userId require only auth (any role), same
            progressive-disclosure pattern as animals/shelters — not role-gated. */}
        <Route path="veterinarians" element={<VeterinariansDirectoryPage />} />
        <Route path="veterinarians/:userId" element={<VeterinarianDetailPage />} />

        {/* Public staff applications — no auth/role gate either way (an
            applicant isn't signed in yet); every write goes through
            POST /staff-applications, which never creates a User or role. */}
        <Route path="apply/shelter-manager" element={<ShelterManagerApplyPage />} />
        <Route path="apply/vet" element={<VetApplyPage />} />
        <Route path="apply/verify" element={<ApplicationVerifyPage />} />

        {/* GET /matching, PUT /adopter-profile/me, every /vetappointments adopter route, and
            every /adoptions adopter route are role(["adopter"])-gated on the backend too. */}
        <Route element={<RequireRole roles={["adopter"]} redirectTo={paths.login} />}>
          <Route path="matching" element={<MatchingResultsPage />} />
          <Route path="profile" element={<AdopterProfilePage />} />
          <Route path="appointments/vet" element={<VetAppointmentsPage />} />
          <Route path="appointments/vet/new/:vetId" element={<RequestVetAppointmentPage />} />
          <Route path="adoptions" element={<AdoptionRequestsPage />} />
          <Route path="adoptions/new/:animalId" element={<NewAdoptionRequestPage />} />
          <Route path="reviews/:targetType/:transactionId" element={<ReviewFormPage />} />
        </Route>

        {/* GET /notifications and its sibling routes require only `auth` on the
            backend — no role restriction — so this is gated by RequireAuth
            only, not RequireRole. */}
        <Route element={<RequireAuth redirectTo={paths.login} />}>
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<RequireGuestOnly redirectTo={paths.home} />}>
        <Route path="login" element={<SignInPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="signup/verify" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="activate-account/:token" element={<ActivateAccountPage />} />
      </Route>
    </Routes>
  </Suspense>
);

export default App;
