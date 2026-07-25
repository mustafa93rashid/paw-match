/**
 * Tiny pub-sub so the interceptor (created once, in client.ts) can notify
 * the app's AuthProvider (mounted later, in React) when a request fails
 * auth even after a refresh attempt — without a hidden singleton.
 */
export interface AuthEventBus {
  notifyUnauthorized: () => void;
  onUnauthorized: (handler: () => void) => () => void;
}

export const createAuthEventBus = (): AuthEventBus => {
  const handlers = new Set<() => void>();

  return {
    notifyUnauthorized: () => {
      handlers.forEach((handler) => handler());
    },
    onUnauthorized: (handler) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
};
