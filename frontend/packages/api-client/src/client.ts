/**
 * Shared Axios instance factory.
 *
 * The backend authenticates via httpOnly cookies, so every request must be
 * sent with credentials.
 *
 * Integration note (see analysis report): the backend has no CORS
 * middleware and cookies are `sameSite: "strict"`. In development each app
 * must proxy /api to the backend (same-origin) rather than calling it
 * cross-origin directly. In production the apps must be served from the
 * same registrable domain as the backend, or behind a shared reverse proxy.
 *
 * Refresh strategy:
 * - A 401 triggers exactly one silent refresh attempt (`PUT
 *   /auth/refresh-token`), deduped across concurrent requests via a shared
 *   in-flight promise, then retries the original request once.
 * - The refresh call itself is issued through this same client, so without
 *   the two guards below (isRefreshCall + its own `_retry` flag) a 401 from
 *   the refresh endpoint (e.g. no refresh cookie present at all) would
 *   recursively trigger another "refresh the refresh" attempt forever.
 * - Note: if the refresh *token* itself is invalid/expired, the backend
 *   controller has no try/catch around jwt.verify, so it throws to the
 *   generic error handler and returns HTTP 500 rather than 401 — handled
 *   here anyway, since the refresh call's promise simply rejects either way.
 * - 403 (e.g. deactivated account) is never refreshable, so it clears local
 *   auth state immediately without attempting a refresh.
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import type { AuthEventBus } from "./authEvents";

export interface ApiClientOptions {
  baseURL: string;
  authEvents?: AuthEventBus;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const REFRESH_TOKEN_URL = "/auth/refresh-token";

let refreshInFlight: Promise<unknown> | null = null;

export const createApiClient = ({
  baseURL,
  authEvents,
}: ApiClientOptions): AxiosInstance => {
  const client = axios.create({
    baseURL,
    withCredentials: true,
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;
      const status = error.response?.status;
      const isRefreshCall = originalRequest?.url?.includes(REFRESH_TOKEN_URL);

      if (status === 403 && !isRefreshCall) {
        authEvents?.notifyUnauthorized();
        return Promise.reject(error);
      }

      if (
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isRefreshCall
      ) {
        originalRequest._retry = true;

        try {
          refreshInFlight ??= client.put(REFRESH_TOKEN_URL, null, {
            _retry: true,
          } as RetryableRequestConfig);

          await refreshInFlight;
          refreshInFlight = null;

          return client(originalRequest);
        } catch (refreshError) {
          refreshInFlight = null;
          authEvents?.notifyUnauthorized();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};
