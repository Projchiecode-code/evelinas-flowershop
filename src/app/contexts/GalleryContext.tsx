import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GalleryPhoto, GalleryComment } from '../types';
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
  submitPhoto: (photo: Omit<GalleryPhoto, 'id' | 'createdAt' | 'approved' | 'featured' | 'likes'>) => void;
  approvePhoto: (id: string) => void;
  deletePhoto: (id: string) => void;
  featurePhoto: (id: string, featured: boolean) => void;
  likePhoto: (id: string) => void;
  addComment: (photoId: string, authorName: string, text: string) => void;
  deleteComment: (id: string) => void;
  approveComment: (id: string) => void;
  getCommentsForPhoto: (photoId: string) => GalleryComment[];
  getAllComments: () => GalleryComment[];
  getApprovedPhotos: () => GalleryPhoto[];
  getFeaturedPhotos: () => GalleryPhoto[];
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(mockGallery);
  const [comments, setComments] = useState<GalleryComment[]>(INITIAL_COMMENTS);

  const submitPhoto = (data: Omit<GalleryPhoto, 'id' | 'createdAt' | 'approved' | 'featured' | 'likes'>) => {
    setPhotos(prev => [{ ...data, id: `g-${Date.now()}`, createdAt: new Date(), approved: false, featured: false, likes: 0 }, ...prev]);
  };

  const approvePhoto = (id: string) =>
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, approved: !p.approved } : p));

  const deletePhoto = (id: string) => setPhotos(prev => prev.filter(p => p.id !== id));

  const featurePhoto = (id: string, featured: boolean) =>
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, featured } : p));

  const likePhoto = (id: string) =>
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));

  const addComment = (photoId: string, authorName: string, text: string) => {
    const newComment: GalleryComment = {
      id: `c-${Date.now()}`, photoId, authorName: authorName.trim() || 'Anonymous',
      text, createdAt: new Date(), approved: true,
    };
    setComments(prev => [...prev, newComment]);
  };

  const deleteComment = (id: string) => setComments(prev => prev.filter(c => c.id !== id));

  const approveComment = (id: string) =>
    setComments(prev => prev.map(c => c.id === id ? { ...c, approved: !c.approved } : c));

  const getCommentsForPhoto = (photoId: string) =>
    comments.filter(c => c.photoId === photoId && c.approved);

  const getAllComments = () => comments;

  const getApprovedPhotos = () => photos.filter(p => p.approved);
  const getFeaturedPhotos = () => photos.filter(p => p.approved && p.featured);

  return (
    <GalleryContext.Provider value={{ photos, comments, submitPhoto, approvePhoto, deletePhoto, featurePhoto, likePhoto, addComment, deleteComment, approveComment, getCommentsForPhoto, getAllComments, getApprovedPhotos, getFeaturedPhotos }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider');
  return ctx;
}
