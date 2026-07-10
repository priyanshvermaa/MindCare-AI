import WaterLog from '../models/WaterLog.js';
import DailyWaterSummary from '../models/DailyWaterSummary.js';
import WellnessStats from '../models/WellnessStats.js';
import Mood from '../models/Mood.js';
import Habit from '../models/Habit.js';
import User from '../models/User.js';
import { callGrokCompletions } from '../services/grokService.js';
import { clearAICache, getRecommendedSleepRange } from '../services/aiService.js';

// Local date/time formatting helpers
const getFormattedLocalDate = (d = new Date()) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFormattedLocalTime = (d = new Date()) => {
  const date = new Date(d);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Sync with dashboard WellnessStats
const syncWellnessStats = async (userId, dateStr, totalIntake) => {
  try {
    const dateObj = new Date(dateStr + 'T00:00:00');
    let stats = await WellnessStats.findOne({ user: userId, date: dateObj });
    
    const sleep = stats ? stats.sleepHours : 0;
    const meditation = stats ? stats.meditationMinutes : 0;
    
    // Fetch user age from database to get age-appropriate sleep recommendations
    const user = await User.findById(userId);
    const age = user ? user.age : null;
    const range = getRecommendedSleepRange(age);
    const sleepTargetMin = range.min;
    
    // Recalculate wellness score (out of 100)
    const sleepScore = Math.min(sleep / sleepTargetMin, 1) * 35; // Target: age-appropriate sleepTargetMin
    const waterScore = Math.min(totalIntake / 2000, 1) * 35; // Target: 2000 ml
    const meditationScore = Math.min(meditation / 15, 1) * 30; // Target: 15 mins
    const wellnessScore = Math.round(sleepScore + waterScore + meditationScore);
    
    if (stats) {
      stats.waterIntake = totalIntake;
      stats.wellnessScore = wellnessScore;
      await stats.save();
    } else {
      await WellnessStats.create({
        user: userId,
        date: dateObj,
        sleepHours: 0,
        waterIntake: totalIntake,
        meditationMinutes: 0,
        wellnessScore: wellnessScore,
      });
    }
  } catch (error) {
    console.error('Failed to sync WellnessStats:', error.message);
  }
};

// Helper to calculate streaks
const calculateWaterStreak = async (userId, todayStr) => {
  try {
    const summaries = await DailyWaterSummary.find({ userId, goalAchieved: true }).select('date');
    const achievedDates = new Set(summaries.map((s) => s.date));

    let currentStreak = 0;
    let date = new Date(todayStr);

    // 1. Calculate current streak
    const formattedToday = getFormattedLocalDate(date);
    if (achievedDates.has(formattedToday)) {
      currentStreak++;
      while (true) {
        date.setDate(date.getDate() - 1);
        const prevStr = getFormattedLocalDate(date);
        if (achievedDates.has(prevStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      // Check yesterday
      date.setDate(date.getDate() - 1);
      const yesterdayStr = getFormattedLocalDate(date);
      if (achievedDates.has(yesterdayStr)) {
        currentStreak++;
        while (true) {
          date.setDate(date.getDate() - 1);
          const prevStr = getFormattedLocalDate(date);
          if (achievedDates.has(prevStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // 2. Calculate longest streak
    const sortedDates = Array.from(achievedDates).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevTime = null;

    for (let i = 0; i < sortedDates.length; i++) {
      const currTime = new Date(sortedDates[i]);
      if (prevTime === null) {
        tempStreak = 1;
      } else {
        const diffTime = Math.abs(currTime - prevTime);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      prevTime = currTime;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  } catch (err) {
    console.error('Error calculating streaks:', err.message);
    return { currentStreak: 0, longestStreak: 0 };
  }
};

// Re-aggregate and update summary for a given day
export const refreshDailySummary = async (userId, dateStr) => {
  const activeLogs = await WaterLog.find({ userId, date: dateStr, deleted: false });
  let totalIntake = 0;
  let lastDrinkTime = '';

  activeLogs.forEach((log) => {
    totalIntake += log.amount;
    // Update last drink time to the latest log
    if (!lastDrinkTime || log.time > lastDrinkTime) {
      lastDrinkTime = log.time;
    }
  });

  let summary = await DailyWaterSummary.findOne({ userId, date: dateStr });
  const goal = summary ? summary.goal : 2000;
  const remaining = Math.max(0, goal - totalIntake);
  const percentage = Math.round((totalIntake / goal) * 100);
  const goalAchieved = totalIntake >= goal;

  if (summary) {
    summary.totalIntake = totalIntake;
    summary.remaining = remaining;
    summary.percentage = percentage;
    summary.goalAchieved = goalAchieved;
    summary.numberOfEntries = activeLogs.length;
    summary.lastDrinkTime = lastDrinkTime;
    await summary.save();
  } else {
    summary = await DailyWaterSummary.create({
      userId,
      date: dateStr,
      goal,
      totalIntake,
      remaining,
      percentage,
      goalAchieved,
      numberOfEntries: activeLogs.length,
      lastDrinkTime,
      streak: 0,
    });
  }

  // Recalculate streak and update
  const { currentStreak } = await calculateWaterStreak(userId, getFormattedLocalDate());
  summary.streak = currentStreak;
  await summary.save();

  // Sync dashboard
  await syncWellnessStats(userId, dateStr, totalIntake);

  return summary;
};

/**
 * @desc    Add water intake
 * @route   POST /api/water/add
 * @access  Private
 */
export const addWater = async (req, res) => {
  const userId = req.user._id;
  const { amount, notes, date: customDate } = req.body;

  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Intake amount must be a positive number.' });
  }

  try {
    const today = new Date();
    const date = customDate || getFormattedLocalDate(today);
    const time = getFormattedLocalTime(today);

    // Save WaterLog
    const log = await WaterLog.create({
      userId,
      amount: parseInt(amount, 10),
      unit: 'ml',
      date,
      time,
      notes: notes || '',
    });

    // Refresh summary
    const summary = await refreshDailySummary(userId, date);

    // Clear AI insights cache for the user
    clearAICache(userId);

    res.status(201).json({
      success: true,
      message: 'Water logged successfully',
      log,
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get today's water summary and logs
 * @route   GET /api/water/today
 * @access  Private
 */
export const getTodayWater = async (req, res) => {
  const userId = req.user._id;
  const todayStr = req.query.date || getFormattedLocalDate();

  try {
    let summary = await DailyWaterSummary.findOne({ userId, date: todayStr });
    if (!summary) {
      summary = await refreshDailySummary(userId, todayStr);
    }

    const logs = await WaterLog.find({ userId, date: todayStr, deleted: false }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      summary,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all water logs history
 * @route   GET /api/water/history
 * @access  Private
 */
export const getWaterHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const logs = await WaterLog.find({ userId, deleted: false }).sort({ timestamp: -1 });
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get 7 days aggregation for bar charts
 * @route   GET /api/water/weekly
 * @access  Private
 */
export const getWeeklyWater = async (req, res) => {
  const userId = req.user._id;

  try {
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getFormattedLocalDate(d);

      const summary = await DailyWaterSummary.findOne({ userId, date: dateStr });
      weeklyData.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
        amount: summary ? summary.totalIntake : 0,
        goal: summary ? summary.goal : 2000,
      });
    }

    res.status(200).json({ success: true, data: weeklyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get 30 days aggregation for analytics
 * @route   GET /api/water/monthly
 * @access  Private
 */
export const getMonthlyWater = async (req, res) => {
  const userId = req.user._id;

  try {
    const monthlyData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getFormattedLocalDate(d);

      const summary = await DailyWaterSummary.findOne({ userId, date: dateStr });
      monthlyData.push({
        day: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        date: dateStr,
        amount: summary ? summary.totalIntake : 0,
        goal: summary ? summary.goal : 2000,
      });
    }

    res.status(200).json({ success: true, data: monthlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get dashboard statistics & AI Insights
 * @route   GET /api/water/stats
 * @access  Private
 */
export const getWaterStats = async (req, res) => {
  const userId = req.user._id;
  const todayStr = getFormattedLocalDate();

  try {
    // 1. Get streaks
    const { currentStreak, longestStreak } = await calculateWaterStreak(userId, todayStr);

    // 2. Fetch today's summary
    let todaySummary = await DailyWaterSummary.findOne({ userId, date: todayStr });
    if (!todaySummary) {
      todaySummary = await refreshDailySummary(userId, todayStr);
    }

    // 3. Fetch past 30 days summaries for metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const thirtyDaysAgoStr = getFormattedLocalDate(thirtyDaysAgo);

    const pastSummaries = await DailyWaterSummary.find({
      userId,
      date: { $gte: thirtyDaysAgoStr, $lte: todayStr },
    });

    const totalIntakeAll = pastSummaries.reduce((sum, s) => sum + s.totalIntake, 0);
    const activeDaysCount = pastSummaries.length || 1;
    const avgDailyIntake = Math.round(totalIntakeAll / activeDaysCount);

    // Best Day
    let bestDayDate = todayStr;
    let bestDayAmount = todaySummary.totalIntake;
    pastSummaries.forEach((s) => {
      if (s.totalIntake > bestDayAmount) {
        bestDayAmount = s.totalIntake;
        bestDayDate = s.date;
      }
    });

    // Lowest Day
    let lowestDayDate = todayStr;
    let lowestDayAmount = todaySummary.totalIntake;
    pastSummaries.forEach((s) => {
      if (s.totalIntake < lowestDayAmount) {
        lowestDayAmount = s.totalIntake;
        lowestDayDate = s.date;
      }
    });

    // Weekly Total (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = getFormattedLocalDate(sevenDaysAgo);
    
    const weeklySummaries = pastSummaries.filter((s) => s.date >= sevenDaysAgoStr);
    const weeklyTotal = weeklySummaries.reduce((sum, s) => sum + s.totalIntake, 0);
    const avg7DayIntake = Math.round(weeklyTotal / 7);

    // Goal Completion Rate % (in the last 30 days)
    const completedDays = pastSummaries.filter((s) => s.goalAchieved).length;
    const goalCompletionRate = Math.round((completedDays / activeDaysCount) * 100);

    // 4. Retrieve Context for AI Analysis (Mood, Sleep, habits)
    const todayMidnight = new Date(todayStr + 'T00:00:00');
    const sleepStats = await WellnessStats.findOne({ user: userId, date: todayMidnight });
    const latestMood = await Mood.findOne({ userId, entryDate: todayStr, isDeleted: false }).sort({ createdAt: -1 });
    const userHabits = await Habit.find({ userId, category: 'Hydration' });

    // 5. Generate AI insights via Groq/Grok
    const aiPrompt = `
      You are the MindCare AI Hydration Specialist. Analyze the user's hydration profile and wellness telemetry:
      - Today's Water Intake: ${todaySummary.totalIntake} ml (Goal: ${todaySummary.goal} ml)
      - Current Streak: ${currentStreak} days (Longest: ${longestStreak} days)
      - Weekly Intake Total: ${weeklyTotal} ml (7-day average: ${avg7DayIntake} ml)
      - Monthly Goal Completion Rate: ${goalCompletionRate}%
      - Sleep last night: ${sleepStats ? sleepStats.sleepHours : 'Unlogged'} hours
      - Today's Mood: ${latestMood ? latestMood.mood : 'Unlogged'} (Stress Level: ${latestMood ? latestMood.stressLevel : 'Unlogged'}/10)
      - Hydration Habits config: ${userHabits.length > 0 ? 'User has a customized hydration habit configured' : 'None'}

      Generate a raw JSON object containing exactly these fields (do not wrap in markdown or block code, just return raw JSON):
      {
        "hydrationScore": <Number: Hydration score from 0-100 based on progress, streaks, sleep, and stress levels. Limit to number.>,
        "dailySummary": "<String: Short 1-sentence assessment of their current progress.>",
        "recommendation": "<String: Actionable 1-sentence recommendation on how much to drink or timing.>",
        "motivationalMessage": "<String: Inspiring sentence about water intake boosting energy, sleep, or mood.>",
        "goalStatus": "<String: Short phrase summarizing goal progression.>",
        "healthTip": "<String: A brief, scientifically supported health tip about hydration.>",
        "healthWarnings": "<String: Any warning about high stress, low sleep + low water, or dehydrating symptoms, or leave empty if none.>"
      }
    `;

    let aiInsights = null;
    try {
      const responseText = await callGrokCompletions(
        [
          { role: 'system', content: 'You are a professional medical wellness and hydration AI analyzer. You output ONLY raw JSON.' },
          { role: 'user', content: aiPrompt },
        ],
        { temperature: 0.6, response_format: { type: 'json_object' } }
      );

      if (responseText) {
        aiInsights = JSON.parse(responseText);
      }
    } catch (aiErr) {
      console.warn('AI completions failed for hydration stats:', aiErr.message);
    }

    // Dynamic Context-Based Fallback Generator (if AI fails or xAI key is offline)
    if (!aiInsights) {
      const remainingMl = todaySummary.remaining;
      const percentage = todaySummary.percentage;
      let hydrationScore = Math.min(100, Math.round((todaySummary.totalIntake / todaySummary.goal) * 70 + (currentStreak > 0 ? 30 : 0)));
      let dailySummary = `You have completed ${percentage}% of your hydration goal today.`;
      let recommendation = `Keep a water bottle nearby and sip consistently throughout the day.`;
      let motivationalMessage = `Hydration keeps your brain sharp and helps manage daily workplace stress!`;
      let healthTip = `Drinking water aids digestion, nutrient absorption, and skin elasticity.`;
      let healthWarnings = ``;

      if (percentage >= 100) {
        dailySummary = `Amazing work! You've achieved your daily goal of ${todaySummary.goal}ml.`;
        recommendation = `You have met your goal. Drink water if you feel thirsty, but no need to force more.`;
        motivationalMessage = `Goal achieved! Your body and mind are primed for peak performance today.`;
      } else if (percentage >= 70) {
        dailySummary = `Great progress today. You are at ${percentage}% and almost there.`;
        recommendation = `Try to drink ${remainingMl}ml more before your wind-down routine.`;
      }

      if (sleepStats && sleepStats.sleepHours < 6 && todaySummary.totalIntake < 1000) {
        healthWarnings = `Consistent sleep deficits and low water intake can compound fatigue. Boost hydration immediately.`;
        hydrationScore = Math.max(10, hydrationScore - 15);
      } else if (latestMood && latestMood.stressLevel > 7) {
        healthWarnings = `High stress levels detected. Taking a micro-break for a glass of water can help calm your nervous system.`;
      }

      aiInsights = {
        hydrationScore,
        dailySummary,
        recommendation,
        motivationalMessage,
        goalStatus: percentage >= 100 ? 'Goal Achieved' : `${remainingMl} ml remaining`,
        healthTip,
        healthWarnings,
      };
    }

    res.status(200).json({
      success: true,
      stats: {
        todayIntake: todaySummary.totalIntake,
        goal: todaySummary.goal,
        remaining: todaySummary.remaining,
        percentage: todaySummary.percentage,
        goalAchieved: todaySummary.goalAchieved,
        streak: currentStreak,
        longestStreak,
        avg7DayIntake,
        weeklyTotal,
        monthlyTotal: totalIntakeAll,
        goalCompletionRate,
        avgDailyIntake,
        bestDay: {
          date: bestDayDate,
          amount: bestDayAmount,
        },
        lowestDay: {
          date: lowestDayDate,
          amount: lowestDayAmount,
        },
      },
      aiInsights,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update water log entry
 * @route   PATCH /api/water/update/:id
 * @access  Private
 */
export const updateWater = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { amount, notes } = req.body;

  if (amount !== undefined && amount <= 0) {
    return res.status(400).json({ success: false, message: 'Intake amount must be a positive number.' });
  }

  try {
    const log = await WaterLog.findOne({ _id: id, userId });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Water log entry not found' });
    }

    if (amount !== undefined) log.amount = parseInt(amount, 10);
    if (notes !== undefined) log.notes = notes;

    await log.save();

    // Recompute summaries for that date
    const summary = await refreshDailySummary(userId, log.date);

    // Clear AI insights cache for the user
    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: 'Water log updated successfully',
      log,
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete water log entry (soft delete)
 * @route   DELETE /api/water/delete/:id
 * @access  Private
 */
export const deleteWater = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const log = await WaterLog.findOne({ _id: id, userId });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Water log entry not found' });
    }

    // Set deleted flag
    log.deleted = true;
    await log.save();

    // Recompute summaries for that date
    const summary = await refreshDailySummary(userId, log.date);

    // Clear AI insights cache for the user
    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: 'Water log entry deleted successfully',
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reset today's water intake
 * @route   POST /api/water/reset
 * @access  Private
 */
export const resetTodayWater = async (req, res) => {
  const userId = req.user._id;
  const todayStr = getFormattedLocalDate();

  try {
    // Soft delete all logs today
    await WaterLog.updateMany({ userId, date: todayStr, deleted: false }, { deleted: true });

    // Refresh today's summary
    const summary = await refreshDailySummary(userId, todayStr);

    // Clear AI insights cache for the user
    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: "Today's water intake reset successfully",
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Set custom daily goal
 * @route   POST /api/water/goal
 * @access  Private
 */
export const setDailyGoal = async (req, res) => {
  const userId = req.user._id;
  const { goal } = req.body;

  if (goal === undefined || goal <= 0) {
    return res.status(400).json({ success: false, message: 'Daily water goal must be a positive number.' });
  }

  const todayStr = getFormattedLocalDate();

  try {
    let summary = await DailyWaterSummary.findOne({ userId, date: todayStr });
    if (summary) {
      summary.goal = parseInt(goal, 10);
      summary.remaining = Math.max(0, summary.goal - summary.totalIntake);
      summary.percentage = Math.round((summary.totalIntake / summary.goal) * 100);
      summary.goalAchieved = summary.totalIntake >= summary.goal;
      await summary.save();
    } else {
      summary = await DailyWaterSummary.create({
        userId,
        date: todayStr,
        goal: parseInt(goal, 10),
        totalIntake: 0,
        remaining: parseInt(goal, 10),
        percentage: 0,
        goalAchieved: false,
      });
    }

    // Refresh to update streaks & WellnessStats
    summary = await refreshDailySummary(userId, todayStr);

    // Clear AI insights cache for the user
    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: 'Daily water goal updated successfully',
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get water telemetry (logs and summaries)
 * @route   GET /api/water/telemetry
 * @access  Private
 */
export const getWaterTelemetry = async (req, res) => {
  const userId = req.user._id;

  try {
    const logs = await WaterLog.find({ userId, deleted: false }).sort({ timestamp: -1 });
    const summaries = await DailyWaterSummary.find({ userId }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      logs,
      summaries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
