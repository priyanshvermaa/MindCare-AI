import mongoose from 'mongoose';

const meditationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    duration: {
      type: Number, // duration in seconds
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    },
    videoUrl: {
      type: String,
      required: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    instructor: {
      type: String,
      default: 'MindCare Coach'
    },
    benefits: {
      type: [String],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

const Meditation = mongoose.model('Meditation', meditationSchema);
export default Meditation;
