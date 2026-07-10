import mongoose from 'mongoose';

const wellnessProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    badges: {
      type: [String], // Array of unlocked badge strings, e.g. ['Goal Getter', 'Water Champ']
      default: [],
    },
    achievements: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        unlockedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

wellnessProfileSchema.index({ userId: 1 });

const WellnessProfile = mongoose.model('WellnessProfile', wellnessProfileSchema);
export default WellnessProfile;
