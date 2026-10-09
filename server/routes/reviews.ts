import { Router } from 'express';
import Review from '../models/Review';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { bouquetId, orderId, rating, comment, photos } = req.body;
    if (!bouquetId || !rating || !comment) {
      return res.status(400).json({ error: 'Bouquet ID, rating, and comment are required' });
    }
    const review = new Review({
      bouquet: bouquetId,
      orderId,
      customerName: req.body.customerName || 'Anonymous',
      customerEmail: req.body.customerEmail || '',
      customer: req.userId,
      rating,
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

router.get('/', async (_req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:bouquetId', async (req, res) => {
  try {
    const reviews = await Review.find({ bouquet: req.params.bouquetId, approved: true }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/approve', authenticate, async (req: any, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    review.approved = !review.approved;
    await review.save();
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/feature', authenticate, async (req: any, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    review.featured = !review.featured;
    await review.save();
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;