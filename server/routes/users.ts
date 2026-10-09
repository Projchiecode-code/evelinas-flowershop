import { Router } from 'express';
import User from '../models/User';
import { errorResponse } from '../utils/httpError';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Every route here exposes user PII or account control — admin only. (No
// customer-facing code calls /users; profile self-edit, if ever added, gets
// its own whitelisted route so `role`/`isActive` can never be self-assigned.)
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