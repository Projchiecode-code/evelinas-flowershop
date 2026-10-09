import { Router } from 'express';
import Notification from '../models/Notification';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { title, message, type, link, broadcast } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    const notification = new Notification({
      title,
      message,
      type: type || 'system',
      link: link || '',
      // Admins can broadcast (user: null → delivered to every customer's
      // bell); anyone else only ever notifies themselves.
      user: broadcast && req.userRole === 'admin' ? null : req.userId,
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
      // Own notifications plus shop-wide broadcasts (user: null).
      query = query.where('user').in([req.userId, null]);
    }
    const notifications = await query;
    // Broadcasts are shared: expose read state as seen by THIS viewer.
    res.json(notifications.map(doc => {
      const obj = doc.toObject();
      if (obj.user == null) obj.read = (obj.readBy || []).includes(req.userId);
      return obj;
    }));
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
    if (notification.user == null) {
      // Shared broadcast — record this viewer as read (doesn't affect others).
      await Notification.updateOne(
        { _id: notification._id },
        { $addToSet: { readBy: req.userId } }
      );
      const fresh = await Notification.findById(req.params.id);
      return res.json(fresh);
    }
    // Personal rows: customers may only touch their own; admins anything.
    if (req.userRole !== 'admin' && notification.user?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
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
    // Plus every broadcast this viewer hasn't read yet.
    await Notification.updateMany(
      { user: null, readBy: { $ne: req.userId } },
      { $addToSet: { readBy: req.userId } }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (req.userRole !== 'admin' && notification.user?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;