import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'review', 'promo', 'system'], default: 'system' },
  read: { type: Boolean, default: false },
  // Broadcasts (user: null) are one shared document — per-viewer read state
  // lives here so one customer reading a promo doesn't clear everyone's badge.
  readBy: { type: [String], default: [] },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);