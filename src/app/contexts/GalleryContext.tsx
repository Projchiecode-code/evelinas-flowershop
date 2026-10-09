import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GalleryPhoto, GalleryComment } from '../types';
import { galleryApi } from '../api/client';
import { mockGallery } from '../data/gallery';

const INITIAL_COMMENTS: GalleryComment[] = [
  { id: 'c1', photoId: 'g1', authorName: 'Maria G.', text: 'So beautiful! Where did you get this? 😍', createdAt: new Date('2026-06-02'), approved: true },
  { id: 'c2', photoId: 'g1', authorName: 'James T.', text: 'Stunning arrangement! Perfect for anniversaries 🌹', createdAt: new Date('2026-06-03'), approved: true },
  { id: 'c3', photoId: 'g2', authorName: 'Emily C.', text: 'These peonies are GORGEOUS. Definitely ordering for my wedding 💒', createdAt: new Date('2026-05-30'), approved: true },
  { id: 'c4', photoId: 'g2', authorName: 'Ryan L.', text: 'The colors are incredible!', createdAt: new Date('2026-06-01'), approved: true },
  { id: 'c5', photoId: 'g3', authorName: 'Sofia R.', text: 'Classic and timeless. My favorite! ❤️', createdAt: new Date('2026-06-06'), approved: true },
  { id: 'c6', photoId: 'g4', authorName: 'Lucas P.', text: 'Sunflowers always cheer me up! 🌻', createdAt: new Date('2026-06-09'), approved: true },
  { id: 'c7', photoId: 'g1', authorName: 'spam_bot', text: 'Buy cheap flowers at www.spam.com!!!', createdAt: new Date('2026-06-04'), approved: false },
];

interface GalleryContextType {
  photos: GalleryPhoto[];
  comments: GalleryComment[];
  isLoading: boolean;
  submitPhoto: (photo: Omit<GalleryPhoto, 'id' | 'createdAt' | 'approved' | 'featured' | 'likes'>) => Promise<void>;
  approvePhoto: (id: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  featurePhoto: (id: string, featured: boolean) => Promise<void>;
  likePhoto: (id: string) => Promise<void>;
  addComment: (photoId: string, authorName: string, text: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  approveComment: (id: string) => Promise<void>;
  getCommentsForPhoto: (photoId: string) => GalleryComment[];
  getAllComments: () => GalleryComment[];
  getApprovedPhotos: () => GalleryPhoto[];
  getFeaturedPhotos: () => GalleryPhoto[];
  refetch: () => Promise<void>;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [comments, setComments] = useState<GalleryComment[]>(INITIAL_COMMENTS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const apiPhotos = await galleryApi.getAll();
      // Combine mock gallery with API photos (API photos first for newest)
      const combinedPhotos = [...apiPhotos, ...mockGallery];
      setPhotos(combinedPhotos);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
      setPhotos(mockGallery);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const submitPhoto = async (data: Omit<GalleryPhoto, 'id' | 'createdAt' | 'approved' | 'featured' | 'likes'>) => {
    try {
      const res = await galleryApi.submit(data);
      setPhotos(prev => [res, ...prev]);
    } catch (err) {
      console.error('Submit photo failed:', err);
    }
  };

  const approvePhoto = async (id: string) => {
    try {
      const res = await galleryApi.approve(id);
      setPhotos(prev => prev.map(p => p.id === id ? res : p));
    } catch (err) {
      console.error('Approve photo failed:', err);
    }
  };

  const deletePhoto = async (id: string) => {
    try {
      await galleryApi.delete(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete photo failed:', err);
    }
  };

  const featurePhoto = async (id: string, featured: boolean) => {
    try {
      const res = await galleryApi.feature(id);
      setPhotos(prev => prev.map(p => p.id === id ? res : p));
    } catch (err) {
      console.error('Feature photo failed:', err);
    }
  };

  const likePhoto = async (id: string) => {
    try {
      const res = await galleryApi.like(id);
      setPhotos(prev => prev.map(p => p.id === id ? res : p));
    } catch (err) {
      console.error('Like photo failed:', err);
    }
  };

  const addComment = async (photoId: string, authorName: string, text: string) => {
    const newComment: GalleryComment = {
      id: `c-${Date.now()}`, photoId, authorName: authorName.trim() || 'Anonymous',
      text, createdAt: new Date(), approved: true,
    };
    setComments(prev => [...prev, newComment]);
  };

  const deleteComment = async (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const approveComment = async (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, approved: !c.approved } : c));
  };

  const getCommentsForPhoto = (photoId: string) =>
    comments.filter(c => c.photoId === photoId && c.approved);

  const getAllComments = () => comments;

  const getApprovedPhotos = () => photos.filter(p => p.approved);

  const getFeaturedPhotos = () => photos.filter(p => p.approved && p.featured);

  const refetch = async () => {
    await fetchGallery();
  };

  return (
    <GalleryContext.Provider value={{ photos, comments, isLoading, submitPhoto, approvePhoto, deletePhoto, featurePhoto, likePhoto, addComment, deleteComment, approveComment, getCommentsForPhoto, getAllComments, getApprovedPhotos, getFeaturedPhotos, refetch }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider');
  return ctx;
}