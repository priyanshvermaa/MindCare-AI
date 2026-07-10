import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['article', 'video', 'meditation', 'breathing', 'self-care'],
      default: 'article',
    },
    category: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: '5 mins',
    },
    // New fields for Articles
    author: {
      type: String,
      default: 'MindCare Expert',
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    tags: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800',
    },
    fullContent: {
      type: String,
      default: '',
    },
    relatedArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],
    // New fields for YouTube videos
    channel: {
      type: String,
      default: 'MindCare TV',
    },
    views: {
      type: String,
      default: '12K views',
    },
    thumbnail: {
      type: String,
      default: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Resource', ResourceSchema);
