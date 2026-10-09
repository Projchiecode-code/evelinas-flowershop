import mongoose from 'mongoose';

const bouquetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  occasion: [{ type: String }],
  popularity: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  flowers: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Bouquet', bouquetSchema);