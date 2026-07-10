import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mood: {
      type: String,
      required: [true, 'Please select a mood type'],
      trim: true,
    },
    score: {
      type: Number,
      required: [true, 'Please calculate a numeric mood score'],
      min: 1,
      max: 10,
    },
    intensity: {
      type: Number,
      required: [true, 'Please rate your mood intensity (1-10)'],
      min: 1,
      max: 10,
    },
    stressLevel: {
      type: Number,
      required: [true, 'Please rate your stress level (1-10)'],
      min: 1,
      max: 10,
    },
    anxietyLevel: {
      type: Number,
      required: [true, 'Please rate your anxiety level (1-10)'],
      min: 1,
      max: 10,
    },
    energyLevel: {
      type: Number,
      required: [true, 'Please rate your energy level (1-10)'],
      min: 1,
      max: 10,
    },
    motivationLevel: {
      type: Number,
      required: [true, 'Please rate your motivation level (1-10)'],
      min: 1,
      max: 10,
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
    entryDate: {
      type: String,
      required: true, // normalized 'YYYY-MM-DD'
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of active daily logs per user
moodSchema.index({ userId: 1, entryDate: 1, isDeleted: 1 });

const Mood = mongoose.model('Mood', moodSchema);
export default Mood;
