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
  // Sellable units. Checkout decrements atomically and cancels restock, so
  // overselling two customers out of the same last bouquet is impossible.
  // `inStock` stays a manual admin toggle; availability = inStock && stock > 0.
  stock: {
    type: Number,
    default: 10,
    min: 0,
    validate: { validator: (v: number) => Number.isInteger(v), message: 'Stock must be a whole number' },
  },
  flowers: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// The storefront sorts by popularity and filters by category on every visit.
bouquetSchema.index({ popularity: -1 });
bouquetSchema.index({ category: 1 });

export default mongoose.model('Bouquet', bouquetSchema);