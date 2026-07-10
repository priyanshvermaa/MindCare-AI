import mongoose from 'mongoose';

const waterLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    unit: {
      type: String,
      default: 'ml',
    },
    date: {
      type: String, // format YYYY-MM-DD
      required: true,
    },
    time: {
      type: String, // format HH:MM
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

waterLogSchema.index({ userId: 1, date: 1 });

const WaterLog = mongoose.model('WaterLog', waterLogSchema);
export default WaterLog;
