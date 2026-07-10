import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import Mood from '../models/Mood.js';
import UserMeditation from '../models/UserMeditation.js';
import WellnessProfile from '../models/WellnessProfile.js';
import { getOrCreateProfile } from '../services/gamificationService.js';

/**
 * @desc    Get user badges progress and status (Exact mockup specifications)
 * @route   GET /api/badges
 * @access  Private
 */
export const getBadges = async (req, res) => {
  const userId = req.user._id;

  try {
    const habits = await Habit.find({ userId });
    const goals = await Goal.find({ userId });
    const moodsCount = await Mood.countDocuments({ userId, isDeleted: false });
    const meditationsCount = await UserMeditation.countDocuments({ userId, completed: true });
    const profile = await getOrCreateProfile(userId);

    // Calculate dynamic stats
    const todayStr = new Date().toISOString().split('T')[0];
    const completedHabitsToday = habits.filter(h => h.completedDates && h.completedDates.includes(todayStr)).length;
    const completedGoals = goals.filter(g => g.completed).length;
    
    const wellnessScore = habits.length === 0 && goals.length === 0
      ? 0
      : Math.round(
          ((completedHabitsToday / Math.max(1, habits.length)) * 70) +
          ((completedGoals / Math.max(1, goals.length)) * 30)
        );

    // Calculate hydration completed dates sum
    const hydrationHabits = habits.filter(h => 
      h.habitName.toLowerCase().includes('water') || 
      h.habitName.toLowerCase().includes('hydration')
    );
    let hydrationCount = 0;
    hydrationHabits.forEach(h => {
      hydrationCount += (h.completedDates || []).length;
    });

    // Calculate sleep completed dates sum
    const sleepHabits = habits.filter(h => 
      h.habitName.toLowerCase().includes('sleep') || 
      h.habitName.toLowerCase().includes('bedtime')
    );
    let sleepCount = 0;
    sleepHabits.forEach(h => {
      sleepCount += (h.completedDates || []).length;
    });

    // Calculate early bird morning checklist habits sum
    const morningHabits = habits.filter(h => 
      h.habitName.toLowerCase().includes('morning') || 
      h.habitName.toLowerCase().includes('early')
    );
    let morningCount = 0;
    morningHabits.forEach(h => {
      morningCount += (h.completedDates || []).length;
    });

    const maxStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak || 0), 0);

    const badgeConfigs = [
      {
        id: 'mood-tracker',
        name: 'Mood Tracker',
        icon: 'Heart',
        description: 'Log daily mood entries.',
        requirement: 'Log mood for 7 days',
        target: 7,
        current: moodsCount,
        reward: '+250 XP, Unlocks Analytics Theme',
        unlocksTitle: 'Mood Consistency',
        category: 'Mood',
        headline: 'Track mood for 7 consecutive days',
        headlineHighlight: '7 consecutive days',
        detailChecklist: ['Log your mood daily', 'Be consistent', 'Unlock and earn your badge!']
      },
      {
        id: 'first-habit',
        name: 'First Habit',
        icon: 'BookOpen',
        description: 'Complete your first wellness habit.',
        requirement: 'Log your first daily habit',
        target: 1,
        current: habits.some(h => (h.completedDates || []).length > 0) ? 1 : 0,
        reward: '+100 XP, Unlocks Custom Themes',
        unlocksTitle: 'Habit Starter',
        category: 'Habits',
        headline: 'Log your first daily habit to start',
        headlineHighlight: 'first daily habit',
        detailChecklist: ['Choose a wellness habit', 'Complete it today', 'Start your growth!']
      },
      {
        id: '3d-streak',
        name: '3 Day Streak',
        icon: 'Flame',
        description: 'Log habits for 3 days consecutively.',
        requirement: 'Log habits for 3 days',
        target: 3,
        current: maxStreak,
        reward: '+150 XP, Unlocks Silver Badge',
        unlocksTitle: 'Habit Jogger',
        category: 'Streak',
        headline: 'Log habits for 3 days in a row',
        headlineHighlight: '3 days in a row',
        detailChecklist: ['Perform habits daily', 'Maintain consistency', 'Reach 3 active days']
      },
      {
        id: '7d-streak',
        name: '7 Day Streak',
        icon: 'Flame',
        description: 'Maintain habit streaks.',
        requirement: 'Maintain a 7-day habits log streak',
        target: 7,
        current: maxStreak,
        reward: '+250 XP, Unlocks Gold Badge',
        unlocksTitle: 'Consistency Pro',
        category: 'Streak',
        headline: 'Log habits for 7 days in a row',
        headlineHighlight: '7 days in a row',
        detailChecklist: ['Perform habits daily', 'Maintain consistency', 'Reach 7 active days']
      },
      {
        id: 'hydration-hero',
        name: 'Hydration Hero',
        icon: 'Droplet',
        description: 'Complete water intake goals.',
        requirement: 'Complete 30 hydration goals',
        target: 30,
        current: hydrationCount,
        reward: '+300 XP, Unlocks Water Skin',
        unlocksTitle: 'Hydration Elite',
        category: 'Wellness',
        headline: 'Log 30 hydration goals',
        headlineHighlight: '30 hydration goals',
        detailChecklist: ['Log water intake habits', 'Keep body hydrated', 'Reach 30 log entries']
      },
      {
        id: 'early-bird',
        name: 'Early Bird',
        icon: 'Sun',
        description: 'Complete early morning routine habits.',
        requirement: 'Complete 7 morning checklist habits',
        target: 7,
        current: morningCount,
        reward: '+200 XP, Unlocks Sunrise Icon',
        unlocksTitle: 'Early Achiever',
        category: 'Morning',
        headline: 'Complete morning routines 7 times',
        headlineHighlight: 'morning routines 7 times',
        detailChecklist: ['Perform morning habits', 'Complete before 9:00 AM', 'Wake up with calm energy']
      },
      {
        id: 'sleep-master',
        name: 'Sleep Master',
        icon: 'Moon',
        description: 'Maintain healthy sleep routines.',
        requirement: 'Log sleep habits for 14 days',
        target: 14,
        current: sleepCount,
        reward: '+350 XP, Unlocks Dark Theme',
        unlocksTitle: 'Rest Restorer',
        category: 'Sleep',
        headline: 'Complete 14 sleep routine habits',
        headlineHighlight: '14 sleep routine habits',
        detailChecklist: ['Log sleep routine habits', 'Sleep at regular times', 'Improve sleep hygiene']
      },
      {
        id: 'meditation-beginner',
        name: 'Meditation Beginner',
        icon: 'Compass',
        description: 'Complete meditation sessions.',
        requirement: 'Complete 5 meditation sessions',
        target: 5,
        current: meditationsCount,
        reward: '+200 XP, Unlocks Zen Soundscape',
        unlocksTitle: 'Zen Master',
        category: 'Mindfulness',
        headline: 'Complete 5 guided meditation sessions',
        headlineHighlight: '5 guided meditation sessions',
        detailChecklist: ['Open guided meditation', 'Listen to audio guides', 'Complete 5 sessions']
      },
      {
        id: 'consistency-champ',
        name: 'Consistency Champ',
        icon: 'Award',
        description: 'Log habits for 15 days consecutively.',
        requirement: 'Reach a habit logging streak of 15 days',
        target: 15,
        current: maxStreak,
        reward: '+400 XP, Unlocks Champ Title',
        unlocksTitle: 'Consistency Champ',
        category: 'Streak',
        headline: 'Reach a habit logging streak of 15 days',
        headlineHighlight: 'streak of 15 days',
        detailChecklist: ['Maintain daily logs', 'Avoid breaking streaks', 'Log for 15 days']
      },
      {
        id: '30d-streak',
        name: '30 Day Streak',
        icon: 'Flame',
        description: 'Log habits for 30 days consecutively.',
        requirement: 'Log habits for 30 days',
        target: 30,
        current: maxStreak,
        reward: '+600 XP, Unlocks Diamond Badge',
        unlocksTitle: 'Monthly Anchor',
        category: 'Streak',
        headline: 'Log habits for 30 days in a row',
        headlineHighlight: '30 days in a row',
        detailChecklist: ['Log daily habits', 'Maintain monthly habits', 'Reach 30 consecutive days']
      },
      {
        id: 'wellness-master',
        name: 'Wellness Master',
        icon: 'Sparkles',
        description: 'Reach a high overall wellness index score.',
        requirement: 'Reach an overall wellness score of 80%',
        target: 80,
        current: wellnessScore,
        reward: '+500 XP, Unlocks Sage Avatar',
        unlocksTitle: 'Wellness Sage',
        category: 'Wellness',
        headline: 'Reach an overall wellness score of 80%',
        headlineHighlight: 'score of 80%',
        detailChecklist: ['Log habits daily', 'Mark active goals done', 'Keep score above 80%']
      },
      {
        id: 'habit-builder',
        name: 'Habit Builder',
        icon: 'Plus',
        description: 'Add habits to your routine checklist.',
        requirement: 'Establish 3 habits',
        target: 3,
        current: habits.length,
        reward: '+250 XP, Unlocks Architect Title',
        unlocksTitle: 'Structure Specialist',
        category: 'Habits',
        headline: 'Set up and track 3 daily habits',
        headlineHighlight: '3 daily habits',
        detailChecklist: ['Add daily habit tasks', 'Establish routines', 'Maintain 3 active habits']
      },
      {
        id: 'elite-performer',
        name: 'Elite Performer',
        icon: 'Award',
        description: 'Achieve perfect checklist completions.',
        requirement: 'Reach a perfect 100% wellness score',
        target: 100,
        current: wellnessScore,
        reward: '+800 XP, Unlocks Crown Emblem',
        unlocksTitle: 'Elite Perfectionist',
        category: 'Wellness',
        headline: 'Reach a perfect 100% wellness score',
        headlineHighlight: '100% wellness score',
        detailChecklist: ['Complete all habits today', 'Finish active targets', 'Achieve 100% score']
      },
      {
        id: 'goal-crusher',
        name: 'Goal Crusher',
        icon: 'Target',
        description: 'Achieve your defined targets.',
        requirement: 'Complete at least 1 active goal',
        target: 1,
        current: completedGoals,
        reward: '+300 XP, Unlocks Target Tracker',
        unlocksTitle: 'Goal Achiever',
        category: 'Goals',
        headline: 'Complete at least 1 active goal',
        headlineHighlight: '1 active goal',
        detailChecklist: ['Define target goals', 'Work on active tasks', 'Mark goals completed']
      }
    ];

    const badges = badgeConfigs.map(badge => {
      const isUnlocked = badge.current >= badge.target;
      const percentage = Math.min(100, Math.round((badge.current / badge.target) * 100));
      const remainingRequirement = Math.max(0, badge.target - badge.current);
      
      let unlockDate = null;
      if (isUnlocked) {
        // Sync back with Mongoose profile
        if (!profile.badges.includes(badge.name)) {
          profile.badges.push(badge.name);
          profile.achievements.push({
            title: `Badge Unlocked: ${badge.name}`,
            description: `Unlocked the "${badge.name}" achievement badge for logging milestones.`
          });
        }
        
        // Pick profile's update date or fallback to formatted current date
        const dateObj = profile.updatedAt ? new Date(profile.updatedAt) : new Date();
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        unlockDate = dateObj.toLocaleDateString('en-GB', options); // e.g. "10 Jul 2026"
      }

      return {
        ...badge,
        isUnlocked,
        percentage,
        remainingRequirement,
        unlockDate
      };
    });

    // Save profile updates if any badge was unlocked and synced
    await profile.save();

    res.status(200).json({
      success: true,
      badges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
