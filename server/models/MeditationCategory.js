import mongoose from 'mongoose';

const meditationCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    count: {
      type: String,
      default: '0 Sessions',
    },
  },
  { timestamps: true }
);

const MeditationCategory = mongoose.model('MeditationCategory', meditationCategorySchema);
export default MeditationCategory;
