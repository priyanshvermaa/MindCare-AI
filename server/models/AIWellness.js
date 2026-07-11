import mongoose from 'mongoose';

const aiWellnessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      default: null,
    },
    recommendedSleep: {
      type: String,
      default: '',
    },
    calculatedSleepRating: {
      type: String,
      default: '',
    },
    aiWellnessSummary: {
      type: String,
      default: '',
    },
    overallWellnessScore: {
      type: Number,
      default: 70,
    },
    aiInsightHistory: [
      {
        summary: String,
        score: Number,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    latestRecommendations: {
      type: [String],
      default: [],
    },
    sleepStatus: {
      type: String,
      default: '',
    },
    hydrationStatus: {
      type: String,
      default: '',
    },
    moodStatus: {
      type: String,
      default: '',
    },
    // New fields requested for comprehensive production-ready analysis
    mentalWellnessStatus: {
      type: String,
      default: '',
    },
    physicalWellnessStatus: {
      type: String,
      default: '',
    },
    emotionalTrends: {
      type: String,
      default: '',
    },
    journalAnalysis: {
      type: String,
      default: '',
    },
    exerciseAnalysis: {
      type: String,
      default: '',
    },
    meditationAnalysis: {
      type: String,
      default: '',
    },
    habitAnalysis: {
      type: String,
      default: '',
    },
    behaviourCorrelations: {
      type: String,
      default: '',
    },
    positiveChanges: {
      type: String,
      default: '',
    },
    areasNeedingAttention: {
      type: String,
      default: '',
    },
    riskFactors: {
      type: String,
      default: '',
    },
    todayPriority: {
      type: String,
      default: '',
    },
    weeklySummary: {
      type: String,
      default: '',
    },
    longTermProgress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const AIWellness = mongoose.model('AIWellness', aiWellnessSchema);
export default AIWellness;
