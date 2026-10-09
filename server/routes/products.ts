import { Router } from 'express';
import Bouquet from '../models/Bouquet';
import { bouquets } from '../../src/app/data/bouquets';

const router = Router();

// Seed products from existing data (one-time)
router.post('/seed', async (_req, res) => {
  try {
    const existing = await Bouquet.countDocuments();
    if (existing > 0) {
      return res.json({ message: 'Products already seeded', count: existing });
    }
    const created = await Bouquet.insertMany(bouquets);
    res.json({ message: 'Products seeded', count: created.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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
    const products = await Bouquet.find(filter).sort({ popularity: -1 });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = new Bouquet(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Bouquet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Bouquet.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;