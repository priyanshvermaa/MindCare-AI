import mongoose from 'mongoose';

const BookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ['article', 'meditation', 'video'],
    },
    itemId: {
      type: String, // Can store Resource ID, Meditation ID, or YouTube video ID/URL
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    author: {
      type: String,
      default: '',
    },
    publishedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Unique index to prevent duplicate bookmarks per user
BookmarkSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

export default mongoose.model('Bookmark', BookmarkSchema);
