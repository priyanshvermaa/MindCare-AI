import mongoose from 'mongoose';

const meditationHistorySchema = new mongoose.Schema(
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
    date: {
      type: Date,
      default: Date.now // Store start of day or direct datetime
    },
    minutes: {
      type: Number,
      required: true,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const MeditationHistory = mongoose.model('MeditationHistory', meditationHistorySchema);
export default MeditationHistory;
