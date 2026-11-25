import { Router } from 'express';
import Bouquet from '../models/Bouquet';
import { errorResponse } from '../utils/httpError';
import { bouquets } from '../../src/app/data/bouquets';
import { authenticate, requireAdmin } from '../middleware/auth';
import { parsePage, envelope } from '../utils/pagination';

const MAX_IMAGE_LENGTH = 2_000_000;

function isValidProductImage(image: unknown): boolean {
  if (typeof image !== 'string' || !image) {
    return false;
  }

  if (image.length > MAX_IMAGE_LENGTH) {
    return false;
  }

  // Accept compressed JPEG Base64 images from the uploader.
  if (image.startsWith('data:image/jpeg;base64,')) {
    return /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image);
  }

  // Preserve compatibility with existing hosted product images.
  try {
    const url = new URL(image);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

const router = Router();

// Seed products from existing data (one-time) - supports both GET and POST for easy browser access
const seedProducts = async (_req: any, res: any) => {
  try {
    const existing = await Bouquet.countDocuments();
    if (existing > 0) {
      return res.json({ message: 'Products already seeded', count: existing });
    }
    const created = await Bouquet.insertMany(bouquets);
    res.json({ message: 'Products seeded', count: created.length });
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
};

// Seeding writes to the live catalog — admin only.
router.get('/seed', authenticate, requireAdmin, seedProducts);
router.post('/seed', authenticate, requireAdmin, seedProducts);

router.get('/', async (req, res) => {
  try {
    const { category, occasion, search, inStock } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (occasion) filter.occasion = occasion;
    if (inStock === 'true') filter.inStock = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const { paged, page, limit, skip } = parsePage(req, 50);
    if (paged) {
      // Opt-in pagination (?page=…) — envelope instead of the full list.
      const [items, total] = await Promise.all([
        Bouquet.find(filter).sort({ popularity: -1 }).skip(skip).limit(limit),
        Bouquet.countDocuments(filter),
      ]);
      return res.json(envelope(items, total, page, limit));
    }
    const products = await Bouquet.find(filter).sort({ popularity: -1 });
    res.json(products);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Bouquet.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    if (!isValidProductImage(req.body.image)) {
      return res.status(400).json({
        error: 'A valid product image is required. Maximum image size exceeded or invalid format.',
      });
    }
    // Whitelist — only schema fields are accepted, so a crafted body can't
    // smuggle in _id/createdAt or anything the model doesn't own.
    const { name, description, price, image, category, occasion, popularity, inStock, stock, flowers } = req.body;
    const product = new Bouquet({ name, description, price, image, category, occasion, popularity, inStock, stock, flowers });
    await product.save();
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (
      req.body.image !== undefined &&
      !isValidProductImage(req.body.image)
    ) {
      return res.status(400).json({
        error: 'Invalid product image or image size exceeded.',
      });
    }
    // Same whitelist as POST; runValidators applies schema bounds to updates
    // too (findByIdAndUpdate skips validators by default).
    const update: Record<string, any> = {};
    for (const key of ['name', 'description', 'price', 'image', 'category', 'occasion', 'popularity', 'inStock', 'stock', 'flowers']) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const product = await Bouquet.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await Bouquet.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

export default router;