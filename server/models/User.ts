import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// `email: unique` above already creates its index; role matters because every
// placed order fans out an alert to `find({ role: 'admin' })`.
userSchema.index({ role: 1 });

userSchema.pre('save', async function (this: any, next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function (this: any) {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);