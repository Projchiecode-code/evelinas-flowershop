import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bouquet, GalleryPhoto } from '../types';

interface FavoritesContextType {
  favorites: Bouquet[];
  favoriteGalleryPhotos: GalleryPhoto[];

  isLoading: boolean;

  addFavorite: (bouquet: Bouquet) => void;
  removeFavorite: (bouquetId: string) => void;
  isFavorite: (bouquetId: string) => boolean;
  toggleFavorite: (bouquet: Bouquet) => void;

  addGalleryFavorite: (photo: GalleryPhoto) => void;
  removeGalleryFavorite: (photoId: string) => void;
  isGalleryFavorite: (photoId: string) => boolean;
  toggleGalleryFavorite: (photo: GalleryPhoto) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
const FAVORITES_STORAGE_KEY = 'evelinas_favorites';
const GALLERY_FAVORITES_STORAGE_KEY = 'evelinas_gallery_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Bouquet[]>([]);
  const [favoriteGalleryPhotos, setFavoriteGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Load bouquet favorites
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        setFavorites(
          Array.isArray(parsed)
            ? parsed.filter((f: unknown) => f && typeof f === 'object')
            : []
        );
      }

      // Load gallery favorites
      const savedGallery = localStorage.getItem(
        GALLERY_FAVORITES_STORAGE_KEY
      );

      if (savedGallery) {
        const parsedGallery = JSON.parse(savedGallery);

        setFavoriteGalleryPhotos(
          Array.isArray(parsedGallery)
            ? parsedGallery.filter(
                (f: unknown) => f && typeof f === 'object'
              )
            : []
        );
      }
    } catch {
      setFavorites([]);
      setFavoriteGalleryPhotos([]);
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

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(
          GALLERY_FAVORITES_STORAGE_KEY,
          JSON.stringify(favoriteGalleryPhotos)
        );
      } catch {
        // Storage full or unavailable
      }
    }
  }, [favoriteGalleryPhotos, isLoading]);

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

  const addGalleryFavorite = (photo: GalleryPhoto) => {
    setFavoriteGalleryPhotos(prev =>
      prev.some(p => p.id === photo.id)
        ? prev
        : [...prev, photo]
    );
  };

  const removeGalleryFavorite = (photoId: string) => {
    setFavoriteGalleryPhotos(prev =>
      prev.filter(p => p.id !== photoId)
    );
  };

  const isGalleryFavorite = (photoId: string) => {
    return favoriteGalleryPhotos.some(p => p.id === photoId);
  };

  const toggleGalleryFavorite = (photo: GalleryPhoto) => {
    isGalleryFavorite(photo.id)
      ? removeGalleryFavorite(photo.id)
      : addGalleryFavorite(photo);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteGalleryPhotos,

        isLoading,

        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,

        addGalleryFavorite,
        removeGalleryFavorite,
        isGalleryFavorite,
        toggleGalleryFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
