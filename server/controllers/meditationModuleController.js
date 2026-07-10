import MeditationCategory from '../models/MeditationCategory.js';
import MeditationArticle from '../models/MeditationArticle.js';
import MeditationVideo from '../models/MeditationVideo.js';
import ReadingProgress from '../models/ReadingProgress.js';
import WatchHistory from '../models/WatchHistory.js';
import RecentlyViewed from '../models/RecentlyViewed.js';
import UserMeditationProgress from '../models/UserMeditationProgress.js';
import WellnessStats from '../models/WellnessStats.js';
import { calculateStreaks } from '../services/analyticsService.js';
import mongoose from 'mongoose';

/**
 * @desc    Get all meditation categories
 * @route   GET /api/meditation/categories
 * @access  Private
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await MeditationCategory.find().sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get category details by slug
 * @route   GET /api/meditation/category/:slug
 * @access  Private
 */
export const getCategoryBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const category = await MeditationCategory.findOne({ slug: slug.toLowerCase() });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get articles by category slug
 * @route   GET /api/meditation/articles/:slug
 * @access  Private
 */
export const getArticlesByCategory = async (req, res) => {
  const { slug } = req.params;
  try {
    const articles = await MeditationArticle.find({ categorySlug: slug.toLowerCase() }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get article by ID
 * @route   GET /api/meditation/article/:id
 * @access  Private
 */
export const getArticleById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid article ID format.' });
  }

  try {
    const article = await MeditationArticle.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Record as recently viewed
    await RecentlyViewed.findOneAndUpdate(
      { userId, itemId: id, itemType: 'article' },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );

    // Fetch user progress for this article
    const progressDoc = await ReadingProgress.findOne({ userId, articleId: id });

    res.status(200).json({
      success: true,
      article,
      progress: progressDoc ? progressDoc.progress : 0,
      completed: progressDoc ? progressDoc.completed : false
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get videos by category slug
 * @route   GET /api/meditation/videos/:slug
 * @access  Private
 */
export const getVideosByCategory = async (req, res) => {
  const { slug } = req.params;
  try {
    const videos = await MeditationVideo.find({ categorySlug: slug.toLowerCase() }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get video by ID
 * @route   GET /api/meditation/video/:id
 * @access  Private
 */
export const getVideoById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid video ID format.' });
  }

  try {
    const video = await MeditationVideo.findById(id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Record as recently viewed
    await RecentlyViewed.findOneAndUpdate(
      { userId, itemId: id, itemType: 'video' },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );

    // Fetch user watch progress
    const watchDoc = await WatchHistory.findOne({ userId, videoId: id });

    res.status(200).json({
      success: true,
      video,
      progress: watchDoc ? watchDoc.progress : 0,
      completed: watchDoc ? watchDoc.completed : false
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Post article reading progress
 * @route   POST /api/meditation/reading-progress
 * @access  Private
 */
export const updateReadingProgress = async (req, res) => {
  const userId = req.user._id;
  const { articleId, progress } = req.body;

  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    return res.status(400).json({ success: false, message: 'Invalid article ID format.' });
  }

  try {
    const numericProgress = parseFloat(progress) || 0;
    const completed = numericProgress >= 95; // consider read at 95%

    const progressDoc = await ReadingProgress.findOneAndUpdate(
      { userId, articleId },
      { progress: numericProgress, completed },
      { upsert: true, new: true }
    );

    // Increment user meditation metrics on first read completion
    if (completed) {
      const existing = await ReadingProgress.findOne({ userId, articleId, completed: true });
      if (!existing || progressDoc.isNew) {
        await UserMeditationProgress.findOneAndUpdate(
          { userId },
          { 
            $inc: { sessionsCompleted: 1, minutesMeditated: 5 },
            $max: { longestSession: 5 }
          },
          { upsert: true }
        );
      }
    }

    res.status(200).json({ success: true, progress: progressDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Post video watch progress
 * @route   POST /api/meditation/watch-history
 * @access  Private
 */
export const updateWatchHistory = async (req, res) => {
  const userId = req.user._id;
  const { videoId, progress, action, watchedMinutes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ success: false, message: 'Invalid video ID format.' });
  }

  try {
    const numericProgress = parseFloat(progress) || 0;
    const completed = numericProgress >= 90; // consider watched at 90%

    const watchDoc = await WatchHistory.findOneAndUpdate(
      { userId, videoId },
      { progress: numericProgress, completed },
      { upsert: true, new: true }
    );

    const progressUpdate = {};

    if (action === 'open') {
      progressUpdate.$inc = { sessionsCompleted: 1 };
    }

    if (watchedMinutes && parseFloat(watchedMinutes) > 0) {
      const minsVal = parseFloat(watchedMinutes);
      if (!progressUpdate.$inc) {
        progressUpdate.$inc = { minutesMeditated: minsVal };
      } else {
        progressUpdate.$inc.minutesMeditated = (progressUpdate.$inc.minutesMeditated || 0) + minsVal;
      }
      progressUpdate.$max = { longestSession: Math.round(minsVal) };
    }

    if (progressUpdate.$inc || progressUpdate.$max) {
      await UserMeditationProgress.findOneAndUpdate(
        { userId },
        progressUpdate,
        { upsert: true }
      );

      // Also update daily stats for charts
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const incVal = watchedMinutes ? parseFloat(watchedMinutes) : 0;
      if (incVal > 0) {
        await WellnessStats.findOneAndUpdate(
          { user: userId, date: todayStart },
          { $inc: { meditationMinutes: Math.round(incVal) } },
          { upsert: true }
        );
      }
    }

    res.status(200).json({ success: true, history: watchDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get user meditation stats
 * @route   GET /api/meditation/stats
 * @access  Private
 */
export const getMeditationStats = async (req, res) => {
  const userId = req.user._id;
  try {
    let stats = await UserMeditationProgress.findOne({ userId });
    if (!stats) {
      // Create defaults set to zero
      stats = await UserMeditationProgress.create({
        userId,
        minutesMeditated: 0,
        sessionsCompleted: 0,
        streak: 0,
        longestSession: 0
      });
    }

    const { currentStreak } = await calculateStreaks(userId);

    const roundedStats = {
      ...stats.toObject(),
      minutesMeditated: Math.round(stats.minutesMeditated || 0),
      longestSession: Math.round(stats.longestSession || 0),
      streak: currentStreak
    };

    res.status(200).json({ success: true, stats: roundedStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
