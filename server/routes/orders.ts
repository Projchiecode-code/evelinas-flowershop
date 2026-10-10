import { Router } from 'express';
import Order from '../models/Order';
import Bouquet from '../models/Bouquet';
import Notification from '../models/Notification';
import User from '../models/User';
import { errorResponse } from '../utils/httpError';
import { authenticate } from '../middleware/auth';
import { parsePage, envelope } from '../utils/pagination';
import { LOW_STOCK_THRESHOLD, maybeAlertLowStock } from '../utils/lowStock';

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
      // The cap stops a crafted order from ballooning toward Mongo's 16 MB doc
      // limit — the browser compresses uploads to ~1.5 MB well before this.
      if (typeof paymentProof !== 'string' || paymentProof.length > 1_500_000
        || !(paymentProof.startsWith('data:image/') || /^https?:\/\//.test(paymentProof))) {
        return res.status(400).json({ error: 'Payment proof must be an image under 1.5 MB' });
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

    // Reserve stock atomically: each decrement only succeeds if enough units
    // remain (`$gte` inside the same update), so two concurrent checkouts can
    // never both take the last bouquet. Any failure rolls back the units
    // already taken — the reservation is all-or-nothing per order.
    type Reserved = { id: any; qty: number };
    const restock = async (list: Reserved[]) => {
      try {
        await Promise.all(list.map(r => Bouquet.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
      } catch (err) {
        // Loud: units would otherwise be lost from the catalog.
        console.error('Stock rollback failed:', err);
      }
    };
    const reserved: Reserved[] = [];
    // Phase 5: remember threshold crossings so the admin bell can be alerted
    // once — and only once — this order is actually committed.
    const lowStockCrossings: Array<{ id: any; name: string; prev: number; next: number }> = [];
    for (const item of populatedItems) {
      const updated = await Bouquet.findOneAndUpdate(
        { _id: item.bouquet, inStock: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );
      if (!updated) {
        await restock(reserved);
        const missing = await Bouquet.findById(item.bouquet).select('name');
        const label = missing ? `"${missing.name}"` : 'an item in your cart';
        return res.status(409).json({
          error: `Not enough stock for ${label} — try a smaller quantity or remove it from your cart.`,
        });
      }
      reserved.push({ id: item.bouquet, qty: item.quantity });
      // `updated` is the pre-decrement document — the exact crossing maths.
      const prev = updated.stock;
      const next = prev - item.quantity;
      if (prev > LOW_STOCK_THRESHOLD && next <= LOW_STOCK_THRESHOLD) {
        const doc = await Bouquet.findById(item.bouquet).select('name');
        lowStockCrossings.push({ id: item.bouquet, name: doc?.name || 'A bouquet', prev, next });
      }
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const now = new Date();

    const order = new Order({
      _id: orderId,
      items: populatedItems,
      total,
      deliveryFee: deliveryFee || 0,
      status: 'to-pay',
      stockReserved: reserved.length > 0,
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

    try {
      await order.save();
    } catch (err) {
      // The order never existed — give the reserved units back.
      await restock(reserved);
      throw err;
    }
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

    // Inventory monitoring: alert only after the order is committed (a failed
    // save above restocks instead, so those units never really left).
    for (const c of lowStockCrossings) {
      await maybeAlertLowStock(c.id, c.name, c.prev, c.next, `order ${orderId}`);
    }

    res.status(201).json(populated);
  } catch (err: any) {
    errorResponse(res, 500, err);
  }
});

router.get('/', authenticate, async (req: any, res) => {
  try {
    const filter: any = {};
    if (req.userRole === 'customer') filter.customer = req.userId;

    const { paged, page, limit, skip } = parsePage(req, 50);
    if (paged) {
      // Opt-in pagination (?page=…) — the SPA keeps its full list, API clients
      // that need pages get an envelope.
      const [items, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('items.bouquet'),
        Order.countDocuments(filter),
      ]);
      return res.json(envelope(items, total, page, limit));
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('items.bouquet');
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

    // Stock follows cancellations. Entering 'cancelled' hands back the units
    // this order currently holds; leaving 'cancelled' takes them again — but
    // only if this order ever reserved any (pre-stock-tracking orders never
    // took units, so cancelling them must not mint phantom stock).
    // Phase 5: reactivations can also cross the low-stock threshold.
    const reactivatedCrossings: Array<{ id: any; name: string; prev: number; next: number }> = [];
    if (status === 'cancelled' && previousStatus !== 'cancelled' && order.stockReserved) {
      try {
        for (const item of order.items) {
          await Bouquet.updateOne({ _id: item.bouquet }, { $inc: { stock: item.quantity } });
        }
      } catch (err) {
        console.error('Restock on cancel failed:', err);
      }
      order.stockReserved = false;
    } else if (previousStatus === 'cancelled' && status !== 'cancelled' && !order.stockReserved) {
      // Back into the active pipeline — reserve all-or-nothing.
      const taken: Array<{ id: any; qty: number }> = [];
      let blockedItem: { id: any; qty: number } | null = null;
      for (const item of order.items) {
        const id = (item as any).bouquet;
        const qty = item.quantity;
        const ok = await Bouquet.findOneAndUpdate(
          { _id: id, inStock: true, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
        );
        if (!ok) { blockedItem = { id, qty }; break; }
        taken.push({ id, qty });
        const prev = ok.stock;
        const next = prev - qty;
        if (prev > LOW_STOCK_THRESHOLD && next <= LOW_STOCK_THRESHOLD) {
          const doc = await Bouquet.findById(id).select('name');
          reactivatedCrossings.push({ id, name: doc?.name || 'A bouquet', prev, next });
        }
      }
      if (blockedItem) {
        for (const t of taken) {
          await Bouquet.updateOne({ _id: t.id }, { $inc: { stock: t.qty } });
        }
        const missing = await Bouquet.findById(blockedItem.id).select('name');
        const label = missing ? `"${missing.name}"` : 'an item on this order';
        return res.status(409).json({ error: `Cannot reactivate — not enough stock for ${label}.` });
      }
      order.stockReserved = taken.length > 0;
    }

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

    // Inventory monitoring — same crossing rule as checkout, after commit.
    for (const c of reactivatedCrossings) {
      await maybeAlertLowStock(c.id, c.name, c.prev, c.next, `order ${order._id} reactivation`);
    }

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
    // Rating flips status to 'rated' outside the /status route's stock logic —
    // a cancelled order must not silently jump back into the pipeline.
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Cancelled orders cannot be rated' });
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