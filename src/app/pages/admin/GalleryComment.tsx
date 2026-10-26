import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryComment extends Document {
  photo: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  authorName: string;
  text: string;
  approved: boolean;
  createdAt: Date;
}

const galleryCommentSchema = new Schema<IGalleryComment>(
  {
    photo: {
      type: Schema.Types.ObjectId,
      ref: 'GalleryPhoto',
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    authorName: {
      type: String,
      required: true,
      maxlength: 120,
    },

    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    approved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGalleryComment>(
  'GalleryComment',
  galleryCommentSchema
);