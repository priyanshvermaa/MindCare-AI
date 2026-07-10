import axios from 'axios';
import Mood from '../models/Mood.js';
import JournalEntry from '../models/JournalEntry.js';
import WellnessStats from '../models/WellnessStats.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import DailyWaterSummary from '../models/DailyWaterSummary.js';
import MeditationHistory from '../models/MeditationHistory.js';
import User from '../models/User.js';
import AIWellness from '../models/AIWellness.js';


// In-memory cache for duplicate requests
const responseCache = new Map();

// Helper to clear AI response cache for a user
export const clearAICache = (userId) => {
  const userIdStr = String(userId);
  for (const key of responseCache.keys()) {
    if (key.startsWith(`${userIdStr}:`)) {
      responseCache.delete(key);
    }
  }
};


// In-memory rate limiting map (userId -> array of timestamps)
const rateLimiter = new Map();

// In-memory request queue (userId -> promise chain)
const requestQueue = new Map();

// Clean up cache periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) { // 5-minute cache lifespan
      responseCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Helper for wait/sleep
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Timeout wrapper for promises
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), ms))
  ]);
};

/**
 * 1. Rate Limiting Check (Max 15 requests per minute)
 */
const checkRateLimit = (userId) => {
  const now = Date.now();
  if (!rateLimiter.has(userId)) {
    rateLimiter.set(userId, [now]);
    return true;
  }
  const timestamps = rateLimiter.get(userId).filter((t) => now - t < 60 * 1000);
  if (timestamps.length >= 15) {
    return false;
  }
  timestamps.push(now);
  rateLimiter.set(userId, timestamps);
  return true;
};

/**
 * 2. Token & Context Optimization: Slice chat history
 */
const optimizeChatHistory = (history) => {
  // Keep the last 20 messages (10 user, 10 assistant) for deeper conversational continuity
  const sliced = history.slice(-20);
  return sliced.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content.substring(0, 1000) // Truncate content to 1000 chars per message
  }));
};

/**
 * ── PROVIDER 1: Google Gemini 2.5 Flash ──
 */
const callGemini = async (systemPrompt, history, currentMessage) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const contents = [];
  history.forEach((msg) => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }]
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  };

  console.log(`[AI ASSISTANT AUDIT] Request body for Google Gemini: ${JSON.stringify(requestBody, null, 2)}`);

  const response = await axios.post(url, requestBody, {
    headers: { 'Content-Type': 'application/json' }
  });

  const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error('Invalid Gemini API response structure');
  return reply;
};

/**
 * ── PROVIDER 2: OpenAI ──
 */
const callOpenAI = async (systemPrompt, history, currentMessage) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const url = 'https://api.openai.com/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  history.forEach((msg) => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });

  messages.push({ role: 'user', content: currentMessage });

  const requestBody = {
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    max_tokens: 1024
  };

  console.log(`[AI ASSISTANT AUDIT] Request body for OpenAI: ${JSON.stringify(requestBody, null, 2)}`);

  const response = await axios.post(url, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const reply = response.data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Invalid OpenAI API response structure');
  return reply;
};

/**
 * ── PROVIDER 3: Groq (Llama-3.3) ──
 */
const callGroq = async (systemPrompt, history, currentMessage) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  history.forEach((msg) => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });

  messages.push({ role: 'user', content: currentMessage });

  const requestBody = {
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 1024
  };

  console.log(`[AI ASSISTANT AUDIT] Request body for Groq: ${JSON.stringify(requestBody, null, 2)}`);

  const response = await axios.post(url, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const reply = response.data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Invalid Groq API response structure');
  return reply;
};

/**
 * ── PROVIDER: xAI (Grok) ──
 */
const callXAI = async (systemPrompt, history, currentMessage) => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('XAI_API_KEY not configured');

  const url = 'https://api.x.ai/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  history.forEach((msg) => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });

  messages.push({ role: 'user', content: currentMessage });

  const requestBody = {
    model: 'grok-beta',
    messages,
    temperature: 0.7,
    max_tokens: 1024
  };

  console.log(`[AI ASSISTANT AUDIT] Request body for xAI (Grok): ${JSON.stringify(requestBody, null, 2)}`);

  const response = await axios.post(url, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const reply = response.data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Invalid xAI (Grok) API response structure');
  return reply;
};

/**
 * ── PROVIDER 4: OpenRouter ──
 */
const callOpenRouter = async (systemPrompt, history, currentMessage) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  history.forEach((msg) => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  });

  messages.push({ role: 'user', content: currentMessage });

  const requestBody = {
    model: 'google/gemini-2.5-flash',
    messages,
    temperature: 0.7,
    max_tokens: 1024
  };

  console.log(`[AI ASSISTANT AUDIT] Request body for OpenRouter: ${JSON.stringify(requestBody, null, 2)}`);

  const response = await axios.post(url, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://mindcare.ai',
      'X-Title': 'MindCare AI'
    }
  });

  const reply = response.data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Invalid OpenRouter API response structure');
  return reply;
};

export const getRecommendedSleepRange = (age) => {
  if (!age) return { min: 7, max: 9, label: '7–9 hours' };
  const numericAge = parseInt(age, 10);
  if (numericAge >= 1 && numericAge <= 2) return { min: 11, max: 14, label: '11–14 hours' };
  if (numericAge >= 3 && numericAge <= 5) return { min: 10, max: 13, label: '10–13 hours' };
  if (numericAge >= 6 && numericAge <= 13) return { min: 9, max: 11, label: '9–11 hours' };
  if (numericAge >= 14 && numericAge <= 17) return { min: 8, max: 10, label: '8–10 hours' };
  if (numericAge >= 18 && numericAge <= 64) return { min: 7, max: 9, label: '7–9 hours' };
  if (numericAge >= 65) return { min: 7, max: 8, label: '7–8 hours' };
  return { min: 7, max: 9, label: '7–9 hours' };
};

export const calculateSleepRating = (age, actualSleep) => {
  const range = getRecommendedSleepRange(age);
  const sleepVal = parseFloat(actualSleep);
  
  if (sleepVal > 12) {
    return {
      rating: 'Poor (Oversleeping)',
      explanation: `Oversleeping detected (${sleepVal} hours). This exceeds the recommended range of ${range.label} and is linked to potential fatigue and reduced sleep efficiency.`
    };
  }
  
  if (sleepVal > range.max) {
    return {
      rating: 'Poor (Oversleeping)',
      explanation: `Oversleeping detected (${sleepVal} hours). This exceeds the recommended range of ${range.label} and is linked to potential fatigue.`
    };
  }

  if (sleepVal >= range.min && sleepVal <= range.max) {
    return {
      rating: 'Excellent',
      explanation: `Excellent rest. Your sleep duration of ${sleepVal} hours matches the recommended ${range.label} range for your age group.`
    };
  }

  if (sleepVal >= range.min - 1.5 && sleepVal < range.min) {
    return {
      rating: 'Fair',
      explanation: `Fair sleep quality (${sleepVal} hours). Your sleep is slightly below the recommended target of ${range.label} for your age group.`
    };
  }

  return {
    rating: 'Poor',
    explanation: `Sleep deficit detected (${sleepVal} hours). Your sleep duration is significantly below the recommended range of ${range.label} for your age group, compounding daytime fatigue.`
  };
};

/**
 * ── Centralized live MongoDB Telemetry Compiler ──
 */
export const compileFullUserTelemetry = async (userId) => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [user, moods, journals, habits, goals, wellnessStats, waterSummaries, meditationHistory] = await Promise.all([
    User.findById(userId),
    Mood.find({ userId, isDeleted: false, createdAt: { $gte: fourteenDaysAgo } }).sort({ createdAt: -1 }),
    JournalEntry.find({ user: userId, isDeleted: false, createdAt: { $gte: fourteenDaysAgo } }).sort({ createdAt: -1 }),
    Habit.find({ userId }),
    Goal.find({ userId }),
    WellnessStats.find({ user: userId, date: { $gte: fourteenDaysAgo } }).sort({ date: -1 }),
    DailyWaterSummary.find({ userId, date: { $regex: /^\d{4}-\d{2}-\d{2}$/ } }).sort({ date: -1 }).limit(14),
    MeditationHistory.find({ userId, date: { $gte: fourteenDaysAgo } }).sort({ date: -1 })
  ]);

  return {
    age: user?.age || null,
    height: user?.height || null,
    weight: user?.weight || null,
    activityLevel: user?.activityLevel || '',
    wellnessGoal: user?.wellnessGoal || '',
    moods,
    journals,
    habits,
    goals,
    wellnessStats,
    waterSummaries,
    meditationHistory
  };
};

export const formatUserTelemetryText = (data) => {
  let context = 'USER WELLNESS TELEMETRY REPORT:\n';
  context += `User Age: ${data.age || 'Not provided'}\n`;
  context += `User Height: ${data.height || 'Not provided'} cm\n`;
  context += `User Weight: ${data.weight || 'Not provided'} kg\n`;
  context += `User Activity Level: ${data.activityLevel || 'Not provided'}\n`;
  context += `User Wellness Goal: ${data.wellnessGoal || 'Not provided'}\n`;

  if (data.moods && data.moods.length > 0) {
    context += `Mood Logs (Last 14 Days):\n`;
    data.moods.forEach((m) => {
      context += `- Date: ${m.entryDate || m.createdAt.toISOString().slice(0, 10)}, Mood: ${m.mood}, Score: ${m.score}/10, Stress Level: ${m.stressLevel}/10, Sleep: ${m.sleepHours}h, Anxiety: ${m.anxietyLevel}/10. Triggers: ${m.triggers?.join(', ') || 'None'}. Activities: ${m.activities?.join(', ') || 'None'}\n`;
    });
  } else {
    context += `- No mood logs found in the last 14 days.\n`;
  }

  if (data.wellnessStats && data.wellnessStats.length > 0) {
    context += `Sleep Hours (Last 14 Days):\n`;
    data.wellnessStats.forEach((w) => {
      context += `- Date: ${w.date.toISOString().slice(0, 10)}, Sleep Hours: ${w.sleepHours}h, Wellness Score: ${w.wellnessScore}/100\n`;
    });
  }

  if (data.waterSummaries && data.waterSummaries.length > 0) {
    context += `Hydration Intake (Last 14 Days):\n`;
    data.waterSummaries.forEach((s) => {
      context += `- Date: ${s.date}, Total Intake: ${s.totalIntake} ml, Goal: ${s.goal} ml, Completed: ${s.percentage}%, Streak: ${s.streak} days\n`;
    });
  }

  if (data.journals && data.journals.length > 0) {
    context += `Journal Entries:\n`;
    data.journals.forEach((j) => {
      context += `- Title: "${j.title}", Emotion/Sentiment: ${j.sentiment || 'Neutral'}, Created: ${j.createdAt.toISOString().slice(0, 10)}, Summary: "${j.summary || ''}"\n`;
    });
  }

  if (data.habits && data.habits.length > 0) {
    context += `Habits Configured:\n`;
    data.habits.forEach((h) => {
      context += `- Habit: "${h.habitName}", Category: ${h.category}, Target: ${h.target}, Completed Today: ${h.completed ? 'Yes' : 'No'}, Current Streak: ${h.streak} days, Longest Streak: ${h.longestStreak} days\n`;
    });
  }

  if (data.goals && data.goals.length > 0) {
    context += `Goals Configured:\n`;
    data.goals.forEach((g) => {
      context += `- Goal: "${g.title}", Category: ${g.category}, Description: "${g.description || ''}", Status: ${g.completed ? 'Completed' : 'Pending'}\n`;
    });
  }

  if (data.meditationHistory && data.meditationHistory.length > 0) {
    context += `Meditation History (Last 14 Days):\n`;
    data.meditationHistory.forEach((mh) => {
      context += `- Date: ${mh.date.toISOString().slice(0, 10)}, Duration: ${mh.minutes} mins, Completed: ${mh.completed ? 'Yes' : 'No'}\n`;
    });
  }

  // 2. Processed Health Metrics (Evidence-Based Validation Rules)
  context += `\nPROCESSED HEALTH METRICS SUMMARY:\n`;

  // Sleep evaluation rule
  const sleepLogs = data.wellnessStats || [];
  const range = getRecommendedSleepRange(data.age);
  if (sleepLogs.length > 0) {
    const avgSleep = sleepLogs.reduce((sum, w) => sum + (w.sleepHours || 7), 0) / sleepLogs.length;
    const ratingObj = calculateSleepRating(data.age, avgSleep);
    context += `- Average Sleep Hours: ${avgSleep.toFixed(1)}h/day. Recommended target range for age ${data.age || 'unknown'}: ${range.label}. Evaluation Status: ${ratingObj.rating}. Detail: ${ratingObj.explanation}\n`;
  } else {
    context += `- Average Sleep Hours: N/A. Evaluation Status: No sleep records.\n`;
  }

  // Hydration evaluation rule
  const waterLogs = data.waterSummaries || [];
  if (waterLogs.length > 0) {
    const avgWater = waterLogs.reduce((sum, s) => sum + (s.totalIntake || 0), 0) / waterLogs.length;
    const avgGoal = waterLogs.reduce((sum, s) => sum + (s.goal || 2000), 0) / waterLogs.length;
    const pct = avgGoal > 0 ? (avgWater / avgGoal) * 100 : 0;
    let waterRating = 'Poor';
    if (pct >= 100) waterRating = 'Excellent';
    else if (pct >= 75) waterRating = 'Good';
    else if (pct >= 50) waterRating = 'Fair';
    context += `- Average Hydration: ${Math.round(avgWater)} ml / Target: ${Math.round(avgGoal)} ml (${pct.toFixed(0)}%). Evaluation Status: ${waterRating}.\n`;
  } else {
    context += `- Average Hydration: N/A. Evaluation Status: No hydration records.\n`;
  }

  // Mood evaluation rule
  const moodLogs = data.moods || [];
  if (moodLogs.length > 0) {
    const avgMood = moodLogs.reduce((sum, m) => sum + (m.score || 5), 0) / moodLogs.length;
    const avgStress = moodLogs.reduce((sum, m) => sum + (m.stressLevel || 3), 0) / moodLogs.length;
    let moodRating = 'Unknown';
    if (avgMood >= 8) moodRating = 'Optimal / Excellent';
    else if (avgMood >= 6 && avgMood < 8) moodRating = 'Good / Stable';
    else if (avgMood >= 4 && avgMood < 6) moodRating = 'Fair / Neutral';
    else if (avgMood < 4) moodRating = 'Poor / Low';
    context += `- Average Mood Score: ${avgMood.toFixed(1)}/10, Average Stress: ${avgStress.toFixed(1)}/10. Evaluation Status: ${moodRating}.\n`;
  } else {
    context += `- Average Mood Score: N/A. Evaluation Status: No mood logs.\n`;
  }

  // Meditation evaluation rule
  const medLogs = data.meditationHistory || [];
  if (medLogs.length > 0) {
    const totalMinutes = medLogs.reduce((sum, mh) => sum + (mh.minutes || 0), 0);
    const sessionsCount = medLogs.length;
    context += `- Meditation sessions: ${sessionsCount} logged over the last 14 days, total duration: ${totalMinutes.toFixed(1)} mins.\n`;
  } else {
    context += `- Meditation sessions: 0 logged. Evaluation Status: Needs mindfulness consistency.\n`;
  }

  // Exercise evaluation rule
  const exerciseHabits = data.habits?.filter((h) => h.category?.toLowerCase() === 'exercise') || [];
  if (exerciseHabits.length > 0) {
    const totalStreaks = exerciseHabits.reduce((sum, h) => sum + (h.streak || 0), 0);
    context += `- Active exercise habits: ${exerciseHabits.length} configured, total active streaks: ${totalStreaks} days.\n`;
  } else {
    context += `- Active exercise habits: None configured. Evaluation Status: Needs physical consistency.\n`;
  }

  return context;
};

export const generateLocalWellnessAnalysis = (data) => {
  const moods = data.moods || [];
  const totalLogs = moods.length + 
                    (data.journals?.length || 0) + 
                    (data.waterSummaries?.length || 0) + 
                    (data.meditationHistory?.length || 0) + 
                    (data.habits?.length || 0);

  if (totalLogs === 0) {
    return {
      overallWellnessSummary: "Start tracking your wellness activities to receive personalized AI insights.",
      currentWellnessStatus: "No data logged yet",
      topPositiveHabit: "No habits tracked yet.",
      biggestAreaForImprovement: "No data",
      sleepAnalysis: "No sleep data",
      moodTrend: "No mood logged yet",
      hydrationAnalysis: "No hydration data",
      journalAnalysis: "No entries",
      exerciseAnalysis: "No data",
      meditationAnalysis: "No data",
      habitConsistency: "No data",
      
      mentalWellnessStatus: "No data",
      physicalWellnessStatus: "No data",
      emotionalTrends: "No data",
      habitAnalysis: "No data",
      behaviourCorrelations: "No correlations identified yet.",
      positiveChanges: "None",
      areasNeedingAttention: "None",
      riskFactors: "None",
      todayPriority: "Complete your first daily check-in.",
      weeklySummary: "No data logged yet.",
      longTermProgress: "No baseline progress established.",
      
      personalizedRecommendations: [
        "Log your mood daily to help track resilience triggers.",
        "Track your hydration intake.",
        "Record your sleep hours."
      ],
      nextBestAction: "Complete your first daily check-in.",
      overallWellnessScore: 0
    };
  }

  const avgMood = moods.length > 0 ? (moods.reduce((sum, m) => sum + (m.score || 5), 0) / moods.length).toFixed(1) : '7.0';
  const avgStress = moods.length > 0 ? (moods.reduce((sum, m) => sum + (m.stressLevel || 3), 0) / moods.length).toFixed(1) : '3.0';

  const wStats = data.wellnessStats || [];
  const avgSleep = wStats.length > 0 ? (wStats.reduce((sum, w) => sum + (w.sleepHours || 7), 0) / wStats.length).toFixed(1) : '7.0';
  const avgMeditation = wStats.length > 0 ? (wStats.reduce((sum, w) => sum + (w.meditationMinutes || 0), 0) / wStats.length).toFixed(1) : '5.0';

  const waters = data.waterSummaries || [];
  const avgWater = waters.length > 0 ? Math.round(waters.reduce((sum, s) => sum + (s.totalIntake || 0), 0) / waters.length) : 1500;
  const waterGoal = waters.length > 0 ? (waters[0].goal || 2000) : 2000;
  const waterStreak = waters.length > 0 ? (waters[0].streak || 0) : 0;

  const range = getRecommendedSleepRange(data.age);
  const sleepTargetMin = range.min;
  const sleepVal = parseFloat(avgSleep);

  const sleepScore = Math.min(sleepVal / sleepTargetMin, 1) * 35;
  const waterScore = Math.min(avgWater / waterGoal, 1) * 35;
  const medScore = Math.min(parseFloat(avgMeditation) / 15, 1) * 30;
  const calculatedWellnessScore = Math.round(sleepScore + waterScore + medScore);

  // Sleep Rating using age-based calculateSleepRating
  const ratingObj = calculateSleepRating(data.age, avgSleep);
  const sleepRating = ratingObj.rating;

  // Overall Wellness Summary
  const overallWellnessSummary = `• Avg sleep: ${avgSleep}h (${sleepRating})\n• Avg hydration: ${avgWater} ml\n• Mood avg: ${avgMood}/10 (stress: ${avgStress}/10)`;

  // Current Wellness Status
  let currentWellnessStatus = 'Your emotional resilience and daily telemetry are stable today.';
  if (calculatedWellnessScore >= 80) {
    currentWellnessStatus = 'You are in an optimal wellness state.';
  } else if (calculatedWellnessScore < 60) {
    currentWellnessStatus = 'Your wellness telemetry indicates signs of fatigue or high stress.';
  }

  // Top Positive Habit
  let topPositiveHabit = 'Daily metric tracking';
  if (waterStreak > 1) {
    topPositiveHabit = `Hydration streak: ${waterStreak} days`;
  } else if (sleepRating === 'Excellent' || sleepRating === 'Good') {
    topPositiveHabit = `Good sleep hygiene (${avgSleep}h)`;
  } else if (parseFloat(avgMeditation) >= 10) {
    topPositiveHabit = `Daily meditation (${avgMeditation}m)`;
  }

  // Biggest Area for Improvement
  let biggestAreaForImprovement = 'Physical consistency';
  if (sleepRating.startsWith('Poor')) {
    biggestAreaForImprovement = `Low sleep average (${avgSleep}h)`;
  } else if (avgWater < 1200) {
    biggestAreaForImprovement = `Low hydration (${avgWater}ml)`;
  }

  // Analyses
  const sleepAnalysis = `Your sleep averages ${avgSleep} hours per day (recommended ${range.label} for age ${data.age || 'unknown'}), which evaluates as ${sleepRating} quality: ${ratingObj.explanation}`;
  const moodTrend = `Your mood score average is ${avgMood}/10, with stress level averaging ${avgStress}/10 over the past 14 days.`;
  const hydrationAnalysis = `Water intake averages ${avgWater} ml out of your daily ${waterGoal} ml target. Your hydration streak is currently ${waterStreak} days.`;
  const journalAnalysis = `You have logged ${data.journals?.length || 0} journal entries in the last 14 days, helping trace cognitive stress triggers.`;
  
  const exerciseHabits = data.habits?.filter((h) => h.category?.toLowerCase() === 'exercise') || [];
  const exerciseAnalysis = exerciseHabits.length > 0 
    ? `You have configured ${exerciseHabits.length} active exercise habits with streaking completion.`
    : `Adding a regular physical activity habit like walking can boost your resilience.`;

  const meditationAnalysis = `You completed ${avgMeditation} minutes of mindfulness meditation on average over the past 14 days.`;
  const habitConsistency = `Your habit consistency score is stable, tracking daily checks across categories.`;

  // New local analyses requested
  const mentalWellnessStatus = avgMood >= 7 ? 'Stable & Resilient' : 'Moderate Stress / Low Mood';
  const physicalWellnessStatus = sleepRating.startsWith('Poor') ? 'Fatigued / Sleep Debt' : 'Restored & Energized';
  const emotionalTrends = avgMood >= 7.5 ? 'Positive and calm' : 'Fluctuating stress triggers';
  const habitAnalysis = `Active habit tracking shows regular checks for ${data.habits?.length || 0} configured items.`;
  const behaviourCorrelations = `Lower mood ratings correspond directly with sleep durations below ${range.min} hours.`;
  const positiveChanges = `Your longest water streak is ${waterStreak} days.`;
  const areasNeedingAttention = sleepRating.startsWith('Poor') ? `Your sleep avg (${avgSleep}h) is below the recommended ${range.label}.` : `Hydration levels should be consistently kept close to goal.`;
  const riskFactors = avgStress > 6 ? 'High cortisol and potential burnout indicators' : 'No critical risk factors flagged';
  const todayPriority = sleepRating.startsWith('Poor') ? `Target a solid sleep cycle of at least ${range.min} hours.` : `Complete your daily hydration target.`;
  const weeklySummary = `Consistent hydration streak of ${waterStreak} days with average stress profile of ${avgStress}/10.`;
  const longTermProgress = `Physical score matches baseline trends. Daily check-in streak is active.`;

  // Recommendations
  const personalizedRecommendations = [
    'Schedule a 5-minute box breathing session during your next work break.',
    sleepRating.startsWith('Poor')
      ? (sleepVal > 12 ? 'Set a regular morning wake-up alarm and get immediate light exposure.' : 'Establish a wind-down routine 45 minutes before sleep with no screens.')
      : 'Maintain your solid sleep schedule to continue stabilizing daytime focus.',
    avgWater < waterGoal
      ? `Keep a water bottle on your desk as a prompt to help reach your ${waterGoal} ml daily goal.`
      : 'Keep up the hydration levels to sustain physical energy.'
  ];

  const nextBestAction = sleepRating.startsWith('Poor')
    ? 'Go to bed 30 minutes earlier tonight to begin reducing your sleep debt.'
    : 'Begin a 5-minute deep breathing exercise to lower current cognitive tension.';

  return {
    overallWellnessSummary,
    currentWellnessStatus,
    topPositiveHabit,
    biggestAreaForImprovement,
    sleepAnalysis,
    moodTrend,
    hydrationAnalysis,
    journalAnalysis,
    exerciseAnalysis,
    meditationAnalysis,
    habitConsistency,
    mentalWellnessStatus,
    physicalWellnessStatus,
    emotionalTrends,
    habitAnalysis,
    behaviourCorrelations,
    positiveChanges,
    areasNeedingAttention,
    riskFactors,
    todayPriority,
    weeklySummary,
    longTermProgress,
    personalizedRecommendations,
    nextBestAction,
    overallWellnessScore: calculatedWellnessScore
  };
};

const generateLocalChatResponse = (message, telemetryData) => {
  const analysis = generateLocalWellnessAnalysis(telemetryData);
  const lowerMsg = message.toLowerCase();

  // Step 1: Detect intent and category of query
  let responseText = '';
  
  const isEmergency = lowerMsg.includes('suicid') || lowerMsg.includes('self-harm') || lowerMsg.includes('harm myself');
  const isCrisis = lowerMsg.includes('panic') || lowerMsg.includes('anxiety') || lowerMsg.includes('anxious') || lowerMsg.includes('stress') || lowerMsg.includes('depress') || lowerMsg.includes('crisis');
  const isGreeting = lowerMsg.match(/^(hi|hello|hey|greetings|good morning|good afternoon)/i);
  const isDataRequest = lowerMsg.includes('how am i doing') || lowerMsg.includes('how\'s my health') || lowerMsg.includes('my wellness') || lowerMsg.includes('my status') || lowerMsg.includes('summary') || lowerMsg.includes('telemetry') || lowerMsg.includes('dashboard');
  const isSleepQuery = lowerMsg.includes('sleep') || lowerMsg.includes('tired') || lowerMsg.includes('insomnia') || lowerMsg.includes('oversleep');
  const isWaterQuery = lowerMsg.includes('water') || lowerMsg.includes('hydration') || lowerMsg.includes('drink');

  // Step 2 & 3: Answer naturally & check telemetry conditionally
  if (isEmergency) {
    responseText = `I hear you, and please know that you are not alone. I want to encourage you to connect with a professional right now. Please reach out to a local emergency hotline or crisis support number (such as 988). Your safety and wellness are of the utmost priority.`;
  } else if (isCrisis) {
    responseText = `I hear that you are going through a very difficult emotional moment. Let's take a slow deep breath together. Let's do a quick Box Breathing cycle: inhale slowly for 4 seconds, hold your breath for 4 seconds, exhale completely for 4 seconds, and hold empty for 4 seconds. Focus strictly on the physical sensation of breathing. Next, try the 5-4-3-2-1 grounding method: name 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, and 1 thing you taste. 

    If telemetry suggests further insights:
    Looking at your sleep metrics, you average ${analysis.sleepAnalysis.split('averages ')[1]?.split(' (')[0] || 'lower sleep hours'}, which can heighten baseline anxiety. Prioritizing rest will help you ground your nervous system.`;
  } else if (isGreeting) {
    responseText = `Hello! I am your MindCare AI Wellness Assistant. I'm here to converse with you, listen, offer coping strategies, or help summarize your habits. How are you feeling today?`;
  } else if (isDataRequest) {
    responseText = `As your supportive AI wellness coach, here is a clear summary of your health telemetry:
    
- **Wellness Status**: ${analysis.currentWellnessStatus}
- **Habit Achievements**: ${analysis.topPositiveHabit}
- **Improvement Areas**: ${analysis.biggestAreaForImprovement}
- **Telemetry Details**:
  * Sleep: ${analysis.sleepAnalysis}
  * Mood: ${analysis.moodTrend}
  * Hydration: ${analysis.hydrationAnalysis}
  * Meditation: ${analysis.meditationAnalysis}
  
- **Priority Recommendation**: ${analysis.nextBestAction}`;
  } else if (isSleepQuery) {
    responseText = `Let's focus on your sleep. According to your logs, ${analysis.sleepAnalysis} We recommend: ${analysis.personalizedRecommendations[1]}`;
  } else if (isWaterQuery) {
    responseText = `Let's check your hydration. ${analysis.hydrationAnalysis} To stay consistent, ${analysis.personalizedRecommendations[2]}`;
  } else {
    // General conversational query
    responseText = `Thank you for sharing that. I'm here as your mindfulness and resilience coach to discuss whatever is on your mind. We can explore mindfulness exercises, focus tips, sleep routines, or chat about your day. What would be most helpful for you right now?`;
  }

  // Step 4: Add disclaimer
  return `${responseText}\n\n*Disclaimer: I am an AI wellness assistant, not a licensed therapist. For professional mental health care, please consult a clinical specialist or call local support lines.*`;
};

/**
 * Executes a single provider request with retry logic and timeouts
 */
const runProviderRequest = async (userId, providerFn, providerName, systemPrompt, history, message) => {
  const maxRetries = 2;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`[AI SERVICE LOG] Initiating request to provider.
        - Provider: ${providerName}
        - User ID: ${userId}
        - Modules Analyzed: Moods, Journals, Sleep, Hydration, Meditation, Habits, Goals
        - Attempt: ${attempt + 1}/${maxRetries}
        - Prompt Sent to AI: "${message.substring(0, 300)}..."
      `);

      const result = await withTimeout(
        providerFn(systemPrompt, history, message),
        8000
      );
      
      if (result && result.trim() !== '') {
        console.log(`[AI SERVICE LOG] Successful completion.
          - Provider: ${providerName}
          - User ID: ${userId}
          - Raw AI Response snippet: "${result.substring(0, 200)}..."
        `);
        return result;
      }
      throw new Error('Empty response');
    } catch (err) {
      attempt++;
      console.error(`[AI SERVICE LOG] Error on provider request.
        - Provider: ${providerName}
        - User ID: ${userId}
        - Attempt: ${attempt}/${maxRetries}
        - Error Message: ${err.message}
      `);
      if (attempt < maxRetries) {
        await wait(250 * attempt); // Exponential backoff
      }
    }
  }
  throw new Error(`${providerName} failed all retries`);
};

/**
 * Main Orchestrated Service: Orchestrates routing, fallbacks, cache, queue, and limiters
 */
export const generateOrchestratedAIResponse = async (userId, chatHistory, message, userContext) => {
  // Audit log User message
  console.log(`[AI ASSISTANT AUDIT] User message: "${message}"`);

  // 1. Check Rate Limiting
  const isAllowed = checkRateLimit(userId);
  if (!isAllowed) {
    console.warn(`[AI ASSISTANT AUDIT] Rate limited request for User ID: ${userId}`);
    return `You have reached the temporary rate limit (15 requests per minute). Please take a slow deep breath, wait a minute, and try sending your message again.`;
  }

  // 2. Cache Lookup
  const cacheKey = `${userId}:${message.trim().toLowerCase()}`;
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 3 * 60 * 1000) { // 3 minute cache hits
      console.log(`[AI ASSISTANT AUDIT] Serving cached response for message: "${message}"`);
      return cached.reply;
    }
  }

  // 3. Queue request to serialize session calls
  if (!requestQueue.has(userId)) {
    requestQueue.set(userId, Promise.resolve());
  }

  const currentChain = requestQueue.get(userId);
  
  const responsePromise = currentChain.then(async () => {
    const optimizedHistory = optimizeChatHistory(chatHistory);
    
    // System instruction prompt
    const systemPrompt = `You are the MindCare AI Wellness Assistant, acting as a supportive, warm, and highly professional wellness guide.
    Your behavior must match that of an advanced conversational assistant like ChatGPT/Gemini.
    
    PIPELINE PROTOCOLS:
    1. UNDERSTAND USER INTENT & DETECT CATEGORY: Identify if the user is greeting you, having a general conversation, expressing a mental health concern, asking a question, requesting advice, requesting a telemetry/data analysis, or using emergency/crisis keywords.
    2. ANSWER NATURALLY & CONVERSATIONALLY: Ensure your response is friendly, natural, and directly addresses the user's query. Never start with templates, lists of scores, or unsolicited telemetry dashboards.
    3. CONDITIONAL TELEMETRY ANALYSIS: Only analyze and reference the user's wellness history/telemetry if it is directly relevant (e.g., they ask "how is my sleep?" or "am I doing okay?"). If a user says "I am having panic pain" or has an active mental health concern, FIRST acknowledge the concern warmly, explain calmly, provide breathing guidance (e.g. Box Breathing: inhale 4s, hold 4s, exhale 4s, hold 4s) and grounding techniques (e.g. 5-4-3-2-1 method). Encourage professional medical help if severe. ONLY AFTERWARDS, if the telemetry indicates poor sleep, high stress, low mood, or low hydration, gently mention those findings as a contributing factor or suggestion.
    4. PERSONALIZED RECOMMENDATIONS: Offer warm, practical, action-oriented advice tailored to the context. Never start with "Today's Status", "Resilience Score", "Telemetry", or "Dashboard summary".
    
    Always end your response with a short disclaimer in markdown format:
    *Disclaimer: I am an AI wellness assistant, not a licensed therapist. For professional mental health care, please consult a clinical specialist or call local support lines.*
    
    Current User Wellness Telemetry Context:
    ${userContext}
    `;

    // Priority list of providers: Gemini -> OpenAI -> xAI (Grok) -> Groq
    const providers = [
      { name: 'Google Gemini', fn: callGemini },
      { name: 'OpenAI', fn: callOpenAI },
      { name: 'xAI (Grok)', fn: callXAI },
      { name: 'Groq', fn: callGroq }
    ];

    for (const provider of providers) {
      try {
        console.log(`[AI ASSISTANT AUDIT] AI provider being used: ${provider.name}`);
        const reply = await runProviderRequest(
          userId,
          provider.fn,
          provider.name,
          systemPrompt,
          optimizedHistory,
          message
        );
        
        console.log(`[AI ASSISTANT AUDIT] Raw AI response from ${provider.name}: "${reply}"`);

        // Cache successful response
        responseCache.set(cacheKey, {
          reply,
          timestamp: Date.now()
        });
        
        return reply;
      } catch (err) {
        console.error(`[AI ASSISTANT AUDIT] Provider ${provider.name} failed: ${err.message}`);
      }
    }

    // 4. Fall back to local dynamic telemetry-based report
    console.warn('[AI ASSISTANT AUDIT] All providers failed. Executing local dynamic telemetry fallback.');
    const telemetryData = await compileFullUserTelemetry(userId);
    const fallbackReply = generateLocalChatResponse(message, telemetryData);
    
    console.log(`[AI ASSISTANT AUDIT] Raw AI response from CBT Fallback: "${fallbackReply}"`);

    responseCache.set(cacheKey, {
      reply: fallbackReply,
      timestamp: Date.now()
    });

    return fallbackReply;
  });

  // Update request queue chain
  requestQueue.set(userId, responsePromise.catch(() => {}));

  return responsePromise;
};

/**
 * ── Centralized Comprehensive Wellness Analysis Generator ──
 */
export const syncAIWellnessToMongoDB = async (userId, telemetryData, analysis) => {
  try {
    const range = getRecommendedSleepRange(telemetryData.age);
    
    // Calculate sleep average
    const sleepLogs = telemetryData.wellnessStats || [];
    let sleepRatingStr = 'No sleep records';
    if (sleepLogs.length > 0) {
      const avgSleep = sleepLogs.reduce((sum, w) => sum + (w.sleepHours || 7), 0) / sleepLogs.length;
      const ratingObj = calculateSleepRating(telemetryData.age, avgSleep);
      sleepRatingStr = `${ratingObj.rating}: ${ratingObj.explanation}`;
    }

    // Calculate hydration
    const waterLogs = telemetryData.waterSummaries || [];
    let waterRatingStr = 'No hydration records';
    if (waterLogs.length > 0) {
      const avgWater = waterLogs.reduce((sum, s) => sum + (s.totalIntake || 0), 0) / waterLogs.length;
      const avgGoal = waterLogs.reduce((sum, s) => sum + (s.goal || 2000), 0) / waterLogs.length;
      const pct = avgGoal > 0 ? (avgWater / avgGoal) * 100 : 0;
      let waterRating = 'Poor';
      if (pct >= 100) waterRating = 'Excellent';
      else if (pct >= 75) waterRating = 'Good';
      else if (pct >= 50) waterRating = 'Fair';
      waterRatingStr = `${waterRating} (${Math.round(avgWater)} ml / Goal ${Math.round(avgGoal)} ml)`;
    }

    // Calculate mood status
    const moodLogs = telemetryData.moods || [];
    let moodRatingStr = 'No mood logs';
    if (moodLogs.length > 0) {
      const avgMood = moodLogs.reduce((sum, m) => sum + (m.score || 5), 0) / moodLogs.length;
      const avgStress = moodLogs.reduce((sum, m) => sum + (m.stressLevel || 3), 0) / moodLogs.length;
      let moodRating = 'Stable';
      if (avgMood >= 8) moodRating = 'Optimal / Excellent';
      else if (avgMood < 4) moodRating = 'Poor / Low';
      moodRatingStr = `${moodRating} (Mood ${avgMood.toFixed(1)}/10, Stress ${avgStress.toFixed(1)}/10)`;
    }

    // Find and update or create with all production wellness fields
    await AIWellness.findOneAndUpdate(
      { userId },
      {
        userId,
        age: telemetryData.age,
        recommendedSleep: range.label,
        calculatedSleepRating: sleepRatingStr,
        aiWellnessSummary: analysis.overallWellnessSummary,
        overallWellnessScore: analysis.overallWellnessScore || 70,
        latestRecommendations: analysis.personalizedRecommendations,
        sleepStatus: analysis.sleepAnalysis || sleepRatingStr,
        hydrationStatus: analysis.hydrationAnalysis || waterRatingStr,
        moodStatus: analysis.moodTrend || moodRatingStr,
        
        // Sync new comprehensive fields
        mentalWellnessStatus: analysis.mentalWellnessStatus || '',
        physicalWellnessStatus: analysis.physicalWellnessStatus || '',
        emotionalTrends: analysis.emotionalTrends || '',
        journalAnalysis: analysis.journalAnalysis || '',
        exerciseAnalysis: analysis.exerciseAnalysis || '',
        meditationAnalysis: analysis.meditationAnalysis || '',
        habitAnalysis: analysis.habitAnalysis || '',
        behaviourCorrelations: analysis.behaviourCorrelations || '',
        positiveChanges: analysis.positiveChanges || '',
        areasNeedingAttention: analysis.areasNeedingAttention || '',
        riskFactors: analysis.riskFactors || '',
        todayPriority: analysis.todayPriority || '',
        weeklySummary: analysis.weeklySummary || '',
        longTermProgress: analysis.longTermProgress || '',

        $push: {
          aiInsightHistory: {
            $each: [{
              summary: analysis.overallWellnessSummary,
              score: analysis.overallWellnessScore || 70,
              timestamp: new Date()
            }],
            $slice: -20 // keep last 20 insights history
          }
        }
      },
      { upsert: true, new: true }
    );
    console.log(`[AI ASSISTANT AUDIT] Successfully synchronized wellness parameters to MongoDB for user ${userId}`);
  } catch (err) {
    console.error(`[AI ASSISTANT AUDIT] Failed to synchronize wellness analysis to MongoDB: ${err.message}`);
  }
};

/**
 * ── Centralized Comprehensive Wellness Analysis Generator ──
 */
export const generateWellnessAnalysis = async (userId) => {
  const cacheKey = `${userId}:wellness_analysis`;
  
  // Cache lookup (valid for 3 minutes)
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 3 * 60 * 1000) {
      console.log(`[AI ASSISTANT AUDIT] Serving cached wellness analysis for User ID: ${userId}`);
      return cached.reply;
    }
  }

  // Load user data from MongoDB
  const telemetryData = await compileFullUserTelemetry(userId);
  const totalLogs = (telemetryData.moods?.length || 0) + 
                    (telemetryData.journals?.length || 0) + 
                    (telemetryData.waterSummaries?.length || 0) + 
                    (telemetryData.meditationHistory?.length || 0) + 
                    (telemetryData.habits?.length || 0);

  if (totalLogs === 0) {
    console.log(`[AI ASSISTANT AUDIT] Insufficient telemetry data for User ID: ${userId}. Returning local defaults.`);
    const localAnalysis = generateLocalWellnessAnalysis(telemetryData);
    return localAnalysis;
  }

  const textContext = formatUserTelemetryText(telemetryData);

  const systemPrompt = `You are a professional medical wellness and clinical health AI analyzer. You output ONLY raw JSON.`;
  const userPrompt = `Based on the user's live wellness telemetry history:
${textContext}

Generate a comprehensive wellness analysis JSON object containing exactly these fields (do not wrap in markdown tags or extra text, just raw JSON):
{
  "overallWellnessSummary": "A concise bulleted list summarizing the user's wellness. Use exactly 2-3 short, distinct bullet points separated by newlines (each starting with '• '). Keep each bullet point under 10 words. Do not write a long paragraph.",
  "currentWellnessStatus": "A summary statement indicating their current emotional/physical resilience status.",
  "topPositiveHabit": "Highlight of their top positive habit based on real stats. Keep it extremely short, direct, and straightforward (max 6-8 words). Do not explain much.",
  "biggestAreaForImprovement": "Highlight of their biggest risk area or concern. Keep it extremely short, direct, and straightforward (max 6-8 words). Do not explain much.",
  "sleepAnalysis": "Analysis of sleep hours relative to recommended hours.",
  "moodTrend": "Analysis of stress patterns.",
  "hydrationAnalysis": "Analysis of water intake vs goals.",
  "journalAnalysis": "Analysis of journal entries and sentiments.",
  "exerciseAnalysis": "Analysis of active exercise habits.",
  "meditationAnalysis": "Analysis of meditation consistency.",
  "habitConsistency": "Evaluation of general habit completion.",
  
  "mentalWellnessStatus": "Specific status evaluation of cognitive and mental parameters.",
  "physicalWellnessStatus": "Specific status evaluation of physical activity, sleep, and hydration parameters.",
  "emotionalTrends": "Analysis of daily mood changes, stress, and anxiety triggers.",
  "habitAnalysis": "Evaluation of general positive habits configuration.",
  "behaviourCorrelations": "Identified patterns between metrics, e.g. sleep and mood, hydration and physical stress.",
  "positiveChanges": "Identified improvements or milestones achieved recently.",
  "areasNeedingAttention": "Crucial risk areas or habits that need correction.",
  "riskFactors": "Clinically-grounded stress or fatigue indicators.",
  "todayPriority": "The absolute highest priority item to address today.",
  "weeklySummary": "High-level summary of the user's weekly health performance.",
  "longTermProgress": "Comparison of current levels with historical averages.",

  "personalizedRecommendations": [
    "First personalized recommendation.",
    "Second personalized recommendation.",
    "Third personalized recommendation."
  ],
  "nextBestAction": "The single highest priority action they should take next.",
  "overallWellnessScore": 85
}
`;

  // Fallback chain: Gemini -> OpenAI -> xAI (Grok) -> Groq
  const providers = [
    { name: 'Google Gemini', fn: callGemini },
    { name: 'OpenAI', fn: callOpenAI },
    { name: 'xAI (Grok)', fn: callXAI },
    { name: 'Groq', fn: callGroq }
  ];

  for (const provider of providers) {
    try {
      console.log(`[AI ASSISTANT AUDIT] Running wellness analysis using provider: ${provider.name}`);
      const rawResponse = await runProviderRequest(
        userId,
        provider.fn,
        provider.name,
        systemPrompt,
        [], // Empty history
        userPrompt
      );

      if (rawResponse) {
        // Strip markdown wrappers if any
        const cleanJson = rawResponse.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        responseCache.set(cacheKey, {
          reply: parsed,
          timestamp: Date.now()
        });

        // Synchronize to MongoDB
        await syncAIWellnessToMongoDB(userId, telemetryData, parsed);

        return parsed;
      }
    } catch (err) {
      console.error(`[AI ASSISTANT AUDIT] Provider ${provider.name} failed for wellness analysis: ${err.message}`);
    }
  }

  // Local fallback if all external LLM services are offline/fail
  console.warn('[AI ASSISTANT AUDIT] All providers failed for wellness analysis. Executing local data-driven fallback.');
  const localAnalysis = generateLocalWellnessAnalysis(telemetryData);
  
  responseCache.set(cacheKey, {
    reply: localAnalysis,
    timestamp: Date.now()
  });

  // Synchronize to MongoDB
  await syncAIWellnessToMongoDB(userId, telemetryData, localAnalysis);

  return localAnalysis;
};

export const recalculateUserWellnessScores = async (userId, age) => {
  try {
    const statsList = await WellnessStats.find({ user: userId });
    const range = getRecommendedSleepRange(age);
    const sleepTargetMin = range.min;

    for (const stats of statsList) {
      const dateStr = stats.date.toISOString().slice(0, 10);
      const waterSummary = await DailyWaterSummary.findOne({ userId, date: dateStr });
      const waterGoal = waterSummary ? waterSummary.goal : 2000;

      const sleepScore = Math.min((stats.sleepHours || 0) / sleepTargetMin, 1) * 35;
      const waterScore = Math.min((stats.waterIntake || 0) / waterGoal, 1) * 35;
      const meditationScore = Math.min((stats.meditationMinutes || 0) / 15, 1) * 30;

      stats.wellnessScore = Math.round(sleepScore + waterScore + meditationScore);
      await stats.save();
    }
    console.log(`[AI SERVICE] Recalculated wellness stats for user ${userId} (age ${age}, sleep target ${sleepTargetMin}h)`);
  } catch (error) {
    console.error(`[AI SERVICE] Failed to recalculate wellness stats for user ${userId}:`, error.message);
  }
};
