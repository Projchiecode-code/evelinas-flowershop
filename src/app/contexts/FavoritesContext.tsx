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
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        setFavorites([]);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
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
