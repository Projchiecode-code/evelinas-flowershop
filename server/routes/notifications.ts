import { Router } from 'express';
import Notification from '../models/Notification';
import { errorResponse } from '../utils/httpError';
import { authenticate } from '../middleware/auth';
import { parsePage, envelope } from '../utils/pagination';

const router = Router();

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { title, message, type, link, broadcast } = req.body;
    if (typeof title !== 'string' || typeof message !== 'string' || !title.trim() || !message.trim()) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    if (title.length > 300 || message.length > 3000) {
      return res.status(400).json({ error: 'Title (max 300) or message (max 3000) is too long' });
    }
    // The bell renders `link` straight into an <a href> — anything but a
    // relative app path (javascript:, data:) would run on click.
    if (link !== undefined && link !== null && link !== ''
      && (typeof link !== 'string' || link.length > 500 || !link.startsWith('/'))) {
      return res.status(400).json({ error: 'Link must be a relative app path (starting with /)' });
    }
    const notification = new Notification({
      title,
      message,
      type: typeof type === 'string' && type ? type.slice(0, 50) : 'system',
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

// Broadcasts are shared: expose read state as seen by THIS viewer.
const shapeForViewer = (req: any) => (doc: any) => {
  const obj = doc.toObject();
  if (obj.user == null) obj.read = (obj.readBy || []).includes(req.userId);
  return obj;
};

router.get('/', authenticate, async (req: any, res) => {
  try {
    const filter: any = {};
    if (req.userRole === 'customer') {
      // Own notifications plus shop-wide broadcasts (user: null).
      filter.$or = [{ user: req.userId }, { user: null }];
    }
    const { paged, page, limit, skip } = parsePage(req, 50);
    let query = Notification.find(filter).sort({ createdAt: -1 });
    if (paged) {
      const [items, total] = await Promise.all([
        query.skip(skip).limit(limit),
        Notification.countDocuments(filter),
      ]);
      return res.json(envelope(items.map(shapeForViewer(req)), total, page, limit));
    }
    const notifications = await query.limit(50);
    // Broadcasts are shared: expose read state as seen by THIS viewer.
    res.json(notifications.map(shapeForViewer(req)));
  } catch (err: any) {
    errorResponse(res, 500, err);
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
    errorResponse(res, 500, err);
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
    errorResponse(res, 500, err);
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
    errorResponse(res, 500, err);
  }
});

export default router;