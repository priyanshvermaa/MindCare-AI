import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    habitName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General', // e.g. Hydration, Sleep, Exercise, Meditation, Custom
    },
    target: {
      type: Number,
      required: true,
      default: 1, // e.g., target amount per day (water ml, exercise mins, or 1 for binary checkboxes)
    },
    completed: {
      type: Boolean,
      default: false, // Today's completion status
    },
    streak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    completedDates: {
      type: [String], // Array of YYYY-MM-DD completion dates
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

habitSchema.index({ userId: 1 });

const Habit = mongoose.model('Habit', habitSchema);
export default Habit;
