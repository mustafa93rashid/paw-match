import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ErrorState, ProfileSkeleton } from "@paw-match/ui";
import { getApiStatus } from "@paw-match/api-client";
import { cn } from "@paw-match/utilities";
import { userAccountHooks } from "../../lib/userAccountHooks";
import { ProfileForm } from "./components/ProfileForm";
import { ProfileImageManager } from "./components/ProfileImageManager";
import { PasswordForm } from "./components/PasswordForm";
import { EmailChangeForm } from "./components/EmailChangeForm";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "image", label: "Profile Image" },
  { id: "password", label: "Password" },
  { id: "email", label: "Email" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Every authenticated dashboard role lands here — this page is intentionally
 * role-agnostic (unlike the rest of the Dashboard's role-gated pages),
 * mirroring the Public Website's Account page exactly: same shared
 * validation, api-client, and hooks (@paw-match/hooks's createUserAccountHooks),
 * only the local wiring (auth/paths/hooks-instance) differs per app.
 */
const AccountPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const profileQuery = userAccountHooks.useMyAccountProfile();
  const errorStatus = getApiStatus(profileQuery.error);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My Profile</h1>
      <p className="mt-2 max-w-xl text-slate-600">Manage your profile, picture, password, and email address.</p>

      <div className="mt-8 max-w-2xl">
        {profileQuery.isPending && <ProfileSkeleton label="Loading account details" />}

        {profileQuery.isError && errorStatus === 401 && (
          <ErrorState
            title="Your session has expired"
            description="Please sign in again to manage your account."
          />
        )}

        {profileQuery.isError && errorStatus !== 401 && (
          <ErrorState
            description="We couldn't load your account details right now."
            onRetry={() => profileQuery.refetch()}
          />
        )}

        {profileQuery.isSuccess && (
          <>
            <div
              role="tablist"
              aria-label="Account settings sections"
              className="flex flex-wrap gap-1 border-b border-slate-200"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`account-tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`account-panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  className={cn(
                    "rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    activeTab === tab.id
                      ? "border-b-2 border-brand-600 text-brand-700"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`account-panel-${activeTab}`}
              aria-labelledby={`account-tab-${activeTab}`}
              className="mt-6"
            >
              {activeTab === "profile" && <ProfileForm profile={profileQuery.data} />}
              {activeTab === "image" && <ProfileImageManager profile={profileQuery.data} />}
              {activeTab === "password" && <PasswordForm />}
              {activeTab === "email" && <EmailChangeForm />}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AccountPage;
