import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AxiosInstance } from "axios";
import { getProfile, logOut, type AuthEventBus } from "@paw-match/api-client";
import type { AuthUser, UserRole } from "@paw-match/types";
import { Spinner } from "@paw-match/ui";

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Hydrates local state directly from a signin/verify response — avoids an extra round trip. */
  login: (user: AuthUser) => void;
  /** Updates the cached user from a profile/image response that already
   * includes the fresh user object — avoids an extra GET /user/profile
   * round trip after a profile or profile-image change. */
  updateUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  /** Clears local session state only, without calling POST /auth/logout —
   * for flows where the backend already invalidated the session server-side
   * (change-password and email-verify both clear auth cookies as a side
   * effect of a successful request). */
  clearSession: () => void;
  /** Re-runs the session check (e.g. after a profile update elsewhere). */
  refetch: () => Promise<void>;
}

export interface CreateAuthModuleOptions {
  client: AxiosInstance;
  authEvents: AuthEventBus;
}

/**
 * Factory so AuthProvider/useAuth/guards are wired to one app's specific
 * Axios instance + auth event bus, mirroring createShelterHooks.
 */
export const createAuthModule = ({ client, authEvents }: CreateAuthModuleOptions) => {
  const AuthContext = createContext<AuthContextValue | null>(null);

  const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
      try {
        const profile = await getProfile(client);
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }, []);

    // Session restore on mount — GET /user/profile doubles as the "who am
    // I" check (no dedicated session endpoint exists). A stale-but-valid
    // refresh token silently refreshes the access token first, via the
    // shared interceptor, before this call resolves.
    useEffect(() => {
      fetchProfile();
    }, [fetchProfile]);

    // Cleared whenever any request fails auth even after a refresh attempt.
    useEffect(() => authEvents.onUnauthorized(() => setUser(null)), []);

    const logout = useCallback(async () => {
      try {
        await logOut(client);
      } catch {
        // Best-effort: clear local state regardless of the server call's outcome.
      }
      setUser(null);
    }, []);

    const clearSession = useCallback(() => setUser(null), []);

    const value = useMemo<AuthContextValue>(
      () => ({
        user,
        isLoading,
        isAuthenticated: user !== null,
        login: setUser,
        updateUser: setUser,
        logout,
        clearSession,
        refetch: fetchProfile,
      }),
      [user, isLoading, logout, clearSession, fetchProfile],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };

  const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);

    if (!context) {
      throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
  };

  /** Redirects to `redirectTo` (preserving the intended destination) if not signed in. */
  const RequireAuth = ({ redirectTo }: { redirectTo: string }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
      return <Spinner label="Checking your session…" />;
    }

    if (!user) {
      return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    return <Outlet />;
  };

  /** Redirects signed-in users away from guest-only pages (login, signup, ...). */
  const RequireGuestOnly = ({ redirectTo }: { redirectTo: string }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return <Spinner label="Loading…" />;
    }

    if (user) {
      return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
  };

  /** Redirects to `redirectTo` unless the current user has one of `roles`. */
  const RequireRole = ({ roles, redirectTo }: { roles: UserRole[]; redirectTo: string }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
      return <Spinner label="Checking your session…" />;
    }

    if (!user) {
      return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    if (!roles.includes(user.role)) {
      return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
  };

  return { AuthProvider, useAuth, RequireAuth, RequireGuestOnly, RequireRole };
};
