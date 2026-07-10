import mongoose from 'mongoose';

const wellnessStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    sleepHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    waterIntake: {
      type: Number,
      default: 0, // in ml
      min: 0,
    },
    meditationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    wellnessScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick lookups on user and specific dates
wellnessStatsSchema.index({ user: 1, date: 1 }, { unique: true });

const WellnessStats = mongoose.model('WellnessStats', wellnessStatsSchema);
export default WellnessStats;
