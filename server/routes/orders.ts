import { Router } from 'express';
import Order from '../models/Order';
import Bouquet from '../models/Bouquet';
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
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
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