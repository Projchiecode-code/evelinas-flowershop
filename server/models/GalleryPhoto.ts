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

export default mongoose.model('GalleryPhoto', gallerySchema);