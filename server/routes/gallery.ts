import { Router } from 'express';
import GalleryPhoto from '../models/GalleryPhoto';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Moderation (approve/feature/delete) is admin-only — anyone could otherwise
// approve their own unapproved submission. Liking stays public for guests.

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { bouquetId, bouquetName, customerName, imageUrl, caption } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    const photo = new GalleryPhoto({
      bouquet: bouquetId || undefined,
      bouquetName: bouquetName || '',
      customerName: customerName || 'Anonymous',
      customer: req.userId,
      imageUrl,
      caption: caption || '',
      approved: false,
      featured: false,
      likes: 0,
    });
    await photo.save();
    res.status(201).json(photo);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const photos = await GalleryPhoto.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/approved', async (_req, res) => {
  try {
    const photos = await GalleryPhoto.find({ approved: true }).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/featured', async (_req, res) => {
  try {
    const photos = await GalleryPhoto.find({ approved: true, featured: true }).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/approve', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const photo = await GalleryPhoto.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    photo.approved = !photo.approved;
    await photo.save();
    res.json(photo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/feature', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const photo = await GalleryPhoto.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    photo.featured = !photo.featured;
    await photo.save();
    res.json(photo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/like', async (req, res) => {
  try {
    const photo = await GalleryPhoto.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    photo.likes += 1;
    await photo.save();
    res.json(photo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const photo = await GalleryPhoto.findByIdAndDelete(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;