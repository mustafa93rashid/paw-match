import { createApiClient, createAuthEventBus } from "@paw-match/api-client";

/**
 * Backend is mounted at /api/v1 (see src/app.js). The dev server proxies
 * /api to the backend (see vite.config.ts) to keep requests same-origin,
 * working around the backend's missing CORS middleware and its
 * `sameSite: "strict"` cookies without touching the backend.
 */
export const authEvents = createAuthEventBus();

export const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  authEvents,
});
