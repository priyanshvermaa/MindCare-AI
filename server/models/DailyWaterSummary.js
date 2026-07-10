import mongoose from 'mongoose';

const dailyWaterSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // format YYYY-MM-DD
      required: true,
    },
    goal: {
      type: Number,
      required: true,
      default: 2000,
    },
    totalIntake: {
      type: Number,
      required: true,
      default: 0,
    },
    remaining: {
      type: Number,
      required: true,
      default: 2000,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    goalAchieved: {
      type: Boolean,
      required: true,
      default: false,
    },
    numberOfEntries: {
      type: Number,
      required: true,
      default: 0,
    },
    lastDrinkTime: {
      type: String,
      default: '',
    },
    streak: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

dailyWaterSummarySchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyWaterSummary = mongoose.model('DailyWaterSummary', dailyWaterSummarySchema);
export default DailyWaterSummary;
