import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  items: [{
    bouquet: { type: mongoose.Schema.Types.ObjectId, ref: 'Bouquet', required: true },
    quantity: { type: Number, required: true, min: 1 },
    customMessage: { type: String, default: '' },
    deliveryDate: { type: String, default: '' },
    price: { type: Number, required: true },
  }],
  total: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['to-pay', 'to-ship', 'to-receive', 'to-rate', 'rated', 'cancelled'],
    default: 'to-pay',
  },
  customerName: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String, enum: ['cod', 'e-wallet', 'bank-transfer'], default: 'cod' },
  paymentProof: { type: String, default: '' },
  estimatedDelivery: { type: Date },
  trackingUpdates: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    message: { type: String },
    location: { type: String },
  }],
  rating: { type: Number, min: 1, max: 5 },
  ratingComment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);