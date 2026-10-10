import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  bouquet: { type: mongoose.Schema.Types.ObjectId, ref: 'Bouquet' },
  bouquetName: { type: String, default: '' },
  customerName: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: { type: String, required: true },
  caption: { type: String, default: '' },
  approved: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Public feed = approved + newest; admin feed = newest (pagination scans in order).
gallerySchema.index({ approved: 1, createdAt: -1 });
gallerySchema.index({ createdAt: -1 });

export default mongoose.model('GalleryPhoto', gallerySchema);