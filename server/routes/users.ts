import { Router } from 'express';
import User from '../models/User';
import { errorResponse } from '../utils/httpError';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Self-service profile edit — the whitelisted route the admin-only comment
// below anticipated. Any signed-in user updates their OWN contact details;
// `role`, `isActive` and `email` are deliberately absent from the whitelist,
// so this can never be used to self-promote to admin or swap accounts.
// Registered before PATCH /:id so "me" is never treated as an id.
router.patch('/me', authenticate, async (req: any, res) => {
  try {
    const { name, phone, address, city, zipCode } = req.body;
    const update: Record<string, string> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
        return res.status(400).json({ error: 'Name must be 1-120 characters' });
      }
      update.name = name.trim();
    }
    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.length > 40) {
        return res.status(400).json({ error: 'Phone must be at most 40 characters' });
      }
      update.phone = phone;
    }
    if (address !== undefined) {
      if (typeof address !== 'string' || address.length > 300) {
        return res.status(400).json({ error: 'Address must be at most 300 characters' });
      }
      update.address = address;
    }
    if (city !== undefined) {
      if (typeof city !== 'string' || city.length > 120) {
        return res.status(400).json({ error: 'City must be at most 120 characters' });
      }
      update.city = city;
    }
    if (zipCode !== undefined) {
      if (typeof zipCode !== 'string' || zipCode.length > 20) {
        return res.status(400).json({ error: 'ZIP code must be at most 20 characters' });
      }
      update.zipCode = zipCode;
    }

    const user = Object.keys(update).length
      ? await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true }).select('-password')
      : await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Same shape as GET /auth/me so the client can swap it into its session.
    res.json(user);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

// Every route here exposes user PII or account control — admin only. (No
// customer-facing code calls /users apart from the self-edit route above.)
router.get('/', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.patch('/:id', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { role, isActive, name, email, phone, address, city, zipCode } = req.body;
    const update: any = {};
    if (role !== undefined) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (city !== undefined) update.city = city;
    if (zipCode !== undefined) update.zipCode = zipCode;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

export default router;