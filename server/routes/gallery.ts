import { Router } from 'express';
import GalleryPhoto from '../models/GalleryPhoto';
import GalleryLike from '../models/GalleryLike';
import GalleryComment from '../models/GalleryComment';
import { errorResponse } from '../utils/httpError';
import { authenticate, requireAdmin } from '../middleware/auth';
import { parsePage, envelope } from '../utils/pagination';

const router = Router();

// Moderation (approve/feature/delete) is admin-only — anyone could otherwise
// approve their own unapproved submission. Liking stays public for guests.
// The LIST route below is admin-only too: unapproved submissions carry the
// customer's full-size photo, which the public feed must never receive.

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { bouquetId, bouquetName, customerName, imageUrl, caption } = req.body;
    if (typeof imageUrl !== 'string' || !imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    // Uploads arrive as data URLs (images only); plain http(s) links also OK.
    // The browser compresses photos to ~1600px before sending — this cap keeps
    // one submission from approaching Mongo's 16 MB doc limit.
    if (imageUrl.length > 1_500_000
      || !(imageUrl.startsWith('data:image/') || /^https?:\/\//.test(imageUrl))) {
      return res.status(400).json({ error: 'Image must be an image file under 1.5 MB' });
    }
    const photo = new GalleryPhoto({
      bouquet: bouquetId || undefined,
      bouquetName: typeof bouquetName === 'string' ? bouquetName.slice(0, 200) : '',
      customerName: typeof customerName === 'string' && customerName ? customerName.slice(0, 120) : 'Anonymous',
      customer: req.userId,
      imageUrl,
      caption: typeof caption === 'string' ? caption.slice(0, 1000) : '',
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

// Full list (including unapproved submissions) — admin moderation only.
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { paged, page, limit, skip } = parsePage(req, 20);
    if (paged) {
      const [items, total] = await Promise.all([
        GalleryPhoto.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        GalleryPhoto.countDocuments(),
      ]);
      return res.json(envelope(items, total, page, limit));
    }
    const photos = await GalleryPhoto.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

// Get comments for a gallery photo
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await GalleryComment.find({
      photo: req.params.id,
      approved: true,
    }).sort({ createdAt: 1 });

    res.json(comments);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

// Add a comment
router.post('/:id/comments', authenticate, async (req: any, res) => {
  try {
    const { authorName, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Comment text is required',
      });
    }

    const photo = await GalleryPhoto.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({
        error: 'Photo not found',
      });
    }

    const comment = new GalleryComment({
      photo: photo._id,
      user: req.userId,
      authorName:
        typeof authorName === 'string' && authorName.trim()
          ? authorName.trim().slice(0, 120)
          : 'Anonymous',
      text: text.trim().slice(0, 1000),
      approved: true,
    });

    await comment.save();

    res.status(201).json(comment);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

// Public feed — the shop's customer photos. Paginated by the SPA (each photo
// carries its full image payload, so the feed never ships everything at once).
router.get('/approved', async (req, res) => {
  try {
    const { paged, page, limit, skip } = parsePage(req, 12, 48);
    if (paged) {
      const [items, total] = await Promise.all([
        GalleryPhoto.find({ approved: true }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        GalleryPhoto.countDocuments({ approved: true }),
      ]);
      return res.json(envelope(items, total, page, limit));
    }
    const photos = await GalleryPhoto.find({ approved: true }).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

// Curated set for the home page — small by nature (admin-featured only).
router.get('/featured', async (req, res) => {
  try {
    const { paged, page, limit, skip } = parsePage(req, 24);
    if (paged) {
      const [items, total] = await Promise.all([
        GalleryPhoto.find({ approved: true, featured: true }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        GalleryPhoto.countDocuments({ approved: true, featured: true }),
      ]);
      return res.json(envelope(items, total, page, limit));
    }
    const photos = await GalleryPhoto.find({ approved: true, featured: true }).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err: any) {
    errorResponse(res, 500, err);
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
    errorResponse(res, 500, err);
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
    errorResponse(res, 500, err);
  }
});

router.get('/:id/like', authenticate, async (req: any, res) => {
  try {
    const like = await GalleryLike.findOne({
      photo: req.params.id,
      user: req.userId,
    });

    res.json({
      liked: !!like,
    });
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.patch('/:id/like', authenticate, async (req: any, res) => {
  try {
    const photo = await GalleryPhoto.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({
        error: 'Photo not found',
      });
    }

    const existingLike = await GalleryLike.findOne({
      photo: photo._id,
      user: req.userId,
    });

    if (existingLike) {
      // Unlike
      await GalleryLike.deleteOne({
        _id: existingLike._id,
      });

      photo.likes = Math.max(0, photo.likes - 1);
    } else {
      // Like
      await GalleryLike.create({
        photo: photo._id,
        user: req.userId,
      });

      photo.likes += 1;
    }

    await photo.save();

    res.json({
      photo,
      liked: !existingLike,
    });
  } catch (err: any) {
    errorResponse(res, 500, err);
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
    errorResponse(res, 500, err);
  }
});

export default router;