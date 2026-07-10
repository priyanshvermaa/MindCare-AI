import JournalEntry from '../models/JournalEntry.js';
import { calculateStreaks } from '../services/analyticsService.js';
import { clearAICache } from '../services/aiService.js';

import { askGrok } from '../services/grokService.js';
const askGroq = askGrok;

// ── Helper ────────────────────────────────────────────────────────
const getFormattedLocalDate = (d = new Date()) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// ── CRUD ──────────────────────────────────────────────────────────

/**
 * @desc    Create a new journal entry
 * @route   POST /api/journals
 * @access  Private
 */
export const createJournal = async (req, res) => {
  try {
    const { title, content, mood, tags, category, visibility } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const entry = await JournalEntry.create({
      user: req.user._id,
      title: title.trim(),
      content,
      mood: mood || null,
      tags: Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : [],
      category: category || 'free-writing',
      visibility: visibility || 'private',
    });

    clearAICache(req.user._id);

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully.',
      entry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all active journal entries (search, filter, sort, paginate)
 * @route   GET /api/journals
 * @access  Private
 */
export const getJournals = async (req, res) => {
  try {
    const {
      search,
      category,
      mood,
      tag,
      favorite,
      pinned,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { user: req.user._id, isDeleted: false };

    // Search by title or content
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') filter.category = category;
    if (mood) filter.mood = { $regex: mood, $options: 'i' };
    if (tag) filter.tags = { $in: [tag.toLowerCase()] };
    if (favorite === 'true') filter.favorite = true;
    if (pinned === 'true') filter.pinned = true;

    const sortObj = {};
    // Pinned entries always first
    sortObj.pinned = -1;
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await JournalEntry.countDocuments(filter);

    const entries = await JournalEntry.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      entries,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get single journal entry
 * @route   GET /api/journals/:id
 * @access  Private
 */
export const getJournalById = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    res.status(200).json({ success: true, entry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update journal entry
 * @route   PUT /api/journals/:id
 * @access  Private
 */
export const updateJournal = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const { title, content, mood, tags, category, visibility } = req.body;

    if (title !== undefined) entry.title = title.trim();
    if (content !== undefined) entry.content = content;
    if (mood !== undefined) entry.mood = mood;
    if (tags !== undefined) entry.tags = Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : entry.tags;
    if (category !== undefined) entry.category = category;
    if (visibility !== undefined) entry.visibility = visibility;

    // Clear cached AI data when content changes
    if (content !== undefined) {
      entry.aiSummary = null;
      entry.aiTone = null;
    }

    await entry.save(); // triggers pre-save hook for wordCount/readingTime

    clearAICache(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Journal entry updated successfully.',
      entry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Soft-delete journal entry
 * @route   DELETE /api/journals/:id
 * @access  Private
 */
export const deleteJournal = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    entry.isDeleted = true;
    entry.deletedAt = new Date();
    await entry.save();

    clearAICache(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Journal entry deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Restore a soft-deleted journal entry
 * @route   PATCH /api/journals/:id/restore
 * @access  Private
 */
export const restoreJournal = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: true,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Deleted journal entry not found.' });
    }

    entry.isDeleted = false;
    entry.deletedAt = null;
    await entry.save();

    clearAICache(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Journal entry restored successfully.',
      entry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Toggle favorite status
 * @route   PATCH /api/journals/:id/favorite
 * @access  Private
 */
export const toggleFavorite = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    entry.favorite = !entry.favorite;
    await entry.save();

    res.status(200).json({
      success: true,
      message: entry.favorite ? 'Added to favorites.' : 'Removed from favorites.',
      favorite: entry.favorite,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Toggle pinned status
 * @route   PATCH /api/journals/:id/pin
 * @access  Private
 */
export const togglePin = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    entry.pinned = !entry.pinned;
    await entry.save();

    res.status(200).json({
      success: true,
      message: entry.pinned ? 'Journal pinned.' : 'Journal unpinned.',
      pinned: entry.pinned,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── AI Endpoints ──────────────────────────────────────────────────

/**
 * @desc    Generate AI summary for a journal entry
 * @route   POST /api/journals/:id/ai/summary
 * @access  Private
 */
export const generateSummary = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const result = await askGroq(
      'You are a compassionate mental wellness assistant. Summarize the following journal entry in 2-3 sentences. Focus on the key emotions, experiences, and any patterns you notice. Be warm and supportive.',
      `Journal Title: "${entry.title}"\n\nContent:\n${entry.content}`
    );

    if (!result) {
      throw new Error('AI summary response was empty.');
    }

    // Cache the summary
    entry.aiSummary = result;
    await entry.save();

    res.status(200).json({ success: true, summary: result, cached: true });
  } catch (error) {
    console.error('❌ Error during AI summary generation:', error.stack || error);
    res.status(500).json({ success: false, message: `AI summary generation failed: ${error.message}` });
  }
};

/**
 * @desc    Detect emotional tone of a journal entry
 * @route   POST /api/journals/:id/ai/tone
 * @access  Private
 */
export const detectTone = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const result = await askGroq(
      'You are an emotional intelligence expert. Analyze the emotional tone of the following journal entry. Respond with a JSON object containing: "primaryTone" (one word), "secondaryTone" (one word), "intensity" (low/medium/high), and "explanation" (one sentence). Only output valid JSON, no markdown.',
      `Journal Title: "${entry.title}"\n\nContent:\n${entry.content}`
    );

    if (!result) {
      throw new Error('AI tone response was empty.');
    }

    // Try parsing JSON response
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { primaryTone: 'reflective', secondaryTone: 'calm', intensity: 'medium', explanation: result };
    }

    entry.aiTone = parsed.primaryTone;
    await entry.save();

    res.status(200).json({ success: true, tone: parsed });
  } catch (error) {
    console.error('❌ Error during AI tone detection:', error.stack || error);
    res.status(500).json({ success: false, message: `AI tone detection failed: ${error.message}` });
  }
};

/**
 * @desc    Generate CBT reflection questions
 * @route   POST /api/journals/:id/ai/reflect
 * @access  Private
 */
export const getReflectionQuestions = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const result = await askGroq(
      'You are a licensed CBT therapist. Based on the journal entry, generate exactly 3 thoughtful reflection questions that help the writer explore their thoughts and feelings more deeply. Use CBT techniques like cognitive reframing and Socratic questioning. Respond as a JSON array of 3 strings. Only output valid JSON, no markdown.',
      `Journal Title: "${entry.title}"\n\nContent:\n${entry.content}`
    );

    if (!result) {
      throw new Error('AI reflection questions response was empty.');
    }

    let questions;
    try {
      questions = JSON.parse(result);
    } catch {
      questions = [result];
    }

    res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error('❌ Error during AI reflection generation:', error.stack || error);
    res.status(500).json({ success: false, message: `AI reflection generation failed: ${error.message}` });
  }
};

/**
 * @desc    Generate positive insights / reframing
 * @route   POST /api/journals/:id/ai/insights
 * @access  Private
 */
export const getInsights = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDeleted: false,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found.' });
    }

    const result = await askGroq(
      'You are a positive psychology coach. Read the journal entry and provide: 1) A strength you notice in the writer, 2) A positive reframe of any challenges mentioned, 3) An encouraging affirmation. Respond as a JSON object with keys "strength", "reframe", "affirmation". Only output valid JSON, no markdown.',
      `Journal Title: "${entry.title}"\n\nContent:\n${entry.content}`
    );

    if (!result) {
      throw new Error('AI insights response was empty.');
    }

    let insights;
    try {
      insights = JSON.parse(result);
    } catch {
      insights = { strength: result, reframe: '', affirmation: '' };
    }

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error('❌ Error during AI insights generation:', error.stack || error);
    res.status(500).json({ success: false, message: `AI insights generation failed: ${error.message}` });
  }
};

/**
 * @desc    Generate weekly journal reflection from last 7 days
 * @route   GET /api/journals/weekly-reflection
 * @access  Private
 */
export const getWeeklyReflection = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEntries = await JournalEntry.find({
      user: req.user._id,
      isDeleted: false,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 });

    if (recentEntries.length === 0) {
      return res.status(200).json({
        success: true,
        reflection: 'No journal entries in the past week. Start writing to get your weekly AI reflection!',
        entriesCount: 0,
      });
    }

    const combinedContent = recentEntries
      .map((e, i) => `Entry ${i + 1} — "${e.title}" (${e.category}):\n${e.content}`)
      .join('\n\n---\n\n');

    const result = await askGroq(
      'You are a thoughtful wellness coach. Review the following journal entries from the past week and create a warm, supportive weekly reflection summary. Include: 1) Key themes observed, 2) Emotional patterns, 3) Growth areas, 4) An encouraging message for the coming week. Keep it concise (under 200 words).',
      combinedContent
    );

    if (!result) {
      throw new Error('AI weekly reflection response was empty.');
    }

    res.status(200).json({ success: true, reflection: result, entriesCount: recentEntries.length });
  } catch (error) {
    console.error('❌ Error during AI weekly reflection generation:', error.stack || error);
    res.status(500).json({ success: false, message: `AI weekly reflection failed: ${error.message}` });
  }
};

// ── Analytics ─────────────────────────────────────────────────────

/**
 * @desc    Get journal analytics (totals, streaks, averages, frequencies)
 * @route   GET /api/journals/analytics
 * @access  Private
 */
export const getJournalAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total entries
    const totalEntries = await JournalEntry.countDocuments({ user: userId, isDeleted: false });

    // Average word count
    const wordAgg = await JournalEntry.aggregate([
      { $match: { user: userId, isDeleted: false } },
      { $group: { _id: null, avgWords: { $avg: '$wordCount' }, totalWords: { $sum: '$wordCount' } } },
    ]);
    const avgWords = wordAgg.length > 0 ? Math.round(wordAgg[0].avgWords) : 0;
    const totalWords = wordAgg.length > 0 ? wordAgg[0].totalWords : 0;

    // Category frequency
    const categoryAgg = await JournalEntry.aggregate([
      { $match: { user: userId, isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const categoryFrequency = {};
    categoryAgg.forEach((c) => { categoryFrequency[c._id] = c.count; });

    // Writing streak (synchronized calendar days)
    const { currentStreak, longestStreak } = await calculateStreaks(userId);

    // Mood correlation (most common moods in journals)
    const moodAgg = await JournalEntry.aggregate([
      { $match: { user: userId, isDeleted: false, mood: { $ne: null } } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Entries this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weeklyCount = await JournalEntry.countDocuments({
      user: userId,
      isDeleted: false,
      createdAt: { $gte: weekStart },
    });

    // Favorites count
    const favoritesCount = await JournalEntry.countDocuments({ user: userId, isDeleted: false, favorite: true });

    res.status(200).json({
      success: true,
      analytics: {
        totalEntries,
        totalWords,
        avgWords,
        currentStreak,
        longestStreak,
        weeklyCount,
        favoritesCount,
        categoryFrequency,
        moodCorrelation: moodAgg,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
