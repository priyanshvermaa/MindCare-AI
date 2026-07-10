import Meditation from '../models/Meditation.js';
import UserMeditation from '../models/UserMeditation.js';
import MeditationHistory from '../models/MeditationHistory.js';
import DailyMotivation from '../models/DailyMotivation.js';
import Mood from '../models/Mood.js';
import JournalEntry from '../models/JournalEntry.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import { clearAICache } from '../services/aiService.js';
import { callGrokCompletions, analyzeUserHealthContext } from '../services/grokService.js';

/**
 * @desc    GET all meditations with search, filter, and user progress joining
 * @route   GET /api/meditations
 * @access  Private
 */
export const getMeditations = async (req, res) => {
  const userId = req.user._id;
  const { search, category, difficulty } = req.query;

  try {
    const query = {};
    if (category && category !== 'all') {
      query.category = new RegExp(category, 'i');
    }
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') }
      ];
    }

    const meditations = await Meditation.find(query);

    // Join with UserMeditation to get user-specific progress
    const userProgress = await UserMeditation.find({ userId });
    const progressMap = {};
    userProgress.forEach(up => {
      progressMap[up.meditationId.toString()] = up;
    });

    const meditationsWithProgress = meditations.map(med => {
      const up = progressMap[med._id.toString()] || {};
      return {
        ...med.toObject(),
        progress: up.progress || 0,
        currentTime: up.currentTime || 0,
        completed: up.completed || false
      };
    });

    res.status(200).json({ success: true, meditations: meditationsWithProgress });
  } catch (error) {
    res.status(550 || 500).json({ message: error.message });
  }
};

/**
 * @desc    GET featured meditation session
 * @route   GET /api/meditations/featured
 * @access  Private
 */
export const getFeaturedMeditation = async (req, res) => {
  const userId = req.user._id;

  try {
    let med = await Meditation.findOne({ featured: true });
    if (!med) {
      // Fallback to latest
      med = await Meditation.findOne().sort({ createdAt: -1 });
    }

    if (!med) {
      return res.status(200).json({ success: true, meditation: null });
    }

    const up = await UserMeditation.findOne({ userId, meditationId: med._id });
    res.status(200).json({
      success: true,
      meditation: {
        ...med.toObject(),
        progress: up ? up.progress : 0,
        currentTime: up ? up.currentTime : 0,
        completed: up ? up.completed : false
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    GET user-specific meditation history stats
 * @route   GET /api/meditations/stats
 * @access  Private
 */
export const getUserMeditationStats = async (req, res) => {
  const userId = req.user._id;

  try {
    // 1. Completed Sessions
    const completedCount = await UserMeditation.countDocuments({ userId, completed: true });

    // 2. Play history
    const historyList = await MeditationHistory.find({ userId });
    
    // Total Minutes
    const totalMinutes = historyList.reduce((sum, h) => sum + h.minutes, 0);

    // Longest session duration
    const userMeditations = await UserMeditation.find({ userId }).populate('meditationId');
    let longestMeditation = 0;
    userMeditations.forEach(um => {
      if (um.meditationId && um.meditationId.duration > longestMeditation) {
        longestMeditation = um.meditationId.duration;
      }
    });
    longestMeditation = Math.round(longestMeditation / 60); // in minutes

    // 3. Weekly / Monthly minutes
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startOfWeekHistory = await MeditationHistory.find({
      userId,
      createdAt: { $gte: startOfWeek }
    });
    const weeklyMinutes = startOfWeekHistory.reduce((sum, h) => sum + h.minutes, 0);

    const startOfMonthHistory = await MeditationHistory.find({
      userId,
      createdAt: { $gte: startOfMonth }
    });
    const monthlyMinutes = startOfMonthHistory.reduce((sum, h) => sum + h.minutes, 0);

    // 4. Current Streak (consecutive days of meditation)
    const distinctDates = await MeditationHistory.find({ userId })
      .sort({ date: -1 })
      .select('date');

    let currentStreak = 0;
    if (distinctDates.length > 0) {
      const dateStrings = [...new Set(distinctDates.map(d => new Date(d.date).toDateString()))];
      
      let checkDate = new Date();
      let hasToday = dateStrings.includes(checkDate.toDateString());
      
      if (!hasToday) {
        // Check if yesterday was active to count streak starting yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        hasToday = dateStrings.includes(checkDate.toDateString());
      }

      if (hasToday) {
        currentStreak = 1;
        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          if (dateStrings.includes(checkDate.toDateString())) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // 5. Completion rate
    const totalStarted = await UserMeditation.countDocuments({ userId });
    const completionRate = totalStarted > 0 ? Math.round((completedCount / totalStarted) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        minutesMeditated: totalMinutes,
        completedSessions: completedCount,
        longestMeditation,
        currentStreak,
        weeklyMinutes,
        monthlyMinutes,
        completionRate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    GET Grok-personalized meditation recommendations and stress targets
 * @route   GET /api/meditations/recommendations
 * @access  Private
 */
export const getRecommendations = async (req, res) => {
  const userId = req.user._id;

  try {
    // 1. Gather all user telemetry context
    const [recentMoods, latestJournal, habits, goals] = await Promise.all([
      Mood.find({ userId }).sort({ createdAt: -1 }).limit(7),
      JournalEntry.findOne({ user: userId, isDeleted: false }).sort({ createdAt: -1 }),
      Habit.find({ userId }),
      Goal.find({ userId })
    ]);

    const contextSummary = analyzeUserHealthContext(recentMoods, latestJournal ? [latestJournal] : [], habits, goals);

    // 2. Prepare JSON completions prompt
    const prompt = `Based on this user wellness context:
${contextSummary}
Generate a JSON object containing exactly these fields (do not wrap in markdown or return extra text, just raw JSON):
{
  "meditationSummary": "A short, empathetic, personalized 2-sentence wellness summary explaining what they need (e.g., 'You logged high stress patterns today. A 10-minute focus session is recommended to ground your nervous system.').",
  "estimatedStressReduction": 25,
  "suggestedWellnessTips": [
    "Drink a glass of warm water to rehydrate.",
    "Practice 4-7-8 breathing for 2 minutes."
  ]
}`;

    // Rule-based fallback summary if AI call fails
    let aiPayload = {
      meditationSummary: 'We recommend starting your day with a morning breathing reset to balance cognitive focus and emotional wellness.',
      estimatedStressReduction: 15,
      suggestedWellnessTips: [
        'Hydrate immediately after waking up.',
        'Avoid screens for the first 30 minutes of your day.',
        'Log your mood daily to help track resilience triggers.'
      ]
    };

    try {
      const responseText = await callGrokCompletions(
        [
          { role: 'system', content: 'You are a personalized clinical wellness coach. You only respond with raw JSON.' },
          { role: 'user', content: prompt }
        ],
        { temperature: 0.5, response_format: { type: 'json_object' } }
      );

      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.meditationSummary) {
          aiPayload = {
            meditationSummary: parsed.meditationSummary,
            estimatedStressReduction: parsed.estimatedStressReduction || 20,
            suggestedWellnessTips: parsed.suggestedWellnessTips || aiPayload.suggestedWellnessTips
          };
        }
      }
    } catch (aiErr) {
      console.warn('[Meditation Controller] AI generation fallback triggered:', aiErr.message);
    }

    // 3. Select recommendations matching categories
    const recommendedMeds = await Meditation.find({ featured: true }).limit(4);

    const userProgress = await UserMeditation.find({ userId });
    const progressMap = {};
    userProgress.forEach(up => {
      progressMap[up.meditationId.toString()] = up;
    });

    const meditationsWithProgress = recommendedMeds.map(med => {
      const up = progressMap[med._id.toString()] || {};
      return {
        ...med.toObject(),
        progress: up.progress || 0,
        currentTime: up.currentTime || 0,
        completed: up.completed || false
      };
    });

    res.status(200).json({
      success: true,
      reason: aiPayload.meditationSummary,
      estimatedStressReduction: aiPayload.estimatedStressReduction,
      suggestedWellnessTips: aiPayload.suggestedWellnessTips,
      recommendations: meditationsWithProgress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    GET random motivation quote
 * @route   GET /api/meditations/motivation
 * @access  Private
 */
export const getMotivationQuote = async (req, res) => {
  try {
    const quotes = await DailyMotivation.find({ active: true });
    if (quotes.length === 0) {
      return res.status(200).json({
        success: true,
        quote: {
          quote: "Quiet the mind and the soul will speak.",
          author: "Ma Jaya Sati Bhagavati"
        }
      });
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    res.status(200).json({ success: true, quote: quotes[randomIndex] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    GET list of in-progress sessions for "Continue Listening"
 * @route   GET /api/meditations/recently-played
 * @access  Private
 */
export const getResumeSessions = async (req, res) => {
  const userId = req.user._id;

  try {
    const userProgress = await UserMeditation.find({
      userId,
      progress: { $gt: 0, $lt: 100 }
    }).populate('meditationId').sort({ lastPlayed: -1 });

    const sessions = userProgress
      .filter(up => up.meditationId !== null)
      .map(up => ({
        _id: up.meditationId._id,
        title: up.meditationId.title,
        duration: up.meditationId.duration,
        category: up.meditationId.category,
        instructor: up.meditationId.instructor || 'MindCare Coach',
        benefits: up.meditationId.benefits || [],
        thumbnail: up.meditationId.thumbnail,
        currentTime: up.currentTime,
        progress: up.progress,
        completed: up.completed
      }));

    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    POST start/play a meditation session
 * @route   POST /api/meditations/:id/play
 * @access  Private
 */
export const playMeditation = async (req, res) => {
  const userId = req.user._id;
  const meditationId = req.params.id;

  try {
    let up = await UserMeditation.findOne({ userId, meditationId });
    if (!up) {
      up = await UserMeditation.create({
        userId,
        meditationId,
        startedAt: new Date(),
        lastPlayed: new Date()
      });
    } else {
      up.lastPlayed = new Date();
      await up.save();
    }

    res.status(200).json({ success: true, session: up });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    POST save progress position and check completions
 * @route   POST /api/meditations/:id/progress
 * @access  Private
 */
export const saveProgress = async (req, res) => {
  const userId = req.user._id;
  const meditationId = req.params.id;
  const { currentTime, progress } = req.body;

  try {
    const med = await Meditation.findById(meditationId);
    if (!med) {
      return res.status(404).json({ message: 'Meditation not found' });
    }

    let up = await UserMeditation.findOne({ userId, meditationId });
    if (!up) {
      up = new UserMeditation({ userId, meditationId });
    }

    const previousTime = up.currentTime || 0;
    const timeDelta = Math.max(0, currentTime - previousTime);
    const minutesDelta = timeDelta / 60; // in minutes

    up.currentTime = currentTime;
    up.progress = Math.min(100, Math.round(progress));

    const justCompleted = !up.completed && progress >= 95;
    if (justCompleted) {
      up.completed = true;
      up.completedAt = new Date();
    }

    up.minutesCompleted += minutesDelta;
    up.lastPlayed = new Date();
    await up.save();

    if (minutesDelta > 0.05) {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let history = await MeditationHistory.findOne({
        userId,
        meditationId,
        date: today
      });

      if (!history) {
        history = new MeditationHistory({
          userId,
          meditationId,
          date: today,
          minutes: minutesDelta,
          completed: up.completed
        });
      } else {
        history.minutes += minutesDelta;
        if (up.completed) history.completed = true;
      }
      await history.save();
    }

    clearAICache(userId);

    res.status(200).json({ success: true, session: up });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ── ADMIN ACTIONS ──

export const createMeditation = async (req, res) => {
  const { title, description, category, difficulty, duration, thumbnail, videoUrl, instructor, benefits } = req.body;

  try {
    const med = await Meditation.create({
      title,
      description,
      category,
      difficulty,
      duration,
      thumbnail,
      videoUrl,
      instructor,
      benefits,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, meditation: med });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMeditation = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, difficulty, duration, thumbnail, videoUrl, featured, instructor, benefits } = req.body;

  try {
    const med = await Meditation.findById(id);
    if (!med) {
      return res.status(404).json({ message: 'Meditation not found' });
    }

    if (featured === true) {
      await Meditation.updateMany({ _id: { $ne: id } }, { featured: false });
    }

    med.title = title || med.title;
    med.description = description || med.description;
    med.category = category || med.category;
    med.difficulty = difficulty || med.difficulty;
    if (duration !== undefined) med.duration = duration;
    med.thumbnail = thumbnail || med.thumbnail;
    med.videoUrl = videoUrl || med.videoUrl;
    if (featured !== undefined) med.featured = featured;
    med.instructor = instructor || med.instructor;
    med.benefits = benefits || med.benefits;

    await med.save();
    res.status(200).json({ success: true, meditation: med });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMeditation = async (req, res) => {
  const { id } = req.params;

  try {
    await Meditation.findByIdAndDelete(id);
    await UserMeditation.deleteMany({ meditationId: id });
    await MeditationHistory.deleteMany({ meditationId: id });
    res.status(200).json({ success: true, message: 'Meditation successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const totalPlays = await UserMeditation.countDocuments();
    const completedCount = await UserMeditation.countDocuments({ completed: true });
    const activeUsers = await UserMeditation.distinct('userId');
    const completionStats = totalPlays > 0 ? Math.round((completedCount / totalPlays) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalPlays,
        activeUsersCount: activeUsers.length,
        completionRate: completionStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminQuotes = async (req, res) => {
  try {
    const quotes = await DailyMotivation.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, quotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createQuote = async (req, res) => {
  const { quote, author, active } = req.body;

  try {
    const item = await DailyMotivation.create({ quote, author, active });
    res.status(201).json({ success: true, quote: item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuote = async (req, res) => {
  const { id } = req.params;
  const { quote, author, active } = req.body;

  try {
    const item = await DailyMotivation.findById(id);
    if (!item) return res.status(404).json({ message: 'Quote not found' });

    item.quote = quote || item.quote;
    item.author = author || item.author;
    if (active !== undefined) item.active = active;

    await item.save();
    res.status(200).json({ success: true, quote: item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuote = async (req, res) => {
  const { id } = req.params;

  try {
    await DailyMotivation.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Quote successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
