import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'favorite-systems';

function getStoredFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavoritesToStorage(favorites: string[]) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

export function useFavorites() {
  const [favorites, setFavoritesState] = useState<string[]>([]);

  // Load favorites on mount
  useEffect(() => {
    setFavoritesState(getStoredFavorites());
  }, []);

  const toggleFavorite = useCallback((systemId: string) => {
    setFavoritesState((prev) => {
      const isFavorite = prev.includes(systemId);
      const updated = isFavorite
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId];
      saveFavoritesToStorage(updated);
      return updated;
    });
  }, []);

  const addFavorite = useCallback((systemId: string) => {
    setFavoritesState((prev) => {
      if (prev.includes(systemId)) return prev;
      const updated = [...prev, systemId];
      saveFavoritesToStorage(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((systemId: string) => {
    setFavoritesState((prev) => {
      const updated = prev.filter((id) => id !== systemId);
      saveFavoritesToStorage(updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback((systemId: string) => {
    return favorites.includes(systemId);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}
