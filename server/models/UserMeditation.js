import mongoose from 'mongoose';

const userMeditationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    meditationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meditation',
      required: true
    },
    progress: {
      type: Number, // Percentage completed (0 - 100)
      default: 0
    },
    currentTime: {
      type: Number, // Playback position in seconds
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    favorite: {
      type: Boolean,
      default: false
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    lastPlayed: {
      type: Date,
      default: Date.now
    },
    minutesCompleted: {
      type: Number, // Total minutes user spent meditating in this session
      default: 0
    }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per user and meditation
userMeditationSchema.index({ userId: 1, meditationId: 1 }, { unique: true });

const UserMeditation = mongoose.model('UserMeditation', userMeditationSchema);
export default UserMeditation;
