import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  bouquet: { type: mongoose.Schema.Types.ObjectId, ref: 'Bouquet', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  photos: [{ type: String }],
  approved: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Product page loads "approved reviews for this bouquet"; the admin feed is newest first.
reviewSchema.index({ bouquet: 1, approved: 1 });
reviewSchema.index({ createdAt: -1 });

export default mongoose.model('Review', reviewSchema);