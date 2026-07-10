import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema(
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
    lastShownAt: {
      type: Date,
      default: null
    },
    isToday: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Quote = mongoose.model('Quote', quoteSchema);
export default Quote;
