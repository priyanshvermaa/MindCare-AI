import Mood from '../models/Mood.js';
import JournalEntry from '../models/JournalEntry.js';
import WellnessStats from '../models/WellnessStats.js';
import Conversation from '../models/Conversation.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import Meditation from '../models/Meditation.js';
import UserMeditation from '../models/UserMeditation.js';
import MeditationHistory from '../models/MeditationHistory.js';
import Notification from '../models/Notification.js';
import WellnessProfile from '../models/WellnessProfile.js';
import DailyWaterSummary from '../models/DailyWaterSummary.js';
import WaterLog from '../models/WaterLog.js';
import { refreshDailySummary } from './waterController.js';
import { clearAICache, generateWellnessAnalysis, getRecommendedSleepRange } from '../services/aiService.js';
import { getComprehensiveAnalytics, calculateStreaks } from '../services/analyticsService.js';
import { generateDashboardInsights } from '../services/grokService.js';

// Helper to get date normalized to midnight
const getMidnightDate = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Calculate wellness score out of 100 based on targets and age
const calculateWellnessScore = (sleep, water, meditation, waterGoal = 2000, age) => {
  const range = getRecommendedSleepRange(age);
  const sleepTargetMin = range.min;
  const sleepScore = Math.min(sleep / sleepTargetMin, 1) * 35; // Target: age-appropriate sleepTargetMin
  const waterScore = Math.min(water / waterGoal, 1) * 35; // Target: waterGoal
  const meditationScore = Math.min(meditation / 15, 1) * 30; // Target: 15 mins
  return Math.round(sleepScore + waterScore + meditationScore);
};

// Helper to get formatted local date (YYYY-MM-DD)
const getFormattedLocalDate = (d = new Date()) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * @desc    Get dashboard metrics for today
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req, res) => {
  const userId = req.user._id;
  const todayMidnight = getMidnightDate();

  try {
    // 1. Get today's latest active mood log
    const entryDate = getFormattedLocalDate();
    const latestMoodToday = await Mood.findOne({ userId, entryDate, isDeleted: false }).sort({ createdAt: -1 });

    // 2. Get today's live water summary (single source of truth in MongoDB)
    let waterSummary = await DailyWaterSummary.findOne({ userId, date: entryDate });
    if (!waterSummary) {
      waterSummary = await refreshDailySummary(userId, entryDate);
    }
    const waterIntake = waterSummary ? waterSummary.totalIntake : 0;
    const waterGoal = waterSummary ? waterSummary.goal : 2000;

    // Get today's wellness stats (or create defaults)
    let todayStats = await WellnessStats.findOne({ user: userId, date: todayMidnight });
    if (!todayStats) {
      todayStats = await WellnessStats.create({
        user: userId,
        date: todayMidnight,
        sleepHours: latestMoodToday ? latestMoodToday.sleepHours : 0,
        waterIntake: waterIntake,
        meditationMinutes: latestMoodToday ? latestMoodToday.meditationMinutes : 0,
        wellnessScore: 0,
      });
    } else {
      // Sync today's stats but avoid overwriting existing higher logs (direct logs)
      if (latestMoodToday) {
        todayStats.sleepHours = Math.max(todayStats.sleepHours || 0, latestMoodToday.sleepHours || 0);
        todayStats.meditationMinutes = Math.max(todayStats.meditationMinutes || 0, latestMoodToday.meditationMinutes || 0);
        
        // Sync back to mood log to ensure consistency
        let moodNeedsSave = false;
        if (latestMoodToday.sleepHours !== todayStats.sleepHours) {
          latestMoodToday.sleepHours = todayStats.sleepHours;
          moodNeedsSave = true;
        }
        if (latestMoodToday.meditationMinutes !== todayStats.meditationMinutes) {
          latestMoodToday.meditationMinutes = todayStats.meditationMinutes;
          moodNeedsSave = true;
        }
        if (moodNeedsSave) {
          await latestMoodToday.save();
        }
      }
      
      todayStats.waterIntake = waterIntake;
    }

    // Sync waterIntake back to mood log if present
    if (latestMoodToday && latestMoodToday.waterIntake !== waterIntake) {
      latestMoodToday.waterIntake = waterIntake;
      await latestMoodToday.save();
    }

    // Always recalculate score and save using the dynamic water goal and age
    todayStats.wellnessScore = calculateWellnessScore(
      todayStats.sleepHours,
      waterIntake,
      todayStats.meditationMinutes,
      waterGoal,
      req.user.age
    );
    await todayStats.save();

    // 3. Count total journals
    const totalJournals = await JournalEntry.countDocuments({ user: userId, isDeleted: false });

    // 4. Count total active mood logs
    const moodCount = await Mood.countDocuments({ userId, isDeleted: false });
    const totalAISessions = moodCount + totalJournals;

    // 5. Calculate streak based on calculateStreaks helper
    const { currentStreak } = await calculateStreaks(userId);
    const streak = currentStreak;

    // 6. Calculate weekly progress percent
    const startOfWeek = getMidnightDate();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const weeklyLogs = await WellnessStats.find({
      user: userId,
      date: { $gte: startOfWeek, $lte: todayMidnight },
    });

    let totalScoreSum = 0;
    weeklyLogs.forEach((w) => {
      totalScoreSum += w.wellnessScore;
    });
    const avgWeeklyProgress = weeklyLogs.length > 0 
      ? Math.round(totalScoreSum / weeklyLogs.length) 
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        todayMood: latestMoodToday ? latestMoodToday.mood : null,
        todayMoodScore: latestMoodToday ? latestMoodToday.score : null,
        todayMoodActivities: [],
        wellnessScore: todayStats.wellnessScore,
        streak,
        journalEntriesCount: totalJournals,
        aiSessionsCount: totalAISessions,
        weeklyProgress: avgWeeklyProgress,
        sleepHours: todayStats.sleepHours,
        waterIntake,
        waterGoal,
        meditationMinutes: todayStats.meditationMinutes,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get dashboard charts datasets
 * @route   GET /api/dashboard/charts
 * @access  Private
 */
export const getChartData = async (req, res) => {
  const userId = req.user._id;

  try {
    // 1. Weekly Mood Trend (last 7 logged entry dates of daily score averages)
    const sevenDaysAgo = getMidnightDate();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyMoodLogs = await Mood.find({
      userId,
      isDeleted: false,
      createdAt: { $gte: sevenDaysAgo },
    });

    const weeklyMoodTrend = [];
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(sevenDaysAgo);
      targetDate.setDate(targetDate.getDate() + i);
      const dayLabel = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
      const targetDateStr = getFormattedLocalDate(targetDate);

      const dayLogs = weeklyMoodLogs.filter((log) => log.entryDate === targetDateStr);

      const avgMood = dayLogs.length > 0
        ? parseFloat((dayLogs.reduce((sum, l) => sum + l.score, 0) / dayLogs.length).toFixed(1))
        : 0;

      // Scale 1-10 down to 1-5 for landing charts or keep 1-10 mapping.
      // Let's divide by 2 for the default 5-point layout representation
      const scaledMood = parseFloat((avgMood / 2).toFixed(1));

      weeklyMoodTrend.push({ day: dayLabel, mood: scaledMood });
    }

    // 2. Mood Distribution (Pie Chart counts mapped to scores groups)
    const distributionLogs = await Mood.find({ userId, isDeleted: false });
    
    // Group scores: 9-10 (Amazing), 7-8 (Happy), 5-6 (Neutral/Okay), 3-4 (Sad), 1-2 (Very Sad)
    const distCounts = { amazing: 0, happy: 0, neutral: 0, sad: 0, verySad: 0 };
    distributionLogs.forEach((log) => {
      if (log.score >= 9) distCounts.amazing++;
      else if (log.score >= 7) distCounts.happy++;
      else if (log.score >= 5) distCounts.neutral++;
      else if (log.score >= 3) distCounts.sad++;
      else distCounts.verySad++;
    });

    const moodDistribution = [
      { name: 'Very Sad (Score 1-2)', value: distCounts.verySad, color: '#f87171' },
      { name: 'Sad (Score 3-4)', value: distCounts.sad, color: '#fb923c' },
      { name: 'Neutral (Score 5-6)', value: distCounts.neutral, color: '#94a3b8' },
      { name: 'Happy (Score 7-8)', value: distCounts.happy, color: '#38bdf8' },
      { name: 'Amazing (Score 9-10)', value: distCounts.amazing, color: '#2dd4bf' },
    ];

    // 3. Monthly Analytics (6-month aggregates of wellness score)
    const monthlyAnalytics = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const checkMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = checkMonth.toLocaleDateString('en-US', { month: 'short' });
      
      const startOfMonth = new Date(checkMonth.getFullYear(), checkMonth.getMonth(), 1);
      const endOfMonth = new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 0, 23, 59, 59);

      const monthStats = await WellnessStats.find({
        user: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const avgWellness = monthStats.length > 0
        ? Math.round(monthStats.reduce((sum, s) => sum + s.wellnessScore, 0) / monthStats.length)
        : 0;

      monthlyAnalytics.push({ month: monthLabel, wellnessScore: avgWellness });
    }

    // 4. Calendar Heatmap (All active logs this year)
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const activeMoods = await Mood.find({
      userId,
      isDeleted: false,
      createdAt: { $gte: startOfYear },
    }).select('entryDate score');

    const calendarHeatmap = activeMoods.map((item) => ({
      date: item.entryDate,
      count: Math.ceil(item.score / 2.5), // Scale 1-10 down to 0-4
    }));

    // 5. Wellness Progress Chart (Line of past 15 days)
    const fifteenDaysAgo = getMidnightDate();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);
    
    const progressStats = await WellnessStats.find({
      user: userId,
      date: { $gte: fifteenDaysAgo },
    }).sort({ date: 1 });

    const wellnessProgress = [];
    for (let i = 0; i < 15; i++) {
      const targetDate = new Date(fifteenDaysAgo);
      targetDate.setDate(targetDate.getDate() + i);
      const formattedDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayStat = progressStats.find(
        (s) => getMidnightDate(s.date).getTime() === getMidnightDate(targetDate).getTime()
      );

      wellnessProgress.push({
        date: formattedDate,
        score: dayStat ? dayStat.wellnessScore : 0,
      });
    }

    res.status(200).json({
      success: true,
      charts: {
        weeklyMoodTrend,
        moodDistribution,
        monthlyAnalytics,
        calendarHeatmap,
        wellnessProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Fetch recent user activity list
 * @route   GET /api/dashboard/activity
 * @access  Private
 */
export const getRecentActivity = async (req, res) => {
  const userId = req.user._id;

  try {
    const recentMoods = await Mood.find({ userId, isDeleted: false }).sort({ createdAt: -1 }).limit(3);
    const recentJournals = await JournalEntry.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 }).limit(3);
    const latestJournal = await JournalEntry.findOne({ user: userId, isDeleted: false }).sort({ createdAt: -1 });

    const activities = [];

    recentMoods.forEach((m) => {
      activities.push({
        type: 'mood',
        title: `Logged Mood: ${m.mood}`,
        desc: `Intensity level: ${m.intensity}/10.`,
        time: m.createdAt,
      });
    });

    recentJournals.forEach((j) => {
      activities.push({
        type: 'journal',
        title: `Wrote CBT Journal: "${j.title}"`,
        desc: `Tag: ${j.sentiment.toUpperCase()}`,
        time: j.createdAt,
      });
    });

    // Sort combined by date descending
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Dynamic AI Wellness Suggestions
    let suggestion = 'Start using MindCare AI to receive personalized insights.';
    if (recentMoods.length > 0) {
      const avgScore = recentMoods.reduce((sum, item) => sum + item.score, 0) / recentMoods.length;
      if (avgScore <= 4) {
        suggestion = "We notice you've been feeling low. Practice a box-breathing exercise to reset your sensory system, or drop a line in the Copilot Chat.";
      } else if (avgScore <= 7) {
        suggestion = 'Doing okay. A 10-minute mindfulness session could help clear stress and elevate cognitive focus.';
      } else {
        suggestion = 'You are feeling great! Document these positive feelings in your Journal to anchor this emotional state.';
      }
    }

    res.status(200).json({
      success: true,
      activities: activities.slice(0, 4),
      aiSuggestion: suggestion,
      latestJournal: latestJournal || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Seeding tool for testing dashboard charts (updated for new Mood Schema)
 * @route   POST /api/dashboard/seed
 * @access  Private
 */
export const seedUserData = async (req, res) => {
  const userId = req.user._id;

  try {
    // Clear old active user data
    await Mood.deleteMany({ userId });
    await JournalEntry.deleteMany({ user: userId });
    await WellnessStats.deleteMany({ user: userId });
    await Habit.deleteMany({ userId });
    await Goal.deleteMany({ userId });
    await UserMeditation.deleteMany({ userId });
    await Notification.deleteMany({ userId });

    const moodOptions = [
      { mood: '😭 Very Sad', score: 1 },
      { mood: '😢 Sad', score: 2 },
      { mood: '😔 Low', score: 3 },
      { mood: '😐 Neutral', score: 4 },
      { mood: '🙂 Okay', score: 5 },
      { mood: '😊 Happy', score: 6 },
      { mood: '😄 Very Happy', score: 7 },
      { mood: '🤩 Excited', score: 8 },
      { mood: '😌 Calm', score: 9 },
      { mood: '😍 Amazing', score: 10 },
    ];

    const waterDates = [];
    const sleepDates = [];
    const meditationDates = [];
    const journalDates = [];

    const journalsToSeed = [
      { dayOffset: 55, title: 'Sprint overload at work', content: 'Feeling stressed and exhausted with the heavy workload. Decided to write down my boundaries.', sentiment: 'exhausted' },
      { dayOffset: 48, title: 'Anxious thoughts returning', content: 'Feeling anxious today. I am practicing cognitive reframing to de-catastrophize the outcome.', sentiment: 'anxious' },
      { dayOffset: 41, title: 'A peaceful walk', content: 'Had a wonderful 30-minute walk. Very calm, and grateful for the nice weather.', sentiment: 'positive' },
      { dayOffset: 34, title: 'Midweek review', content: 'Work is steady. Feeling neutral and balanced. Keeping up with my routine.', sentiment: 'neutral' },
      { dayOffset: 27, title: 'Gratitude journal', content: 'Reflecting on what went well. Genuinely happy and feeling positive about the support system.', sentiment: 'positive' },
      { dayOffset: 20, title: 'Restless night and fatigue', content: 'Woke up tired. My energy is low today. I need to focus on sleep hygiene tonight.', sentiment: 'exhausted' },
      { dayOffset: 13, title: 'Anxious prep', content: 'Worried about the client demo. Using deep breathing to stay focused and grounded.', sentiment: 'anxious' },
      { dayOffset: 6, title: 'Great meditation', content: 'Completed a 15-minute body scan. Feeling calm, centered, and motivated.', sentiment: 'positive' },
      { dayOffset: 2, title: 'Progress check-in', content: 'Felt great challenge response today. Challenged automatic thoughts successfully.', sentiment: 'positive' },
    ];

    // Array of varied water intake values to generate realistic charts
    const waterChoices = [1850, 2200, 1700, 2500, 2400, 1300, 2600, 1900, 2850, 1600, 2100, 1450, 2700, 2300, 1800, 2500, 2200, 1250, 2400, 2050];

    // Query an existing meditation session to seed play history
    const defaultMeditation = await Meditation.findOne();

    // Seed exactly 60 days of data (i = 59 down to 0)
    for (let i = 59; i >= 0; i--) {
      const logDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const logDateStr = getFormattedLocalDate(logDate);
      const logDateTime = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate(), 12, 0, 0);

      // Generate randomized realistic values
      const randSleep = parseFloat((6.0 + Math.random() * 3.0).toFixed(1)); // 6.0 - 9.0 hrs
      const randWater = waterChoices[i % waterChoices.length]; // varying water intake ml
      const randMeditation = Math.round(Math.random() * 30); // 0 - 30 mins

      const score = calculateWellnessScore(randSleep, randWater, randMeditation);

      // Save WellnessStats
      await WellnessStats.create({
        user: userId,
        date: getMidnightDate(logDateTime),
        sleepHours: randSleep,
        waterIntake: randWater,
        meditationMinutes: randMeditation,
        wellnessScore: score,
      });

      // Map score to a realistic mood option
      let selectMood;
      if (score > 85) {
        const idxs = [5, 7, 8, 9]; // Happy, Excited, Calm, Amazing
        selectMood = moodOptions[idxs[Math.floor(Math.random() * idxs.length)]];
      } else if (score > 60) {
        const idxs = [4, 5, 8]; // Okay, Happy, Calm
        selectMood = moodOptions[idxs[Math.floor(Math.random() * idxs.length)]];
      } else if (score > 40) {
        const idxs = [3, 4]; // Neutral, Okay
        selectMood = moodOptions[idxs[Math.floor(Math.random() * idxs.length)]];
      } else {
        const idxs = [0, 1, 2]; // Very Sad, Sad, Low
        selectMood = moodOptions[idxs[Math.floor(Math.random() * idxs.length)]];
      }

      await Mood.create({
        userId,
        mood: selectMood.mood,
        score: selectMood.score,
        intensity: Math.min(selectMood.score + 1, 10),
        stressLevel: Math.max(10 - selectMood.score, 1),
        anxietyLevel: Math.max(9 - selectMood.score, 1),
        energyLevel: Math.min(selectMood.score + 2, 10),
        motivationLevel: Math.min(selectMood.score + 1, 10),
        sleepHours: randSleep,
        waterIntake: randWater,
        meditationMinutes: randMeditation,
        entryDate: logDateStr,
        createdAt: logDateTime,
        updatedAt: logDateTime,
      });

      // Track habit completions
      if (randWater >= 2500) waterDates.push(logDateStr);
      if (randSleep >= 8.0) sleepDates.push(logDateStr);
      if (randMeditation >= 15) meditationDates.push(logDateStr);

      // Create journals spread across 60 days
      for (const j of journalsToSeed) {
        if (i === j.dayOffset) {
          await JournalEntry.create({
            user: userId,
            title: j.title,
            content: j.content,
            sentiment: j.sentiment,
            createdAt: logDateTime,
            updatedAt: logDateTime,
          });
          journalDates.push(logDateStr);
        }
      }

      // Seed meditation history details for recent sessions
      if (defaultMeditation && randMeditation > 0 && i % 3 === 0) {
        await UserMeditation.findOneAndUpdate(
          { userId, meditationId: defaultMeditation._id },
          {
            progress: Math.min(100, Math.round((randMeditation / 15) * 100)),
            currentTime: randMeditation * 60,
            completed: randMeditation >= 15,
            favorite: i % 7 === 0,
            minutesCompleted: randMeditation,
            lastPlayed: logDateTime
          },
          { upsert: true, new: true }
        );
      }
    }

    const todayStr = getFormattedLocalDate();

    const getHabitStreaks = (dates, todayStr) => {
      if (dates.length === 0) return { streak: 0, longestStreak: 0 };
      const sorted = [...dates].sort();
      let longestStreak = 0;
      let currentStreak = 0;
      let tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
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
      const lastDate = new Date(sorted[sorted.length - 1]);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        currentStreak = tempStreak;
      } else {
        currentStreak = 0;
      }
      return { streak: currentStreak, longestStreak };
    };

    // Seed 4 default habits with computed streaks
    const h1Streaks = getHabitStreaks(waterDates, todayStr);
    await Habit.create({
      userId,
      habitName: 'Drink 2.5L of Water',
      category: 'Hydration',
      target: 2500,
      completed: waterDates.includes(todayStr),
      streak: h1Streaks.streak,
      longestStreak: h1Streaks.longestStreak,
      completedDates: waterDates,
    });

    const h2Streaks = getHabitStreaks(sleepDates, todayStr);
    await Habit.create({
      userId,
      habitName: '8 Hours of Sleep',
      category: 'Sleep',
      target: 8,
      completed: sleepDates.includes(todayStr),
      streak: h2Streaks.streak,
      longestStreak: h2Streaks.longestStreak,
      completedDates: sleepDates,
    });

    const h3Streaks = getHabitStreaks(meditationDates, todayStr);
    await Habit.create({
      userId,
      habitName: '15 min Meditation',
      category: 'Meditation',
      target: 15,
      completed: meditationDates.includes(todayStr),
      streak: h3Streaks.streak,
      longestStreak: h3Streaks.longestStreak,
      completedDates: meditationDates,
    });

    const h4Streaks = getHabitStreaks(journalDates, todayStr);
    await Habit.create({
      userId,
      habitName: 'Daily CBT Journaling',
      category: 'Mental',
      target: 1,
      completed: journalDates.includes(todayStr),
      streak: h4Streaks.streak,
      longestStreak: h4Streaks.longestStreak,
      completedDates: journalDates,
    });

    // Seed Goals
    await Goal.create({
      userId,
      title: 'Complete 5 CBT Journal entries',
      description: 'Build a solid thought reframing habit to de-catastrophize anxieties.',
      category: 'Mindfulness',
      priority: 'high',
      completed: true,
      targetDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });
    await Goal.create({
      userId,
      title: 'Practice box breathing 3 times a week',
      description: 'Use the 4-4-4-4 breathing cycle to manage quick panic attacks.',
      category: 'Mental',
      priority: 'medium',
      completed: true,
      targetDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });
    await Goal.create({
      userId,
      title: 'Improve average sleep to 7.5 hours',
      description: 'Log and track night sleep duration to hit wellness score.',
      category: 'Physical',
      priority: 'high',
      completed: false,
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    // Seed User Reminders / Notifications
    await Notification.create([
      { userId, title: 'Hydration Challenge', message: 'You have logged water logs for 3 consecutive days! Keep it up.', type: 'milestone', read: false },
      { userId, title: 'Daily Wellness Check', message: 'It\'s time to record your mood state and sleep patterns.', type: 'info', read: false },
      { userId, title: 'Reflection Reminder', message: 'You logged a highly reflective journal entry yesterday. Check your analysis.', type: 'analytics', read: true }
    ]);

    res.status(200).json({
      success: true,
      message: 'Realistic 60-day user telemetry logs successfully seeded! Reload your dashboard to view the trends.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Log today's mood (simple version for dashboard modals)
 * @route   POST /api/dashboard/mood
 * @access  Private
 */
export const logMood = async (req, res) => {
  const userId = req.user._id;
  const { mood, activities } = req.body;
  const entryDate = getFormattedLocalDate();

  const moodMapping3 = {
    1: '😭 Very Sad',
    2: '😢 Sad',
    3: '😐 Neutral',
    4: '😊 Happy',
    5: '😍 Amazing',
  };

  const selectedMood = moodMapping3[mood] || '😐 Neutral';
  const score = parseInt(mood, 10) * 2;

  try {
    const existingEntry = await Mood.findOne({ userId, entryDate, isDeleted: false });
    if (existingEntry) {
      existingEntry.mood = selectedMood;
      existingEntry.score = score;
      existingEntry.intensity = score;
      await existingEntry.save();
      return res.status(200).json({
        success: true,
        message: 'Mood successfully updated!',
        log: existingEntry,
      });
    }

    const newMood = await Mood.create({
      userId,
      mood: selectedMood,
      score,
      intensity: score,
      stressLevel: 3,
      anxietyLevel: 3,
      energyLevel: 5,
      motivationLevel: 5,
      entryDate,
    });

    res.status(201).json({
      success: true,
      message: 'Mood successfully logged!',
      log: newMood,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Write a CBT journal entry
 * @route   POST /api/dashboard/journal
 * @access  Private
 */
export const logJournal = async (req, res) => {
  const userId = req.user._id;
  const { title, content, reflection, category, mood, tags } = req.body;

  const actualContent = content || reflection;

  if (!title || !actualContent) {
    return res.status(400).json({ message: 'Title and content/reflection are required.' });
  }

  let sentiment = 'neutral';
  const lowercaseContent = actualContent.toLowerCase();

  if (
    lowercaseContent.includes('stressed') ||
    lowercaseContent.includes('burnout') ||
    lowercaseContent.includes('exhausted') ||
    lowercaseContent.includes('tired')
  ) {
    sentiment = 'exhausted';
  } else if (
    lowercaseContent.includes('anxious') ||
    lowercaseContent.includes('overwhelmed') ||
    lowercaseContent.includes('scared') ||
    lowercaseContent.includes('worried')
  ) {
    sentiment = 'anxious';
  } else if (
    lowercaseContent.includes('happy') ||
    lowercaseContent.includes('calm') ||
    lowercaseContent.includes('relax') ||
    lowercaseContent.includes('good') ||
    lowercaseContent.includes('grateful')
  ) {
    sentiment = 'positive';
  }

  try {
    const newEntry = await JournalEntry.create({
      user: userId,
      title: title.trim(),
      content: actualContent,
      category: category || 'free-writing',
      mood: mood || null,
      tags: Array.isArray(tags) ? tags : [],
      sentiment,
    });

    clearAICache(userId);

    res.status(201).json({
      success: true,
      message: 'Journal entry successfully saved!',
      entry: newEntry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Log today's physical activities (sleep, water, meditation)
 * @route   POST /api/dashboard/activity
 * @access  Private
 */
export const logWellness = async (req, res) => {
  const userId = req.user._id;
  const { sleepHours, waterIntake, meditationMinutes } = req.body;
  const todayMidnight = getMidnightDate();
  const todayStr = getFormattedLocalDate();

  try {
    // 1. If waterIntake is provided, update the single source of truth (WaterLog & DailyWaterSummary)
    if (waterIntake !== undefined) {
      let waterSummary = await DailyWaterSummary.findOne({ userId, date: todayStr });
      const currentIntake = waterSummary ? waterSummary.totalIntake : 0;

      if (parseInt(waterIntake, 10) !== currentIntake) {
        if (parseInt(waterIntake, 10) === 0) {
          await WaterLog.updateMany({ userId, date: todayStr, deleted: false }, { deleted: true });
        } else {
          await WaterLog.updateMany({ userId, date: todayStr, deleted: false }, { deleted: true });
          
          const getFormattedLocalTime = (d = new Date()) => {
            const date = new Date(d);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
          };

          await WaterLog.create({
            userId,
            amount: parseInt(waterIntake, 10),
            unit: 'ml',
            date: todayStr,
            time: getFormattedLocalTime(),
            notes: 'Logged via Wellness Dashboard',
          });
        }

        // refreshDailySummary updates summary, streaks, and syncs WellnessStats.waterIntake
        await refreshDailySummary(userId, todayStr);
        clearAICache(userId);
      }
    }

    // 2. Load the updated wellness stats (which now has updated waterIntake synced)
    let stats = await WellnessStats.findOne({ user: userId, date: todayMidnight });

    const newSleep = sleepHours !== undefined ? parseFloat(sleepHours) : (stats ? stats.sleepHours : 0);
    const newMeditation = meditationMinutes !== undefined ? parseInt(meditationMinutes, 10) : (stats ? stats.meditationMinutes : 0);

    // Fetch live water summary values
    let waterSummary = await DailyWaterSummary.findOne({ userId, date: todayStr });
    const finalWaterIntake = waterSummary ? waterSummary.totalIntake : 0;
    const finalWaterGoal = waterSummary ? waterSummary.goal : 2000;

    const calculatedScore = calculateWellnessScore(newSleep, finalWaterIntake, newMeditation, finalWaterGoal, req.user.age);

    if (stats) {
      stats.sleepHours = newSleep;
      stats.waterIntake = finalWaterIntake;
      stats.meditationMinutes = newMeditation;
      stats.wellnessScore = calculatedScore;
      await stats.save();
    } else {
      stats = await WellnessStats.create({
        user: userId,
        date: todayMidnight,
        sleepHours: newSleep,
        waterIntake: finalWaterIntake,
        meditationMinutes: newMeditation,
        wellnessScore: calculatedScore,
      });
    }

    // Sync waterIntake and other fields back to mood log if present
    const latestMoodToday = await Mood.findOne({ userId, entryDate: todayStr, isDeleted: false }).sort({ createdAt: -1 });
    if (latestMoodToday) {
      let moodNeedsSave = false;
      if (latestMoodToday.sleepHours !== newSleep) {
        latestMoodToday.sleepHours = newSleep;
        moodNeedsSave = true;
      }
      if (latestMoodToday.waterIntake !== finalWaterIntake) {
        latestMoodToday.waterIntake = finalWaterIntake;
        moodNeedsSave = true;
      }
      if (latestMoodToday.meditationMinutes !== newMeditation) {
        latestMoodToday.meditationMinutes = newMeditation;
        moodNeedsSave = true;
      }
      if (moodNeedsSave) {
        await latestMoodToday.save();
      }
    }

    // Update Sleep Habit
    if (sleepHours !== undefined) {
      try {
        const habit = await Habit.findOne({ userId, category: 'Sleep' });
        if (habit) {
          const target = habit.target || 8;
          if (newSleep >= target && !habit.completedDates.includes(todayStr)) {
            habit.completed = true;
            habit.completedDates.push(todayStr);

            // Recompute streak
            const sorted = [...habit.completedDates].sort();
            let tempStreak = 1;
            let longestStreak = habit.longestStreak || 1;
            for (let idx = 1; idx < sorted.length; idx++) {
              const prev = new Date(sorted[idx - 1]);
              const curr = new Date(sorted[idx]);
              const diffTime = Math.abs(curr - prev);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 1) tempStreak++;
              else if (diffDays > 1) tempStreak = 1;
              if (tempStreak > longestStreak) longestStreak = tempStreak;
            }
            habit.streak = tempStreak;
            habit.longestStreak = longestStreak;
            await habit.save();
          }
        }
      } catch (err) {
        console.warn('Could not update habit for sleep:', err.message);
      }
    }

    // Update Meditation Habit
    if (meditationMinutes !== undefined) {
      try {
        const habit = await Habit.findOne({ userId, category: 'Meditation' });
        if (habit) {
          const target = habit.target || 15;
          if (newMeditation >= target && !habit.completedDates.includes(todayStr)) {
            habit.completed = true;
            habit.completedDates.push(todayStr);

            // Recompute streak
            const sorted = [...habit.completedDates].sort();
            let tempStreak = 1;
            let longestStreak = habit.longestStreak || 1;
            for (let idx = 1; idx < sorted.length; idx++) {
              const prev = new Date(sorted[idx - 1]);
              const curr = new Date(sorted[idx]);
              const diffTime = Math.abs(curr - prev);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 1) tempStreak++;
              else if (diffDays > 1) tempStreak = 1;
              if (tempStreak > longestStreak) longestStreak = tempStreak;
            }
            habit.streak = tempStreak;
            habit.longestStreak = longestStreak;
            await habit.save();
          }
        }
      } catch (err) {
        console.warn('Could not update habit for meditation:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Wellness statistics successfully updated!',
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Fetch AI wellness tip, insight, suggested activity, and last conversation link
 * @route   GET /api/dashboard/ai-wellness
 * @access  Private
 */
export const getAIDashboardWellness = async (req, res) => {
  const userId = req.user._id;

  try {
    const [
      moodCount,
      journalCount,
      waterCount,
      meditationCount,
      sleepCount,
      habitCount
    ] = await Promise.all([
      Mood.countDocuments({ userId, isDeleted: { $ne: true } }),
      JournalEntry.countDocuments({ user: userId }),
      WaterLog.countDocuments({ userId }),
      MeditationHistory.countDocuments({ userId }),
      WellnessStats.countDocuments({ user: userId, sleepHours: { $gt: 0 } }),
      Habit.countDocuments({ userId, completedDates: { $not: { $size: 0 } } })
    ]);

    const totalLogs = moodCount + journalCount + waterCount + meditationCount + sleepCount + habitCount;
    if (totalLogs === 0) {
      const defaultAnalysis = {
        overallWellnessSummary: "• No telemetry data logged yet\n• Start tracking metrics to see AI insights",
        currentWellnessStatus: "No telemetry data logged yet.",
        topPositiveHabit: "No habits tracked yet",
        biggestAreaForImprovement: "No data",
        sleepAnalysis: "No sleep data",
        moodTrend: "No mood logged yet",
        hydrationAnalysis: "No hydration data",
        journalAnalysis: "No entries",
        exerciseAnalysis: "No data",
        meditationAnalysis: "No data",
        habitConsistency: "No data",
        overallWellnessScore: 0,
        personalizedRecommendations: [
          "Log your mood daily to help track resilience triggers.",
          "Track your hydration intake.",
          "Record your sleep hours."
        ],
        nextBestAction: "Complete your first daily check-in."
      };
      const responsePayload = {
        success: true,
        hasInsights: false,
        wellnessAnalysis: defaultAnalysis,
        wellnessTip: defaultAnalysis.overallWellnessSummary,
        dailyInsight: defaultAnalysis.moodTrend,
        suggestedActivity: defaultAnalysis.nextBestAction,
        lastConversation: null
      };
      return res.status(200).json({
        ...responsePayload,
        data: responsePayload
      });
    }

    const wellnessAnalysis = await generateWellnessAnalysis(userId);

    // Fetch user's latest conversation
    const lastChat = await Conversation.findOne({ userId })
      .sort({ updatedAt: -1 })
      .select('_id title updatedAt');

    const responsePayload = {
      success: true,
      wellnessAnalysis,
      wellnessTip: wellnessAnalysis.overallWellnessSummary || wellnessAnalysis.personalizedRecommendation,
      dailyInsight: wellnessAnalysis.moodTrend || wellnessAnalysis.todaySummary,
      suggestedActivity: wellnessAnalysis.nextBestAction || wellnessAnalysis.meditationSummary,
      lastConversation: lastChat || null
    };

    res.status(200).json({
      ...responsePayload,
      data: responsePayload
    });
  } catch (error) {
    console.error("AI Wellness Error:", error);
    res.status(200).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Log water intake (adds to today's total)
 * @route   POST /api/dashboard/water
 * @access  Private
 */
export const logWater = async (req, res) => {
  const userId = req.user._id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Water amount must be a positive number.' });
  }

  const todayStr = getFormattedLocalDate();

  try {
    const getFormattedLocalTime = (d = new Date()) => {
      const date = new Date(d);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    // Log the water entry
    await WaterLog.create({
      userId,
      amount: parseInt(amount, 10),
      unit: 'ml',
      date: todayStr,
      time: getFormattedLocalTime(),
      notes: 'Logged via Wellness Dashboard API',
    });

    // Refresh today's summary
    const summary = await refreshDailySummary(userId, todayStr);

    // Clear AI insights cache
    clearAICache(userId);

    // Also update Habit "Drink 2.5L of Water" or checklist target if it exists
    const newWater = summary.totalIntake;
    try {
      const habit = await Habit.findOne({ userId, category: 'Hydration' });
      if (habit) {
        if (!habit.completedDates.includes(todayStr)) {
          const target = habit.target || 2500;
          if (newWater >= target) {
            habit.completed = true;
            habit.completedDates.push(todayStr);

            // Recompute streak
            const sorted = [...habit.completedDates].sort();
            let tempStreak = 1;
            let longestStreak = habit.longestStreak || 1;
            for (let idx = 1; idx < sorted.length; idx++) {
              const prev = new Date(sorted[idx - 1]);
              const curr = new Date(sorted[idx]);
              const diffTime = Math.abs(curr - prev);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 1) tempStreak++;
              else if (diffDays > 1) tempStreak = 1;
              if (tempStreak > longestStreak) longestStreak = tempStreak;
            }
            habit.streak = tempStreak;
            habit.longestStreak = longestStreak;
          }
        }
        await habit.save();
      }
    } catch (habitErr) {
      console.warn('Could not update habit for water intake:', habitErr.message);
    }

    // Update general user wellness profiles if needed
    try {
      let profile = await WellnessProfile.findOne({ userId });
      if (profile) {
        profile.dailyWaterIntake = newWater;
        await profile.save();
      }
    } catch (profErr) {
      // Degrade gracefully
    }

    const todayMidnight = getMidnightDate();
    const stats = await WellnessStats.findOne({ user: userId, date: todayMidnight });

    res.status(200).json({
      success: true,
      message: 'Water intake logged successfully!',
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


