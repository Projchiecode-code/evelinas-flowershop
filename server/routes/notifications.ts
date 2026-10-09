import { Router } from 'express';
import Notification from '../models/Notification';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { title, message, type, link } = req.body;
    const notification = new Notification({
      title,
      message,
      type: type || 'system',
      link: link || '',
      user: req.userId,
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req: any, res) => {
  try {
    let query = Notification.find().sort({ createdAt: -1 }).limit(50);
    if (req.userRole === 'customer') {
      query = query.where('user').equals(req.userId);
    }
    const notifications = await query;
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', authenticate, async (req: any, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', authenticate, async (req: any, res) => {
  try {
    await Notification.updateMany(
      { user: req.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;