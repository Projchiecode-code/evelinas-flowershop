import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Review } from '../types';
import { mockReviews } from '../data/reviews';

interface ReviewsContextType {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'approved'>) => void;
  approveReview: (id: string) => void;
  deleteReview: (id: string) => void;
  featureReview: (id: string, featured: boolean) => void;
  getReviewsForBouquet: (bouquetId: string) => Review[];
  getApprovedReviews: () => Review[];
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);

  const addReview = (data: Omit<Review, 'id' | 'createdAt' | 'approved'>) => {
    const newReview: Review = { ...data, id: `r-${Date.now()}`, createdAt: new Date(), approved: false };
    setReviews(prev => [newReview, ...prev]);
  };

  const approveReview = (id: string) =>
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: !r.approved } : r));

  const deleteReview = (id: string) =>
    setReviews(prev => prev.filter(r => r.id !== id));

  const featureReview = (id: string, featured: boolean) =>
    setReviews(prev => prev.map(r => r.id === id ? { ...r, featured } : r));

  const getReviewsForBouquet = (bouquetId: string) =>
    reviews.filter(r => r.bouquetId === bouquetId && r.approved);

  const getApprovedReviews = () => reviews.filter(r => r.approved);

  return (
    <ReviewsContext.Provider value={{ reviews, addReview, approveReview, deleteReview, featureReview, getReviewsForBouquet, getApprovedReviews }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}
