import { Router } from 'express';
import Order from '../models/Order';
import Bouquet from '../models/Bouquet';
import Notification from '../models/Notification';
import User from '../models/User';
import { authenticate } from '../middleware/auth';

const STATUS_MESSAGES: Record<string, string> = {
  'to-pay': 'Order placed — awaiting payment',
  'to-ship': 'Payment confirmed! Our florists are preparing your bouquet',
  'to-receive': 'Your bouquet is on its way!',
  'to-rate': 'Delivered successfully — enjoy your flowers!',
  'rated': 'Thank you for your feedback!',
  'cancelled': 'Order cancelled',
};

const STATUS_LOCATIONS: Record<string, string> = {
  'to-pay': 'The Flower Shop',
  'to-ship': 'The Flower Shop — Arrangement Studio',
  'to-receive': 'In Transit',
  'to-rate': 'Delivery Address',
  'rated': 'Delivery Address',
  'cancelled': 'The Flower Shop',
};

const router = Router();

/**
 * Push an in-app notification to a user's bell. `user: null` broadcasts to
 * the shop owner (admins see every notification). A failed notification must
 * never take down the order flow it accompanies.
 */
async function notify(userId: string | null, title: string, message: string, link = '') {
  try {
    await Notification.create({ user: userId, title, message, type: 'order', link });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { items, total, deliveryFee, customerName, deliveryAddress, phone, email, paymentMethod, paymentProof, estimatedDelivery } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!customerName || !email || !phone || !deliveryAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const populatedItems = await Promise.all(
      items.map(async (item: any) => {
        const bouquet = await Bouquet.findById(item.bouquet);
        if (!bouquet) throw new Error(`Bouquet not found: ${item.bouquet}`);
        return {
          bouquet: bouquet._id,
          quantity: item.quantity,
          customMessage: item.customMessage || '',
          deliveryDate: item.deliveryDate || '',
          price: bouquet.price,
        };
      })
    );

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const now = new Date();

    const order = new Order({
      _id: orderId,
      items: populatedItems,
      total,
      deliveryFee: deliveryFee || 0,
      status: 'to-pay',
      customerName,
      deliveryAddress,
      phone,
      email,
      customer: req.userId,
      paymentMethod: paymentMethod || 'cod',
      paymentProof: paymentProof || '',
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      trackingUpdates: [{
        status: 'to-pay',
        timestamp: now,
        message: STATUS_MESSAGES['to-pay'],
        location: STATUS_LOCATIONS['to-pay'],
      }],
    });

    await order.save();
    const populated = await order.populate('items.bouquet');

    // Announce the order: confirmation for the customer, an alert for each
    // shop owner. Admin alerts are targeted at admin accounts — broadcasting
    // them (user: null) would leak internal alerts into customer bells.
    const itemCount = populatedItems.reduce((sum, item) => sum + item.quantity, 0);
    await notify(
      req.userId,
      'Order placed 🌸',
      `We've received your order ${orderId} — $${Number(total).toFixed(2)}. We'll notify you as it moves along.`,
      `/order-confirmation/${orderId}`
    );
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(admins.map(admin =>
      notify(
        String(admin._id),
        'New order received 🛍️',
        `${customerName} placed order ${orderId} — $${Number(total).toFixed(2)} (${itemCount} item${itemCount === 1 ? '' : 's'}).`,
        '/admin/orders'
      )
    ));

    res.status(201).json(populated);
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

router.get('/', authenticate, async (req: any, res) => {
  try {
    let query = Order.find().sort({ createdAt: -1 });
    if (req.userRole === 'customer') {
      query = query.where('customer').equals(req.userId);
    }
    const orders = await query.populate('items.bouquet');
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.bouquet');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (req.userRole === 'customer' && order.customer?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', authenticate, async (req: any, res) => {
  try {
    // Only the shop owner moves orders through the pipeline — without this
    // any signed-in customer could cancel someone else's order.
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const previousStatus = order.status;
    order.status = status;
    order.trackingUpdates.push({
      status,
      timestamp: new Date(),
      message: STATUS_MESSAGES[status],
      location: STATUS_LOCATIONS[status],
    });
    if (status === 'rated') {
      order.rating = req.body.rating;
      order.ratingComment = req.body.comment;
    }
    await order.save();

    // Tell the customer how their order is moving — only on real changes,
    // and only for transitions they didn't trigger themselves (rating).
    if (order.customer && previousStatus !== status) {
      const id = String(order._id);
      const NOTIFY: Record<string, { title: string; text: string } | null> = {
        'to-pay': null, // initial state — already covered by "Order placed"
        'to-ship': { title: 'Payment confirmed 🌿', text: `Good news — your order ${id} is being prepared by our florists.` },
        'to-receive': { title: 'On the way 🚚', text: `Your order ${id} is out for delivery. Get your door ready!` },
        'to-rate': { title: 'Delivered 🎉', text: `Your order ${id} was delivered — we'd love to hear how it went. Rate your experience from your order history.` },
        'rated': null,
        'cancelled': { title: 'Order cancelled', text: `Your order ${id} was cancelled. Need a hand? Contact us and we'll sort it out.` },
      };
      const note = NOTIFY[status];
      if (note) await notify(order.customer.toString(), note.title, note.text, `/track?orderId=${id}`);
    }

    const populated = await order.populate('items.bouquet');
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/rate', authenticate, async (req: any, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    order.rating = rating;
    order.ratingComment = comment;
    order.status = 'rated';
    order.trackingUpdates.push({
      status: 'rated',
      timestamp: new Date(),
      message: STATUS_MESSAGES['rated'],
      location: STATUS_LOCATIONS['rated'],
    });
    await order.save();
    const populated = await order.populate('items.bouquet');
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;