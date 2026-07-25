import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "paw-match:favorite-animal-ids";

/**
 * The backend has no favorites/wishlist endpoint anywhere in its API — this
 * is a local-only UI affordance (persisted to this browser via
 * localStorage), not an account-level feature. It never calls the API.
 */
export const useFavorites = () => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds]));
    } catch {
      // Ignore storage failures (private browsing, quota, etc.) — favoriting stays session-only.
    }
  }, [favoriteIds]);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

  return { isFavorite, toggleFavorite };
};
