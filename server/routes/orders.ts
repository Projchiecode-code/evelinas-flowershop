import { Router } from 'express';
import Order from '../models/Order';
import Bouquet from '../models/Bouquet';
import Notification from '../models/Notification';
import User from '../models/User';
import { errorResponse } from '../utils/httpError';
import { authenticate } from '../middleware/auth';

// Mirrors the status enum on the Order schema (kept as a literal union so
// assignments to `order.status` typecheck after runtime validation).
type OrderStatus = 'to-pay' | 'to-ship' | 'to-receive' | 'to-rate' | 'rated' | 'cancelled';

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
    // `total`/`deliveryFee` are deliberately NOT read from the body: money is
    // recomputed below from database prices, so a tampered client can't decide
    // what it pays (and every revenue report stays trustworthy).
    const { items, customerName, deliveryAddress, phone, email, paymentMethod, paymentProof, estimatedDelivery } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (typeof customerName !== 'string' || typeof email !== 'string'
      || typeof phone !== 'string' || typeof deliveryAddress !== 'string'
      || !customerName || !email || !phone || !deliveryAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (customerName.length > 120 || email.length > 254 || phone.length > 40 || deliveryAddress.length > 1000) {
      return res.status(400).json({ error: 'Order details are too long' });
    }
    if (paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== ''
      && !['cod', 'e-wallet', 'bank-transfer'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    if (paymentProof) {
      // Screenshots arrive as data URLs (also accept plain http(s) links).
      // The cap stops a crafted order from ballooning toward Mongo's 16 MB doc limit.
      if (typeof paymentProof !== 'string' || paymentProof.length > 8_000_000
        || !(paymentProof.startsWith('data:image/') || /^https?:\/\//.test(paymentProof))) {
        return res.status(400).json({ error: 'Payment proof must be an image under 8 MB' });
      }
    }
    if (estimatedDelivery !== undefined && estimatedDelivery !== null && estimatedDelivery !== ''
      && Number.isNaN(new Date(estimatedDelivery).getTime())) {
      return res.status(400).json({ error: 'Invalid estimated delivery date' });
    }
    for (const item of items) {
      const quantity = Number(item?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: 'Each item needs a whole quantity of at least 1' });
      }
    }

    let populatedItems: Array<{
      bouquet: any;
      quantity: number;
      customMessage: string;
      deliveryDate: string;
      price: number;
    }>;
    try {
      populatedItems = await Promise.all(
        items.map(async (item: any) => {
          const bouquet = await Bouquet.findById(item.bouquet);
          if (!bouquet) throw new Error(`Bouquet not available: ${item.bouquet}`);
          return {
            bouquet: bouquet._id,
            quantity: Number(item.quantity),
            customMessage: item.customMessage || '',
            deliveryDate: item.deliveryDate || '',
            price: bouquet.price,
          };
        })
      );
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }

    // Same rule the UI shows: free delivery when the subtotal tops $100.
    const subtotal = populatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + deliveryFee;

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
      `We've received your order ${orderId} — ₱${Number(total).toFixed(2)}. We'll notify you as it moves along.`,
      `/order-confirmation/${orderId}`
    );
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(admins.map(admin =>
      notify(
        String(admin._id),
        'New order received 🛍️',
        `${customerName} placed order ${orderId} — ₱${Number(total).toFixed(2)} (${itemCount} item${itemCount === 1 ? '' : 's'}).`,
        '/admin/orders'
      )
    ));

    res.status(201).json(populated);
  } catch (err: any) {
    errorResponse(res, 500, err);
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
    errorResponse(res, 500, err);
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
    errorResponse(res, 500, err);
  }
});

router.patch('/:id/status', authenticate, async (req: any, res) => {
  try {
    const status = req.body.status as OrderStatus;
    if (typeof status !== 'string' || !(status in STATUS_MESSAGES)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (req.userRole !== 'admin') {
      // Own order only — nobody touches anyone else's pipeline.
      if (order.customer?.toString() !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Customers may only confirm receipt, complete an unrated order, or
      // cancel — never advance the payment/delivery pipeline (self-marking
      // "to-ship" would mean free goods). Allowed "from" states mirror the
      // buttons the UI actually shows.
      const CUSTOMER_STATUS: Record<string, string[]> = {
        'to-rate': ['to-receive', 'to-rate'],
        'rated': ['to-rate', 'rated'],
        'cancelled': ['to-pay', 'to-ship'],
      };
      const allowedFrom = CUSTOMER_STATUS[status];
      if (!allowedFrom || !allowedFrom.includes(order.status)) {
        return res.status(403).json({ error: 'You cannot move this order to that status' });
      }
    }
    const previousStatus = order.status;
    order.status = status;
    order.trackingUpdates.push({
      status,
      timestamp: new Date(),
      message: STATUS_MESSAGES[status],
      location: STATUS_LOCATIONS[status],
    });
    if (status === 'rated' && req.body.rating !== undefined && req.body.rating !== null) {
      const rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      order.rating = rating;
      if (typeof req.body.comment === 'string') {
        order.ratingComment = req.body.comment.slice(0, 1000);
      }
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
    errorResponse(res, 500, err);
  }
});

router.patch('/:id/rate', authenticate, async (req: any, res) => {
  try {
    const { rating, comment } = req.body;
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    // Only the order's owner (or an admin) may rate it — otherwise any
    // signed-in user could stamp ratings and status 'rated' on anyone's order.
    if (req.userRole !== 'admin' && order.customer?.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    order.rating = numericRating;
    order.ratingComment = typeof comment === 'string' ? comment.slice(0, 1000) : '';
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
    errorResponse(res, 500, err);
  }
});

export default router;