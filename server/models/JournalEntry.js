import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a journal title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please write some journal content'],
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'anxious', 'exhausted'],
      default: 'neutral',
    },
    // ── Module 5 fields ──
    mood: {
      type: String,
      default: null,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ['free-writing', 'gratitude', 'daily-reflection', 'cbt'],
      default: 'free-writing',
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ['private', 'shared'],
      default: 'private',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    readingTime: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    aiSummary: {
      type: String,
      default: null,
    },
    aiTone: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-compute wordCount and readingTime before saving
journalEntrySchema.pre('save', function (next) {
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).filter(Boolean).length;
    this.wordCount = words;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
  }
  next();
});

// Index for efficient queries
journalEntrySchema.index({ user: 1, isDeleted: 1, createdAt: -1 });
journalEntrySchema.index({ user: 1, category: 1 });
journalEntrySchema.index({ user: 1, favorite: 1 });
journalEntrySchema.index({ user: 1, pinned: 1 });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
export default JournalEntry;
