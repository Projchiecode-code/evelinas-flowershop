import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Review } from '../types';
import { reviewApi } from '../api/client';
import { mockReviews } from '../data/reviews';

interface ReviewsContextType {
  reviews: Review[];
  isLoading: boolean;
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'approved'>) => Promise<void>;
  approveReview: (id: string) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  featureReview: (id: string, featured: boolean) => Promise<void>;
  getReviewsForBouquet: (bouquetId: string) => Review[];
  getApprovedReviews: () => Review[];
  refetch: () => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

// Raw Mongo docs from the API carry `_id` and ISO date strings — admin
// Reviews sorts by `createdAt.getTime()` and screens match on `id`, so
// normalise at every point a doc enters state.
function normalizeReview(raw: any): Review {
  return {
    ...raw,
    id: raw?.id || raw?._id || '',
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
  } as Review;
}

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const apiReviews = await reviewApi.getAll();
      // Combine API reviews with mock reviews
      const combinedReviews = [
        ...(Array.isArray(apiReviews) ? apiReviews : []).map(normalizeReview),
        ...mockReviews,
      ];
      setReviews(combinedReviews);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setReviews(mockReviews);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const addReview = async (data: Omit<Review, 'id' | 'createdAt' | 'approved'>) => {
    try {
      const res = await reviewApi.create(data);
      setReviews(prev => [normalizeReview(res), ...prev]);
    } catch (err) {
      console.error('Add review failed:', err);
    }
  };

  const approveReview = async (id: string) => {
    try {
      const res = await reviewApi.approve(id);
      setReviews(prev => prev.map(r => r.id === id ? normalizeReview(res) : r));
    } catch (err) {
      console.error('Approve review failed:', err);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await reviewApi.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete review failed:', err);
    }
  };

  const featureReview = async (id: string, featured: boolean) => {
    try {
      const res = await reviewApi.feature(id);
      setReviews(prev => prev.map(r => r.id === id ? normalizeReview(res) : r));
    } catch (err) {
      console.error('Feature review failed:', err);
    }
  };

  const getReviewsForBouquet = (bouquetId: string) =>
    reviews.filter(r => r.bouquetId === bouquetId && r.approved);

  const getApprovedReviews = () => reviews.filter(r => r.approved);

  const refetch = async () => {
    await fetchReviews();
  };

  return (
    <ReviewsContext.Provider value={{ reviews, isLoading, addReview, approveReview, deleteReview, featureReview, getReviewsForBouquet, getApprovedReviews, refetch }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}
