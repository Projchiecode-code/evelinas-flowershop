import { Router } from 'express';
import Review from '../models/Review';
import { errorResponse } from '../utils/httpError';
import { authenticate, requireAdmin } from '../middleware/auth';
import { parsePage, envelope } from '../utils/pagination';

const router = Router();

// Moderation (approve/feature/delete) is admin-only — otherwise the author of
// an unapproved review could approve and feature it themselves.

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { bouquetId, orderId, rating, comment, photos } = req.body;
    if (!bouquetId || !comment) {
      return res.status(400).json({ error: 'Bouquet ID, rating, and comment are required' });
    }
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (typeof comment !== 'string' || !comment.trim() || comment.length > 5000) {
      return res.status(400).json({ error: 'Review must be 1–5000 characters' });
    }
    // Photo attachments: images only, bounded per photo and in count so one
    // review can't approach Mongo's 16 MB document limit.
    if (photos !== undefined && photos !== null) {
      if (!Array.isArray(photos) || photos.length > 5) {
        return res.status(400).json({ error: 'You can attach up to 5 photos' });
      }
      for (const photo of photos) {
        // Browser-side compression keeps real uploads far under this — the cap
        // is the backstop that keeps one review away from Mongo's 16 MB doc limit.
        if (typeof photo !== 'string' || photo.length > 1_500_000 || !photo.startsWith('data:image/')) {
          return res.status(400).json({ error: 'Each photo must be an image under 1.5 MB' });
        }
      }
    }
    const review = new Review({
      bouquet: bouquetId,
      orderId: typeof orderId === 'string' ? orderId.slice(0, 60) : undefined,
      customerName: typeof req.body.customerName === 'string' && req.body.customerName
        ? req.body.customerName.slice(0, 120) : 'Anonymous',
      customerEmail: typeof req.body.customerEmail === 'string' ? req.body.customerEmail.slice(0, 254) : '',
      customer: req.userId,
      rating: numericRating,
      comment,
      photos: photos || [],
      approved: false,
      featured: false,
    });
    await review.save();
    res.status(201).json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { paged, page, limit, skip } = parsePage(req, 20);
    if (paged) {
      const [items, total] = await Promise.all([
        Review.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        Review.countDocuments(),
      ]);
      return res.json(envelope(items, total, page, limit));
    }
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.get('/:bouquetId', async (req, res) => {
  try {
    const reviews = await Review.find({ bouquet: req.params.bouquetId, approved: true }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.patch('/:id/approve', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    review.approved = !review.approved;
    await review.save();
    res.json(review);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.patch('/:id/feature', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    review.featured = !review.featured;
    await review.save();
    res.json(review);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

export default router;