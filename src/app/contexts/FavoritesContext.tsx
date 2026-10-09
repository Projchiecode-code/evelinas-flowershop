import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bouquet } from '../types';

interface FavoritesContextType {
  favorites: Bouquet[];
  isLoading: boolean;
  addFavorite: (bouquet: Bouquet) => void;
  removeFavorite: (bouquetId: string) => void;
  isFavorite: (bouquetId: string) => boolean;
  toggleFavorite: (bouquet: Bouquet) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
const FAVORITES_STORAGE_KEY = 'evelinas_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Bouquet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // localStorage can hold corrupt or foreign values (hand-edited, an older
    // app version, another tab). A non-array here used to crash every page
    // that maps over favorites, so validate before trusting it.
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFavorites(
          Array.isArray(parsed)
            ? parsed.filter((f: unknown) => f && typeof f === 'object')
            : []
        );
      }
    } catch {
      setFavorites([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch {
        // Storage full or unavailable (private mode) — favorites simply
        // don't persist for this session.
      }
    }
  }, [favorites, isLoading]);

  const addFavorite = (bouquet: Bouquet) => {
    setFavorites(prev => prev.some(b => b.id === bouquet.id) ? prev : [...prev, bouquet]);
  };

  const removeFavorite = (bouquetId: string) => {
    setFavorites(prev => prev.filter(b => b.id !== bouquetId));
  };

  const isFavorite = (bouquetId: string) => favorites.some(b => b.id === bouquetId);

  const toggleFavorite = (bouquet: Bouquet) => {
    isFavorite(bouquet.id) ? removeFavorite(bouquet.id) : addFavorite(bouquet);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isLoading, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
