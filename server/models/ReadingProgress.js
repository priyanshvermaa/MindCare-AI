import mongoose from 'mongoose';

const readingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MeditationArticle',
      required: true,
    },
    progress: {
      type: Number,
      required: true,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

readingProgressSchema.index({ userId: 1, articleId: 1 }, { unique: true });

const ReadingProgress = mongoose.model('ReadingProgress', readingProgressSchema);
export default ReadingProgress;
