import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { GalleryPhoto, GalleryComment } from '../types';
import { galleryApi } from '../api/client';
import { mockGallery } from '../data/gallery';
import { useAuth } from './AuthContext';

// One page of the feed. Every photo carries its own image payload (data URL),
// so the gallery never ships its whole contents at once — the SPA asks for
// pages and appends with "Load more".
const PAGE_SIZE = 12;

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
  
  likedPhotos: Record<string, boolean>;
  
  isLoading: boolean;
  /** Server-side count of real photos (demo posts excluded), all pages. */
  totalPosts: number;
  /** Whether older photos exist beyond the pages already loaded. */
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
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

// The API returns raw Mongo docs: `_id` and ISO date strings. Gallery screens
// read `id` and call `.getTime()` on `createdAt` (sorting, timeAgo), so every
// doc is normalised the moment it enters state — both on fetch and in the
// single-item responses that submit/approve/feature/like merge back in.
function normalizePhoto(raw: any): GalleryPhoto {
  return {
    ...raw,
    id: raw?.id || raw?._id || '',
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
  } as GalleryPhoto;
}

interface GalleryPage {
  items?: any[];
  total?: number;
  page?: number;
  pages?: number;
}

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [featuredPhotos, setFeaturedPhotos] = useState<GalleryPhoto[]>([]);
  const [comments, setComments] = useState<GalleryComment[]>(INITIAL_COMMENTS);

  const fetchComments = async (items: GalleryPhoto[]) => {
  try {
    const realComments: GalleryComment[] = [];

    await Promise.all(
      items.map(async (photo) => {
        // Only real MongoDB photos should call the API.
        if (photo.id.startsWith('g')) return;

        try {
          const response = await galleryApi.getComments(photo.id);

          const photoComments = Array.isArray(response)
            ? response
            : response?.comments || [];

          realComments.push(
            ...photoComments.map((comment: any) => ({
              ...comment,
              id: comment.id || comment._id,
              photoId: comment.photoId || comment.photo,
              createdAt: comment.createdAt
                ? new Date(comment.createdAt)
                : new Date(),
              approved: comment.approved !== false,
            }))
          );
        } catch (err) {
          console.error(
            `Failed to fetch comments for photo ${photo.id}:`,
            err
          );
        }
      })
    );

    setComments(prev => {
      // Keep demo comments for demo photos.
      const mockPhotoIds = new Set(
        mockGallery.map(photo => photo.id)
      );

      const mockComments = prev.filter(comment =>
        mockPhotoIds.has(comment.photoId)
      );

      return [...mockComments, ...realComments];
    });
  } catch (err) {
    console.error('Failed to fetch gallery comments:', err);
  }
};

  const [isLoading, setIsLoading] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { user } = useAuth();

  const [likedPhotos, setLikedPhotos] = useState<Record<string, boolean>>({});

  const role = user?.role;
  // Which endpoint the currently loaded pages came from (admin sees pending
  // submissions too; guests and customers only see approved photos).
  const endpointRef = useRef('/gallery/approved');
  const loadedRef = useRef(false);

  const mockFeatured = () => mockGallery.filter(p => p.approved && p.featured);

  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const base = role === 'admin' ? '/gallery' : '/gallery/approved';
      endpointRef.current = base;
      const first = (await galleryApi.getPage(base, 1, PAGE_SIZE)) as GalleryPage;
      const items = (Array.isArray(first?.items) ? first!.items : []).map(normalizePhoto);
      // Demo posts ride along with the public first page only (they never
      // paginate) — the admin moderation list shows real submissions, whose
      // ids actually resolve against the API.
      
      const loadedPhotos =
        role === 'admin' ? items : [...items, ...mockGallery];

      setPhotos(loadedPhotos);

      await fetchLikeStatuses(items);
      await fetchComments(items);
      
      setTotalPosts(Number(first?.total) || 0);
      setPage(1);
      setHasMore(Number(first?.page || 1) < Number(first?.pages || 1));
      loadedRef.current = true;

      // Featured is fetched separately so the home page's section never depends
      // on which feed page happens to be loaded (featured posts are often old).
      try {
        const feat = (await galleryApi.getFeatured()) as any[];
        setFeaturedPhotos([
          ...(Array.isArray(feat) ? feat : []).map(normalizePhoto),
          ...mockFeatured(),
        ]);
      } catch {
        setFeaturedPhotos([...items.filter(p => p.approved && p.featured), ...mockFeatured()]);
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
      setPhotos(role === 'admin' ? [] : mockGallery);
      setFeaturedPhotos(mockFeatured());
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLikeStatuses = async (items: GalleryPhoto[]) => {
    if (!user) {
      setLikedPhotos({});
      return;
    }

    try {
      const statuses: Record<string, boolean> = {};

      await Promise.all(
        items.map(async (photo) => {
          try {
            const response = (await galleryApi.getLikeStatus(photo.id)) as { liked: boolean };
            statuses[photo.id] = response.liked;
          } catch {
            statuses[photo.id] = false;
          }
        })
      );

      setLikedPhotos(statuses);
    } catch (err) {
      console.error('Failed to fetch like statuses:', err);
    }
  };

  useEffect(() => {
    const base = role === 'admin' ? '/gallery' : '/gallery/approved';
    // Skip the redundant fetch when the endpoint can't have changed (a
    // customer session resolving after the guest load) — but never skip the
    // first one, and always refetch when admin rights appear or disappear.
    if (loadedRef.current && base === endpointRef.current) return;
    fetchGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const next = page + 1;
      const res = (await galleryApi.getPage(endpointRef.current, next, PAGE_SIZE)) as GalleryPage;
      const items = (Array.isArray(res?.items) ? res!.items : []).map(normalizePhoto);
      setPhotos(prev => {
        const seen = new Set(prev.map(p => p.id));
        return [...prev, ...items.filter(p => !seen.has(p.id))];
      });
      setPage(Number(res?.page) || next);
      setHasMore(Number(res?.page || next) < Number(res?.pages || next));
    } catch (err) {
      console.error('Failed to load more gallery photos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const submitPhoto = async (data: Omit<GalleryPhoto, 'id' | 'createdAt' | 'approved' | 'featured' | 'likes'>) => {
    try {
      const res = await galleryApi.submit(data);
      setPhotos(prev => [normalizePhoto(res), ...prev]);
      // New submissions start unapproved: the admin total counts everything,
      // the public (approved-only) total doesn't move until moderation.
      if (role === 'admin') setTotalPosts(t => t + 1);
    } catch (err) {
      console.error('Submit photo failed:', err);
    }
  };

  const approvePhoto = async (id: string) => {
    try {
      const res = await galleryApi.approve(id);
      setPhotos(prev => prev.map(p => p.id === id ? normalizePhoto(res) : p));
    } catch (err) {
      console.error('Approve photo failed:', err);
    }
  };

  const deletePhoto = async (id: string) => {
    try {
      await galleryApi.delete(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
      setTotalPosts(t => Math.max(0, t - 1));
    } catch (err) {
      console.error('Delete photo failed:', err);
    }
  };

  const featurePhoto = async (id: string, featured: boolean) => {
    try {
      const res = await galleryApi.feature(id);
      setPhotos(prev => prev.map(p => p.id === id ? normalizePhoto(res) : p));
      // Keep the home page's featured strip in sync with moderation toggles.
      setFeaturedPhotos(prev => {
        const next = prev.filter(p => p.id !== id);
        if (featured) {
          const promoted = photos.find(p => p.id === id);
          if (promoted) next.unshift(normalizePhoto({ ...promoted, featured: true }));
        }
        return next;
      });
    } catch (err) {
      console.error('Feature photo failed:', err);
    }
  };

    const likePhoto = async (photoId: string): Promise<void> => {
    try {
      // Mock/demo photos don't exist in MongoDB
      if (photoId.startsWith('g')) {
        setPhotos(prev =>
          prev.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  likes: Math.max(0, photo.likes + (likedPhotos[photoId] ? -1 : 1)),
                }
              : photo
          )
        );

        setLikedPhotos(prev => ({
          ...prev,
          [photoId]: !prev[photoId],
        }));

        return;
      }

      const response = (await galleryApi.like(photoId)) as {
        photo: unknown;
        liked: boolean;
      };

      const updatedPhoto = normalizePhoto(response.photo);

      setPhotos(prev =>
        prev.map(photo =>
          photo.id === photoId
            ? updatedPhoto
            : photo
        )
      );

      setLikedPhotos(prev => ({
        ...prev,
        [photoId]: response.liked,
      }));

      setFeaturedPhotos(prev =>
        prev.map(photo =>
          photo.id === photoId
            ? updatedPhoto
            : photo
        )
      );

    } catch (err) {
      console.error('Like/unlike failed:', err);
    }
  };

  const addComment = async (
    photoId: string,
    authorName: string,
    text: string
  ) => {
    try {
      // Mock/demo posts don't exist in MongoDB
      if (photoId.startsWith('g')) {
        const newComment: GalleryComment = {
          id: `c-${Date.now()}`,
          photoId,
          authorName: authorName.trim() || 'Anonymous',
          text: text.trim(),
          createdAt: new Date(),
          approved: true,
        };

        setComments(prev => [...prev, newComment]);
        return;
      }

      const response = await galleryApi.addComment(
        photoId,
        authorName,
        text
      );

      const newComment: GalleryComment = {
        ...response,
        id: response.id || response._id,
        photoId: response.photoId || response.photo,
        createdAt: response.createdAt
          ? new Date(response.createdAt)
          : new Date(),
      };

      setComments(prev => [...prev, newComment]);
    } catch (err) {
      console.error('Add comment failed:', err);
    }
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

  const getFeaturedPhotos = () => featuredPhotos;

  const refetch = async () => {
    await fetchGallery();
  };

  return (
    <GalleryContext.Provider value={{
      photos, comments, likedPhotos, isLoading, totalPosts, hasMore, isLoadingMore, loadMore,
      submitPhoto, approvePhoto, deletePhoto, featurePhoto, likePhoto,
      addComment, deleteComment, approveComment, getCommentsForPhoto,
      getAllComments, getApprovedPhotos, getFeaturedPhotos, refetch,
    }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within a GalleryProvider');
  return ctx;
}
