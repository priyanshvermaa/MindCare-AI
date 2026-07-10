import Mood from '../models/Mood.js';
import JournalEntry from '../models/JournalEntry.js';
import WellnessStats from '../models/WellnessStats.js';
import mongoose from 'mongoose';

/**
 * Helper to calculate current and longest streaks based on active user log dates.
 */
export const calculateStreaks = async (userId) => {
  try {
    const moodDates = await Mood.find({ userId, isDeleted: false }).select('createdAt');
    const journalDates = await JournalEntry.find({ user: userId, isDeleted: false }).select('createdAt');

    const allDates = [
      ...moodDates.map(d => d.createdAt.toISOString().split('T')[0]),
      ...journalDates.map(d => d.createdAt.toISOString().split('T')[0])
    ];

    const uniqueDates = Array.from(new Set(allDates)).sort();

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    if (uniqueDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffTime = Math.abs(curr - prev);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }

      // Check current streak activity (must have logged today or yesterday)
      const lastLogDate = new Date(uniqueDates[uniqueDates.length - 1]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastLogDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today - lastLogDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        currentStreak = tempStreak;
      } else {
        currentStreak = 0;
      }
    }

    return { currentStreak, longestStreak };
  } catch (err) {
    console.error('Error calculating streaks:', err.message);
    return { currentStreak: 0, longestStreak: 0 };
  }
};

/**
 * Aggregate mood logs to construct weekly trends, monthly averages, and color distribution metrics.
 */
export const getMoodAnalytics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Stress, Anxiety, Energy, and Sleep averages
  const overallAverages = await Mood.aggregate([
    { $match: { userId: userObjectId, isDeleted: false } },
    {
      $group: {
        _id: null,
        avgStress: { $avg: '$stressLevel' },
        avgAnxiety: { $avg: '$anxietyLevel' },
        avgEnergy: { $avg: '$energyLevel' },
        avgIntensity: { $avg: '$intensity' },
        avgSleep: { $avg: '$sleepHours' },
        totalLogs: { $sum: 1 }
      }
    }
  ]);

  // 2. Mood Value Distribution counts
  const moodDistribution = await Mood.aggregate([
    { $match: { userId: userObjectId, isDeleted: false } },
    { $group: { _id: '$mood', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 3. Weekly Mood Trend (Mood intensity per day of week)
  const weeklyTrends = await Mood.aggregate([
    {
      $match: {
        userId: userObjectId,
        isDeleted: false,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $project: {
        intensity: 1,
        dayOfWeek: { $dayOfWeek: '$createdAt' } // 1 (Sun) to 7 (Sat)
      }
    },
    {
      $group: {
        _id: '$dayOfWeek',
        avgIntensity: { $avg: '$intensity' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Map weekly trends to standard day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formattedWeekly = dayNames.map((name, index) => {
    const matched = weeklyTrends.find(t => t._id === index + 1);
    return {
      day: name,
      intensity: matched ? Math.round(matched.avgIntensity * 10) / 10 : 0
    };
  });

  return {
    averages: overallAverages[0] || {
      avgStress: 0,
      avgAnxiety: 0,
      avgEnergy: 0,
      avgIntensity: 0,
      avgSleep: 0,
      totalLogs: 0
    },
    distribution: moodDistribution.map(d => ({
      name: d._id || 'Neutral',
      value: d.count
    })),
    weeklyTrend: formattedWeekly
  };
};

/**
 * Aggregate journal entries to compute writing counts, sentiment categories, and length analytics.
 */
export const getJournalAnalytics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Overall averages (wordCount, readingTime)
  const overallStats = await JournalEntry.aggregate([
    { $match: { user: userObjectId, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        avgWords: { $avg: '$wordCount' },
        avgReadingTime: { $avg: '$readingTime' }
      }
    }
  ]);

  // 2. Sentiment distribution counts
  const sentimentDistribution = await JournalEntry.aggregate([
    { $match: { user: userObjectId, isDeleted: false } },
    { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 3. Weekly journal activity (Logs per day of week in last 30 days)
  const activityTrends = await JournalEntry.aggregate([
    {
      $match: {
        user: userObjectId,
        isDeleted: false,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $project: {
        dayOfWeek: { $dayOfWeek: '$createdAt' }
      }
    },
    {
      $group: {
        _id: '$dayOfWeek',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formattedActivity = dayNames.map((name, index) => {
    const matched = activityTrends.find(a => a._id === index + 1);
    return {
      day: name,
      entries: matched ? matched.count : 0
    };
  });

  return {
    averages: overallStats[0] || {
      totalEntries: 0,
      avgWords: 0,
      avgReadingTime: 0
    },
    sentiments: sentimentDistribution.map(s => ({
      sentiment: s._id || 'Neutral',
      count: s.count
    })),
    activityTrend: formattedActivity
  };
};

/**
 * Fetch composite averages for daily wellness statistics (sleep, water, meditation, score).
 */
export const getWellnessAnalytics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Average Wellness Stats in the last 30 days
  const wellnessAverages = await WellnessStats.aggregate([
    { $match: { user: userObjectId, date: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: null,
        avgSleep: { $avg: '$sleepHours' },
        avgWater: { $avg: '$waterIntake' },
        avgMeditation: { $avg: '$meditationMinutes' },
        avgWellnessScore: { $avg: '$wellnessScore' },
        count: { $sum: 1 }
      }
    }
  ]);

  // 2. Daily progression records (last 10 days)
  const history = await WellnessStats.find({
    user: userId,
    date: { $gte: thirtyDaysAgo }
  })
    .sort({ date: 1 })
    .limit(10)
    .select('date sleepHours waterIntake meditationMinutes wellnessScore');

  return {
    averages: wellnessAverages[0] || {
      avgSleep: 0,
      avgWater: 0,
      avgMeditation: 0,
      avgWellnessScore: 0,
      count: 0
    },
    dailyHistory: history.map(h => ({
      date: h.date.toISOString().split('T')[0],
      sleep: h.sleepHours,
      water: h.waterIntake,
      meditation: h.meditationMinutes,
      score: h.wellnessScore
    }))
  };
};

/**
 * Generate PDF/CSV printable summary reports (Daily, Weekly, Monthly, AI summary).
 */
export const compileSummaryReport = async (userId, range) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  let timeBoundary = new Date();

  if (range === 'daily') {
    timeBoundary.setDate(now.getDate() - 1);
  } else if (range === 'weekly') {
    timeBoundary.setDate(now.getDate() - 7);
  } else {
    timeBoundary.setMonth(now.getMonth() - 1);
  }

  // Fetch moods in range
  const moods = await Mood.find({
    userId,
    isDeleted: false,
    createdAt: { $gte: timeBoundary }
  }).sort({ createdAt: -1 });

  // Fetch journals in range
  const journals = await JournalEntry.find({
    user: userId,
    isDeleted: false,
    createdAt: { $gte: timeBoundary }
  }).sort({ createdAt: -1 });

  // Fetch streaks
  const { currentStreak, longestStreak } = await calculateStreaks(userId);

  // Compute Averages
  const totalLogs = moods.length;
  const avgStress = totalLogs > 0 ? moods.reduce((sum, m) => sum + m.stressLevel, 0) / totalLogs : 0;
  const avgSleep = totalLogs > 0 ? moods.reduce((sum, m) => sum + m.sleepHours, 0) / totalLogs : 0;
  const avgWater = totalLogs > 0 ? moods.reduce((sum, m) => sum + m.waterIntake, 0) / totalLogs : 0;

  // Build Report Data
  return {
    reportType: range.toUpperCase(),
    generatedAt: now.toISOString(),
    streaks: { currentStreak, longestStreak },
    averages: {
      totalLogs,
      avgStress: Math.round(avgStress * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgWater: Math.round(avgWater),
      totalJournals: journals.length
    },
    moodLogs: moods.map(m => ({
      date: m.createdAt.toISOString().split('T')[0],
      mood: m.mood,
      intensity: m.intensity,
      stress: m.stressLevel,
      sleep: m.sleepHours
    })),
    journalLogs: journals.map(j => ({
      date: j.createdAt.toISOString().split('T')[0],
      title: j.title,
      sentiment: j.sentiment,
      wordCount: j.wordCount
    }))
  };
};

/**
 * Compile a comprehensive corporate mental health and wellness summary aggregate.
 */
export const getComprehensiveAnalytics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Fetch user's mood logs
  const moods = await Mood.find({ userId: userObjectId, isDeleted: false });
  const totalMoodLogs = moods.length;

  // 2. Fetch journal entries
  const journals = await JournalEntry.find({ user: userObjectId, isDeleted: false });
  const totalJournalLogs = journals.length;

  // 3. Fetch goals count and completed stats
  const Goal = mongoose.model('Goal');
  const goals = await Goal.find({ userId: userObjectId });
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // 4. Fetch habits list
  const Habit = mongoose.model('Habit');
  const habits = await Habit.find({ userId: userObjectId });
  const totalHabits = habits.length;

  // 5. Fetch wellness records
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const wellnessRecords = await WellnessStats.find({ user: userObjectId, date: { $gte: thirtyDaysAgo } });

  // Calculate habit check-ins consistency (last 30 days)
  let habitCheckInCount = 0;
  habits.forEach(h => {
    const recentCheckIns = h.completedDates.filter(d => {
      const checkInDate = new Date(d);
      return checkInDate >= thirtyDaysAgo;
    });
    habitCheckInCount += recentCheckIns.length;
  });
  const maxPossibleCheckIns = Math.max(1, totalHabits * 30);
  const habitConsistency = totalHabits > 0 ? Math.round((habitCheckInCount / maxPossibleCheckIns) * 100) : 0;

  // Wellness Score: avg stats + habits consistency + goals progress
  const avgWellnessRecordScore = wellnessRecords.length > 0
    ? wellnessRecords.reduce((sum, r) => sum + r.wellnessScore, 0) / wellnessRecords.length
    : 0;

  const finalWellnessScore = totalGoals === 0 && totalHabits === 0 && wellnessRecords.length === 0
    ? 0
    : Math.min(100, Math.round(
        (avgWellnessRecordScore * 0.5) + (habitConsistency * 0.3) + (goalCompletionRate * 0.2)
      ));

  // Mental Health Score: Anxiety, stress, energy levels, journal sentiment
  let avgStress = 0;
  let avgAnxiety = 0;
  let avgEnergy = 0;
  if (totalMoodLogs > 0) {
    avgStress = moods.reduce((sum, m) => sum + m.stressLevel, 0) / totalMoodLogs;
    avgAnxiety = moods.reduce((sum, m) => sum + m.anxietyLevel, 0) / totalMoodLogs;
    avgEnergy = moods.reduce((sum, m) => sum + m.energyLevel, 0) / totalMoodLogs;
  }
  const mentalHealthScore = totalMoodLogs === 0
    ? 0
    : Math.min(100, Math.max(0, Math.round(
        100 - (avgStress * 5) - (avgAnxiety * 4) + (avgEnergy * 3)
      )));

  // Productivity Score: Goal rate (60%) + Habits consistency (40%)
  const productivityScore = totalGoals === 0 && totalHabits === 0
    ? 0
    : Math.min(100, Math.round(
        (goalCompletionRate * 0.6) + (habitConsistency * 0.4)
      ));

  // Journal Frequency: entries per week (entries in last 30 days / 4)
  const recentJournalsCount = journals.filter(j => j.createdAt >= thirtyDaysAgo).length;
  const journalFrequency = totalJournalLogs === 0 ? 0 : parseFloat((recentJournalsCount / 4).toFixed(1));

  // Mood Correlation analytics
  let moodCorrelationText = 'No telemetry data to verify correlations yet.';
  if (totalMoodLogs >= 3) {
    const lowSleepLogs = moods.filter(m => m.sleepHours < 7);
    const highSleepLogs = moods.filter(m => m.sleepHours >= 7);
    const avgStressLowSleep = lowSleepLogs.length > 0 ? lowSleepLogs.reduce((sum, m) => sum + m.stressLevel, 0) / lowSleepLogs.length : 5;
    const avgStressHighSleep = highSleepLogs.length > 0 ? highSleepLogs.reduce((sum, m) => sum + m.stressLevel, 0) / highSleepLogs.length : 5;

    if (avgStressLowSleep > avgStressHighSleep + 1) {
      moodCorrelationText = 'High stress strongly correlates with sleep deprivation (<7 hrs).';
    } else if (avgStressHighSleep > avgStressLowSleep + 1) {
      moodCorrelationText = 'High stress correlates with extended sleep cycles.';
    } else {
      moodCorrelationText = 'Sleep cycles show a stable relationship with stress levels.';
    }
  }

  // Weekly Wellness Summary & Monthly Reports
  const weeklySummary = totalHabits > 0 
    ? `Your physical check-ins are at ${habitConsistency}% consistency. Focus on your "${habits[0]?.habitName || 'water intake'}" target. Stress levels averaged ${avgStress.toFixed(1)}/10.`
    : 'No habits tracked yet. Create a daily habit checklist to begin logging your weekly physical wellness summary.';
  const monthlyReport = totalGoals > 0
    ? `Monthly review: completed ${completedGoals} out of ${totalGoals} active wellness goals. Your Mental Health Index is ${mentalHealthScore}%, indicating stable parameters.`
    : 'No goals set yet. Set daily and weekly goals to compile your monthly reviews.';

  // 6. Fetch Community Metrics
  const Post = mongoose.model('Post');
  const Comment = mongoose.model('Comment');
  
  const postsCreated = await Post.countDocuments({ userId: userObjectId, isDeleted: false });
  const commentsCount = await Comment.countDocuments({ userId: userObjectId });
  
  const likedPosts = await Post.countDocuments({ likes: userObjectId, isDeleted: false });
  const bookmarkedPosts = await Post.countDocuments({ bookmarks: userObjectId, isDeleted: false });
  
  const categoryStats = await Post.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);
  const popularCategory = categoryStats.length > 0 ? categoryStats[0]._id : 'General';

  return {
    wellnessScore: finalWellnessScore,
    mentalHealthScore,
    productivityScore,
    habitConsistency,
    journalFrequency,
    moodCorrelation: moodCorrelationText,
    goalCompletionRate,
    weeklySummary,
    monthlyReport,
    community: {
      postsCreated,
      commentsCount,
      likedPosts,
      bookmarkedPosts,
      popularCategory
    }
  };
};
