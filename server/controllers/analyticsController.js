import {
  calculateStreaks,
  getMoodAnalytics,
  getJournalAnalytics,
  getWellnessAnalytics,
  getComprehensiveAnalytics
} from '../services/analyticsService.js';

/**
 * @desc    Fetch aggregate metrics for dashboard visualizers
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
export const getDashboardAnalyticsData = async (req, res) => {
  const userId = req.user._id;
  try {
    const streaks = await calculateStreaks(userId);
    const moodStats = await getMoodAnalytics(userId);
    const wellness = await getWellnessAnalytics(userId);
    const comprehensive = await getComprehensiveAnalytics(userId);

    res.status(200).json({
      success: true,
      streaks,
      mood: moodStats,
      wellness,
      comprehensive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Fetch mood metrics (stress, energy, distributions)
 * @route   GET /api/analytics/moods
 * @access  Private
 */
export const getMoodAnalyticsData = async (req, res) => {
  const userId = req.user._id;
  try {
    const data = await getMoodAnalytics(userId);
    res.status(200).json({ success: true, analytics: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Fetch journal details (sentiments, lengths)
 * @route   GET /api/analytics/journal
 * @access  Private
 */
export const getJournalAnalyticsData = async (req, res) => {
  const userId = req.user._id;
  try {
    const data = await getJournalAnalytics(userId);
    res.status(200).json({ success: true, analytics: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Fetch active login streaks
 * @route   GET /api/analytics/streak
 * @access  Private
 */
export const getStreakData = async (req, res) => {
  const userId = req.user._id;
  try {
    const data = await calculateStreaks(userId);
    res.status(200).json({ success: true, streak: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

