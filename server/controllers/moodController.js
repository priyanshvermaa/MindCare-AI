import Mood from '../models/Mood.js';
import { clearAICache } from '../services/aiService.js';

// Score mapping
const scoreMapping = {
  '😭 Very Sad': 1,
  '😢 Sad': 2,
  '😔 Low': 3,
  '😐 Neutral': 4,
  '🙂 Okay': 5,
  '😊 Happy': 6,
  '😄 Very Happy': 7,
  '🤩 Excited': 8,
  '😌 Calm': 9,
  '😍 Amazing': 10,
};

// Helper to get normalized date string (YYYY-MM-DD) in local time
const getFormattedLocalDate = (d = new Date()) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * @desc    Create a new mood entry
 * @route   POST /api/moods
 * @access  Private
 */
export const createMood = async (req, res) => {
  const userId = req.user._id;
  const {
    mood,
    intensity,
    stressLevel,
    anxietyLevel,
    energyLevel,
    motivationLevel,
    sleepHours,
    waterIntake,
    meditationMinutes,
  } = req.body;

  try {
    const entryDate = getFormattedLocalDate();

    // Check same-day duplicate active entries
    const existingEntry = await Mood.findOne({
      userId,
      entryDate,
      isDeleted: false,
    });

    if (existingEntry) {
      return res.status(409).json({
        message: 'Mood already exists for today.',
        existingMoodId: existingEntry._id,
      });
    }

    const score = scoreMapping[mood] || 5; // Fallback to 5 if not found

    const newMood = await Mood.create({
      userId,
      mood,
      score,
      intensity: parseInt(intensity, 10),
      stressLevel: parseInt(stressLevel, 10),
      anxietyLevel: parseInt(anxietyLevel, 10),
      energyLevel: parseInt(energyLevel, 10),
      motivationLevel: parseInt(motivationLevel, 10),
      sleepHours: parseFloat(sleepHours) || 0,
      waterIntake: parseInt(waterIntake, 10) || 0,
      meditationMinutes: parseInt(meditationMinutes, 10) || 0,
      entryDate,
    });

    clearAICache(userId);

    res.status(201).json({
      success: true,
      message: 'Mood successfully logged!',
      mood: newMood,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all active mood entries for user (search, filter, sort, paginated)
 * @route   GET /api/moods
 * @access  Private
 */
export const getMoods = async (req, res) => {
  const userId = req.user._id;
  const { moodFilter, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

  try {
    // Base filter
    const filterQuery = { userId, isDeleted: false };

    // Mood emoji filter
    if (moodFilter) {
      filterQuery.mood = moodFilter;
    }

    // Sort configurations
    let sortQuery = { entryDate: -1 }; // Default: Newest first
    if (sortBy) {
      const order = sortOrder === 'asc' ? 1 : -1;
      sortQuery = { [sortBy]: order };
    }

    // Pagination calculations
    const skipCount = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const totalLogs = await Mood.countDocuments(filterQuery);
    const logs = await Mood.find(filterQuery)
      .sort(sortQuery)
      .skip(skipCount)
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      totalLogs,
      totalPages: Math.ceil(totalLogs / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get single active mood entry
 * @route   GET /api/moods/:id
 * @access  Private
 */
export const getMoodById = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const mood = await Mood.findOne({ _id: id, userId, isDeleted: false });
    if (!mood) {
      return res.status(404).json({ message: 'Mood log not found.' });
    }

    res.status(200).json({
      success: true,
      mood,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update today's or any active mood entry
 * @route   PUT /api/moods/:id
 * @access  Private
 */
export const updateMood = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const updateData = req.body;

  try {
    const moodLog = await Mood.findOne({ _id: id, userId, isDeleted: false });
    if (!moodLog) {
      return res.status(404).json({ message: 'Mood log not found.' });
    }

    // Re-calculate score if mood is changed
    if (updateData.mood) {
      updateData.score = scoreMapping[updateData.mood] || 5;
    }

    // Apply updates
    const updatedMood = await Mood.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Mood log successfully updated!',
      mood: updatedMood,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Soft delete mood entry
 * @route   DELETE /api/moods/:id
 * @access  Private
 */
export const deleteMood = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const moodLog = await Mood.findOne({ _id: id, userId, isDeleted: false });
    if (!moodLog) {
      return res.status(404).json({ message: 'Mood log not found.' });
    }

    moodLog.isDeleted = true;
    moodLog.deletedAt = new Date();
    await moodLog.save();

    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: 'Mood entry successfully deleted (soft delete).',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Calculate stats & averages (analytics endpoint)
 * @route   GET /api/moods/analytics
 * @access  Private
 */
export const getMoodAnalytics = async (req, res) => {
  const userId = req.user._id;

  try {
    const allActive = await Mood.find({ userId, isDeleted: false }).sort({ entryDate: 1 });

    if (allActive.length === 0) {
      return res.status(200).json({
        success: true,
        analytics: {
          currentMood: null,
          avgMoodScore: 0,
          weeklyAverage: 0,
          monthlyAverage: 0,
          moodDistribution: [],
          mostFrequentMood: 'None',
        },
      });
    }

    // 1. Current Mood (latest active)
    const latest = allActive[allActive.length - 1];

    // 2. Average Mood Score (all-time active)
    const allTimeSum = allActive.reduce((sum, item) => sum + item.score, 0);
    const avgMoodScore = parseFloat((allTimeSum / allActive.length).toFixed(1));

    // 3. Weekly Average (last 7 days of logs)
    const sevenDaysAgoStr = getFormattedLocalDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const weeklyLogs = allActive.filter((m) => m.entryDate >= sevenDaysAgoStr);
    const weeklySum = weeklyLogs.reduce((sum, item) => sum + item.score, 0);
    const weeklyAverage = weeklyLogs.length > 0 ? parseFloat((weeklySum / weeklyLogs.length).toFixed(1)) : 0;

    // 4. Monthly Average (last 30 days of logs)
    const thirtyDaysAgoStr = getFormattedLocalDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const monthlyLogs = allActive.filter((m) => m.entryDate >= thirtyDaysAgoStr);
    const monthlySum = monthlyLogs.reduce((sum, item) => sum + item.score, 0);
    const monthlyAverage = monthlyLogs.length > 0 ? parseFloat((monthlySum / monthlyLogs.length).toFixed(1)) : 0;

    // 5. Mood Frequency / Distribution
    const counts = {};
    allActive.forEach((item) => {
      counts[item.mood] = (counts[item.mood] || 0) + 1;
    });

    const colors = {
      '😭 Very Sad': '#f87171',
      '😢 Sad': '#fb923c',
      '😔 Low': '#fcd34d',
      '😐 Neutral': '#94a3b8',
      '🙂 Okay': '#60a5fa',
      '😊 Happy': '#34d399',
      '😄 Very Happy': '#2dd4bf',
      '🤩 Excited': '#818cf8',
      '😌 Calm': '#a78bfa',
      '😍 Amazing': '#f472b6',
    };

    const moodDistribution = Object.keys(counts).map((name) => ({
      name,
      value: counts[name],
      color: colors[name] || '#64748b',
    }));

    // 6. Most Frequent Mood
    let mostFrequentMood = 'None';
    let maxCount = 0;
    Object.keys(counts).forEach((moodKey) => {
      if (counts[moodKey] > maxCount) {
        maxCount = counts[moodKey];
        mostFrequentMood = moodKey;
      }
    });

    // 7. Mood Trends (past 7 logged entries for line charts)
    const trendLogs = allActive.slice(-7);
    const moodTrends = trendLogs.map((item) => ({
      date: item.entryDate.substring(5), // MM-DD
      score: item.score,
      intensity: item.intensity,
    }));

    res.status(200).json({
      success: true,
      analytics: {
        currentMood: latest.mood,
        currentScore: latest.score,
        avgMoodScore,
        weeklyAverage,
        monthlyAverage,
        moodDistribution,
        mostFrequentMood,
        moodTrends,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get current & longest active streaks
 * @route   GET /api/moods/streak
 * @access  Private
 */
export const getMoodStreak = async (req, res) => {
  const userId = req.user._id;

  try {
    const allActive = await Mood.find({ userId, isDeleted: false })
      .sort({ entryDate: 1 })
      .select('entryDate');

    if (allActive.length === 0) {
      return res.status(200).json({
        success: true,
        currentStreak: 0,
        longestStreak: 0,
      });
    }

    // Extract sorted unique dates (in milliseconds normalized)
    const loggedDates = allActive.map((item) => {
      const parts = item.entryDate.split('-');
      // Avoid timezone issues, create date manually using local coordinates
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    const uniqueTimestamps = Array.from(new Set(loggedDates)).sort((a, b) => a - b);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const oneDayMs = 24 * 60 * 60 * 1000;

    // Check longest streak
    for (let i = 0; i < uniqueTimestamps.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = uniqueTimestamps[i] - uniqueTimestamps[i - 1];
        // Allow within 28 hours to accommodate minor timestamp variance or same-day logging offsets
        if (diff <= oneDayMs + 4 * 60 * 60 * 1000) {
          tempStreak++;
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
        }
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Check current active streak ending today (or yesterday)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayTs = todayMidnight.getTime();
    const yesterdayTs = todayTs - oneDayMs;

    const lastLogTs = uniqueTimestamps[uniqueTimestamps.length - 1];

    if (lastLogTs === todayTs || lastLogTs === yesterdayTs) {
      currentStreak = 1;
      let checkTs = lastLogTs - oneDayMs;
      const loggedSet = new Set(uniqueTimestamps);
      while (loggedSet.has(checkTs)) {
        currentStreak++;
        checkTs -= oneDayMs;
      }
    }

    res.status(200).json({
      success: true,
      currentStreak,
      longestStreak,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
