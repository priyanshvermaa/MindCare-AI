import mongoose from 'mongoose';

const meditationArticleSchema = new mongoose.Schema(
  {
    categorySlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    readingTime: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    heroImage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const MeditationArticle = mongoose.model('MeditationArticle', meditationArticleSchema);
export default MeditationArticle;
