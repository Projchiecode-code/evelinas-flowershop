import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Bouquet } from '../types';

interface FavoritesContextType {
  favorites: Bouquet[];
  addFavorite: (bouquet: Bouquet) => void;
  removeFavorite: (bouquetId: string) => void;
  isFavorite: (bouquetId: string) => boolean;
  toggleFavorite: (bouquet: Bouquet) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Bouquet[]>([]);

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
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
