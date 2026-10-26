import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryLike extends Document {
  photo: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const galleryLikeSchema = new Schema<IGalleryLike>(
  {
    photo: {
      type: Schema.Types.ObjectId,
      ref: 'GalleryPhoto',
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One user can only like a photo once
galleryLikeSchema.index(
  { photo: 1, user: 1 },
  { unique: true }
);

export default mongoose.model<IGalleryLike>(
  'GalleryLike',
  galleryLikeSchema
);