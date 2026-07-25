import { createAuthModule } from "@paw-match/auth";
import { apiClient, authEvents } from "./apiClient";

export const { AuthProvider, useAuth, RequireAuth, RequireGuestOnly, RequireRole } =
  createAuthModule({ client: apiClient, authEvents });
