import mongoose from 'mongoose';

const userMeditationProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    minutesMeditated: {
      type: Number,
      required: true,
      default: 0,
    },
    sessionsCompleted: {
      type: Number,
      required: true,
      default: 0,
    },
    streak: {
      type: Number,
      required: true,
      default: 0,
    },
    longestSession: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const UserMeditationProgress = mongoose.model('UserMeditationProgress', userMeditationProgressSchema);
export default UserMeditationProgress;
