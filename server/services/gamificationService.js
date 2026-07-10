import WellnessProfile from '../models/WellnessProfile.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';

// Calculate level based on overall XP (300 XP per level)
export const calculateLevel = (xp) => {
  return Math.floor(xp / 300) + 1;
};

/**
 * Find or initialize user's gamification profile records.
 */
export const getOrCreateProfile = async (userId) => {
  let profile = await WellnessProfile.findOne({ userId });
  if (!profile) {
    profile = await WellnessProfile.create({ userId });
  }
  return profile;
};

/**
 * Grant XP points to the user and recalculate levels and badges.
 */
export const grantXP = async (userId, amount) => {
  try {
    const profile = await getOrCreateProfile(userId);
    profile.xp += amount;
    
    // Check level rank
    const newLevel = calculateLevel(profile.xp);
    const didLevelUp = newLevel > profile.level;
    profile.level = newLevel;

    // Check achievement unlocks
    await checkAndUnlockBadges(profile, userId);
    
    await profile.save();
    return { profile, didLevelUp };
  } catch (err) {
    console.error('Error granting XP:', err.message);
    return { profile: null, didLevelUp: false };
  }
};

/**
 * Check habits/goals states to unlock badges.
 */
const checkAndUnlockBadges = async (profile, userId) => {
  const badgesToUnlocks = [];

  // Badge 1: First Steps (Any XP earned)
  if (profile.xp > 0) {
    badgesToUnlocks.push('First Steps');
  }

  // Badge 2: Goal Getter (At least 1 completed goal)
  const completedGoalsCount = await Goal.countDocuments({ userId, completed: true });
  if (completedGoalsCount >= 1) {
    badgesToUnlocks.push('Goal Getter');
  }

  // Badge 3: Consistent Tracker (At least 1 habit with a streak >= 3)
  const streakHabits = await Habit.countDocuments({ userId, streak: { $gte: 3 } });
  if (streakHabits >= 1) {
    badgesToUnlocks.push('Habit Streak');
  }

  // Badge 4: Level 5 Master (Level >= 5)
  if (profile.level >= 5) {
    badgesToUnlocks.push('Level Master');
  }

  // Filter out badges already unlocked
  badgesToUnlocks.forEach(badge => {
    if (!profile.badges.includes(badge)) {
      profile.badges.push(badge);
      profile.achievements.push({
        title: `Badge Unlocked: ${badge}`,
        description: `Unlocked the "${badge}" achievement badge for logging milestones.`
      });
    }
  });
};
