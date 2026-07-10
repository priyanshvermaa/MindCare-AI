import mongoose from 'mongoose';

const ResourceProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ['article', 'video'],
    },
    progress: {
      type: Number, // 0 to 100 representing completion percentage
      default: 0,
    },
    currentTime: {
      type: Number, // current playback position in seconds (for videos)
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    lastPlayed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ResourceProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export default mongoose.model('ResourceProgress', ResourceProgressSchema);
