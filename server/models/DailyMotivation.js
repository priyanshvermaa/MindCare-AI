import mongoose from 'mongoose';

const dailyMotivationSchema = new mongoose.Schema(
  {
    quote: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const DailyMotivation = mongoose.model('DailyMotivation', dailyMotivationSchema);
export default DailyMotivation;
