import Habit from '../models/Habit.js';
import { clearAICache } from '../services/aiService.js';
import { grantXP, getOrCreateProfile } from '../services/gamificationService.js';

/**
 * @desc    Create a new daily habit
 * @route   POST /api/habits
 * @access  Private
 */
export const createHabit = async (req, res) => {
  const userId = req.user._id;
  const { habitName, category, target } = req.body;

  if (!habitName) {
    return res.status(400).json({ message: 'Habit name is required.' });
  }

  try {
    const habit = await Habit.create({
      userId,
      habitName,
      category: category || 'General',
      target: target || 1,
    });

    clearAICache(userId);

    res.status(201).json({
      success: true,
      message: 'Habit created successfully!',
      habit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all user habits
 * @route   GET /api/habits
 * @access  Private
 */
export const getHabits = async (req, res) => {
  const userId = req.user._id;

  try {
    const habits = await Habit.find({ userId });
    
    // Normalize and update today's completion status for all habits dynamically
    const todayStr = new Date().toISOString().split('T')[0];
    for (let habit of habits) {
      const isCompletedToday = habit.completedDates.includes(todayStr);
      if (habit.completed !== isCompletedToday) {
        habit.completed = isCompletedToday;
        await habit.save();
      }
    }

    res.status(200).json({
      success: true,
      habits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Toggle habit completion status for a date
 * @route   PUT /api/habits/:id
 * @access  Private
 */
export const toggleHabitCompletion = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const targetDateStr = req.body.date || new Date().toISOString().split('T')[0];

  try {
    const habit = await Habit.findOne({ _id: id, userId });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found.' });
    }

    const dateIdx = habit.completedDates.indexOf(targetDateStr);
    let isCheckingIn = false;

    if (dateIdx > -1) {
      // Untoggle: remove date
      habit.completedDates.splice(dateIdx, 1);
    } else {
      // Toggle: add date
      habit.completedDates.push(targetDateStr);
      isCheckingIn = true;
    }

    // Sort chronologically
    habit.completedDates.sort();

    // Recalculate Streaks
    let currentStreak = 0;
    let longestStreak = habit.longestStreak || 0;
    let tempStreak = 0;

    if (habit.completedDates.length > 0) {
      tempStreak = 1;
      longestStreak = Math.max(longestStreak, 1);
      
      for (let i = 1; i < habit.completedDates.length; i++) {
        const prev = new Date(habit.completedDates[i - 1]);
        const curr = new Date(habit.completedDates[i]);
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

      // Check if streak is alive (latest log is today or yesterday)
      const lastLogDate = new Date(habit.completedDates[habit.completedDates.length - 1]);
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

    habit.streak = currentStreak;
    habit.longestStreak = longestStreak;
    
    const todayStr = new Date().toISOString().split('T')[0];
    habit.completed = habit.completedDates.includes(todayStr);

    await habit.save();

    let xpAwarded = 0;
    let levelUp = false;
    let gamificationProfile = null;

    if (isCheckingIn) {
      // Award 30 XP for completing a daily habit
      const xpRes = await grantXP(userId, 30);
      xpAwarded = 30;
      levelUp = xpRes.didLevelUp;
      gamificationProfile = xpRes.profile;
    } else {
      // Deduct 30 XP if untoggled
      const xpRes = await grantXP(userId, -30);
      xpAwarded = -30;
      gamificationProfile = xpRes.profile;
    }

    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: isCheckingIn ? 'Habit checked off! +30 XP' : 'Habit unchecked. -30 XP',
      habit,
      xpAwarded,
      levelUp,
      gamificationProfile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a habit
 * @route   DELETE /api/habits/:id
 * @access  Private
 */
export const deleteHabit = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const habit = await Habit.findOneAndDelete({ _id: id, userId });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found.' });
    }

    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: 'Habit successfully deleted.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user streak analytics and current gamification badges
 * @route   GET /api/habits/streak
 * @access  Private
 */
export const getHabitStreakAnalytics = async (req, res) => {
  const userId = req.user._id;

  try {
    const habits = await Habit.find({ userId });
    const profile = await getOrCreateProfile(userId);

    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.completed).length;
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    // Calculate maximum active streak across all habits
    const maxActiveStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
    const maxLongestStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);

    res.status(200).json({
      success: true,
      analytics: {
        totalHabits,
        completedToday,
        completionRate,
        currentStreak: maxActiveStreak,
        longestStreak: maxLongestStreak,
        badges: profile.badges,
        achievements: profile.achievements,
        xp: profile.xp,
        level: profile.level
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
