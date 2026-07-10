import Groq from 'groq-sdk';
import { generateOrchestratedAIResponse } from './aiService.js';

const GROK_API_URL = process.env.XAI_API_URL || 'https://api.xai.com/v1';
const GROK_MODEL = process.env.XAI_MODEL || 'grok-beta';

let groqClient = null;

// Initialize Groq client as a fallback option
try {
  if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (error) {
  console.error('❌ Failed to initialize Groq SDK fallback:', error.message);
}

const SYSTEM_PROMPT = `You are the MindCare AI Wellness Assistant. Your goal is to guide corporate employees and wellness practitioners toward emotional resilience and mental health mindfulness.
You are supporting the user using cognitive behavioral therapy (CBT) principles, box-breathing guidance, stress/burnout alerts, gratitude prompts, and motivational feedback.

CRITICAL INSTRUCTIONS:
1. Do NOT present yourself as a licensed therapist or a medical doctor.
2. Provide coping suggestions, mindfulness recommendations, and wellness tips.
3. Keep your advice clinically supported, positive, empathetic, and actionable.
4. If low sleep, high stress, or anxiety indicators are present in the user's context, address them with gentle habit recommendations (e.g. hydration, mindfulness break).
5. Recommend relevant educational Articles, Support Groups (e.g. Students Support, Working Professionals, Parents Circle, Anxiety Support, Stress Management), Meditation Sessions, or Breathing Exercises (e.g. Box Breathing, 4-7-8 Breathing Reset) when users ask for resources, coping methods, or show high stress telemetry indicators.
6. Always end your response with a short disclaimer in markdown format:
   *Disclaimer: I am an AI wellness assistant, not a licensed therapist. For professional mental health care, please consult a clinical specialist or call local support lines.*
`;

/**
 * Generic completions fetch request supporting xAI Grok and Groq SDK fallback
 */
export const callGrokCompletions = async (messages, options = {}) => {
  const apiKey = process.env.XAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(`${GROK_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1024,
          response_format: options.response_format
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      } else {
        const errText = await response.text();
        console.error(`[Grok Service] API Error (Status ${response.status}):`, errText);
      }
    } catch (err) {
      console.error('[Grok Service] Connection Error:', err.message);
    }
  }

  // Fallback to Groq SDK
  if (groqClient) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1024,
        response_format: options.response_format
      });
      return completion.choices?.[0]?.message?.content || '';
    } catch (err) {
      console.error('[Grok Service] Groq SDK Fallback Error:', err.message);
    }
  }

  return '';
};

// Compile 7-day user telemetry into a textual context summary for the system prompt
export const analyzeUserHealthContext = (moods, journals, habits = [], goals = [], analytics = null) => {
  let context = 'User Profile & Recent Telemetry Summary:\n';

  if (!moods || moods.length === 0) {
    context += '- No recent mood logs recorded.\n';
  } else {
    context += `- Last logged mood: ${moods[0].mood} (Intensity: ${moods[0].intensity}/10, Stress: ${moods[0].stressLevel}/10, Sleep: ${moods[0].sleepHours}h)\n`;
    
    const avgStress = moods.reduce((sum, m) => sum + m.stressLevel, 0) / moods.length;
    const avgSleep = moods.reduce((sum, m) => sum + m.sleepHours, 0) / moods.length;
    const avgAnxiety = moods.reduce((sum, m) => sum + m.anxietyLevel, 0) / moods.length;

    context += `- 7-Day Averages: Stress: ${avgStress.toFixed(1)}/10, Sleep: ${avgSleep.toFixed(1)} hrs, Anxiety: ${avgAnxiety.toFixed(1)}/10\n`;
    
    if (avgStress >= 7) context += '- ALERT: High stress patterns detected.\n';
    if (avgSleep < 6) context += '- ALERT: Consistent sleep deficit detected.\n';
  }

  if (!journals || journals.length === 0) {
    context += '- No recent journal entries recorded.\n';
  } else {
    context += `- Last CBT Journal Title: "${journals[0].title}"\n`;
    const sentiments = journals.map(j => j.sentiment).filter(Boolean);
    context += `- Recent Sentiments: ${sentiments.join(', ')}\n`;
    
    if (sentiments.includes('exhausted') || sentiments.includes('anxious')) {
      context += '- ALERT: Sentiment signals high cognitive workload or exhaustion.\n';
    }
  }

  if (!habits || habits.length === 0) {
    context += '- No daily habits configured.\n';
  } else {
    const completedToday = habits.filter(h => h.completed).length;
    context += `- Active Habits: ${habits.length} habits tracked. (${completedToday} checked off today).\n`;
    habits.forEach(h => {
      context += `  * Habit "${h.habitName}" (Category: ${h.category}, Streak: ${h.streak} days)\n`;
    });
  }

  if (!goals || goals.length === 0) {
    context += '- No active goals set.\n';
  } else {
    const pendingGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);
    context += `- Goals Status: ${completedGoals.length} completed, ${pendingGoals.length} pending.\n`;
    if (pendingGoals.length > 0) {
      context += `  * Active Goal: "${pendingGoals[0].title}" (Category: ${pendingGoals[0].category})\n`;
    }
  }

  if (analytics) {
    context += `- Corporate Wellness Summary Metrics:\n`;
    context += `  * Wellness Index Score: ${analytics.wellnessScore || 50}%\n`;
    context += `  * Mental Health Rating: ${analytics.mentalHealthScore || 50}%\n`;
  }

  return context;
};

// Chat Response
export const generateChatResponse = async (chatHistory, newUserMessage, userContext, userId) => {
  const finalUserId = userId || 'legacy_caller';
  return generateOrchestratedAIResponse(finalUserId, chatHistory, newUserMessage, userContext);
};

// Dashboard Insights
export const generateDashboardInsights = async (moods, journals, habits = [], goals = [], analytics = null) => {
  const context = analyzeUserHealthContext(moods, journals, habits, goals, analytics);
  const fallbackInsights = getFallbackDashboardInsights(context);

  const prompt = `Based on this user context:\n${context}\nGenerate a JSON object containing exactly these fields (do not wrap in markdown tags or extra text, just raw JSON):
{
  "wellnessTip": "A short, actionable 1-sentence tip based on their recent stats.",
  "dailyInsight": "A 1-sentence analytical observation of their emotional trends or stress warning alerts.",
  "suggestedActivity": "A specific mindfulness exercise or breathing recommendation (e.g. '10-minute deep box breathing')."
}`;

  const responseText = await callGrokCompletions(
    [
      { role: 'system', content: 'You are a wellness stats analyzer. You only respond with raw JSON.' },
      { role: 'user', content: prompt }
    ],
    { temperature: 0.5, response_format: { type: 'json_object' } }
  );

  if (responseText) {
    try {
      const parsed = JSON.parse(responseText);
      return {
        wellnessTip: parsed.wellnessTip || fallbackInsights.wellnessTip,
        dailyInsight: parsed.dailyInsight || fallbackInsights.dailyInsight,
        suggestedActivity: parsed.suggestedActivity || fallbackInsights.suggestedActivity
      };
    } catch {
      // Fallback if JSON parse fails
    }
  }

  return fallbackInsights;
};

// Modular helper for journalController summary, tone, questions
export const askGrok = async (systemPrompt, userPrompt) => {
  const responseText = await callGrokCompletions([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { temperature: 0.7 });

  return responseText || null;
};

// Fallback Rule-Based Chat Generator
function generateFallbackChatResponse(message, context) {
  const lowerMsg = message.toLowerCase();
  let reply = '';

  if (lowerMsg.includes('stress') || lowerMsg.includes('overwhelm') || lowerMsg.includes('burnout')) {
    reply = `It sounds like you're experiencing a significant amount of stress right now. When feeling overloaded, a quick grounding technique can help reset your nervous system. Try the **5-4-3-2-1 Grounding Method**:
- Focus on **5** things you can see around you.
- **4** things you can touch.
- **3** things you can hear.
- **2** things you can smell.
- **1** thing you can taste.
This guides your attention back to the present moment, calming automatic anxious thinking.`;
  } else if (lowerMsg.includes('sleep') || lowerMsg.includes('tired') || lowerMsg.includes('fatigue')) {
    reply = `I see that sleep has been on your mind or is showing up as a deficit in your stats. Prioritizing rest is crucial for cognitive focus and emotional balance.
To help prepare your body for deep sleep:
1. Turn off digital screens 45 minutes before bed.
2. Try a **progressive muscle relaxation** session (tensing and releasing muscles from toe to head).
3. Log your water intake to ensure hydration isn't affecting your sleep quality.`;
  } else if (lowerMsg.includes('anxious') || lowerMsg.includes('worry') || lowerMsg.includes('panic')) {
    reply = `When anxiety begins to escalate, focusing on your breathing is one of the fastest ways to trigger a parasympathetic calm response.
I suggest practicing **Box Breathing**:
- Inhale deeply for **4 seconds**.
- Hold your breath for **4 seconds**.
- Exhale completely for **4 seconds**.
- Rest empty for **4 seconds**.
Repeat this cycle 4 to 5 times. You can also log a CBT journal entry to challenge the evidence for your worries.`;
  } else if (lowerMsg.includes('motivation') || lowerMsg.includes('lazy') || lowerMsg.includes('focus')) {
    reply = `Motivation naturally fluctuates. On days when energy feels low, try using the **Five-Minute Rule**: commit to working on your primary task for just five minutes. If you want to stop after five minutes, you have permission to do so. Often, taking that initial small action makes it much easier to sustain momentum. How does that feel to start with today?`;
  } else {
    reply = `Hello! I am your AI Wellness Assistant. I've analyzed your recent mood records. It looks like you're practicing positive habits, but keeping a steady focus on regular water intake and consistent sleep will help stabilize your wellness score.
Let's talk through whatever is on your mind today, or I can suggest a breathing exercise to help center your thoughts.`;
  }

  if (context.includes('ALERT: Consistent sleep deficit detected')) {
    reply += `\n\n*Note: I noticed your recent logs indicate a sleep deficit. Please focus on getting restful sleep tonight.*`;
  }
  if (context.includes('ALERT: High stress patterns detected')) {
    reply += `\n\n*Note: High stress levels are detected in your 7-day stats. A 10-minute breathing break is highly recommended.*`;
  }

  reply += `\n\n*Disclaimer: I am an AI wellness assistant, not a licensed therapist. For professional mental health care, please consult a clinical specialist or call local support lines.*`;
  return reply;
}

// Fallback Dashboard Insights
function getFallbackDashboardInsights(context) {
  let wellnessTip = 'Practice 5 minutes of mindful box breathing to restore emotional focus.';
  let dailyInsight = 'Your emotional analytics show stable resilience levels today.';
  let suggestedActivity = 'Box Breathing (5 mins)';

  if (context.includes('ALERT: Consistent sleep deficit detected')) {
    wellnessTip = 'Prioritize wind-down routines tonight. Sleep debt affects wellness scores.';
    dailyInsight = 'Sleep logs are below target. Keep hydration levels above 2000ml to compensate.';
    suggestedActivity = 'Sensory Lab Wind-down (10 mins)';
  } else if (context.includes('ALERT: High stress patterns detected') || context.includes('anxious')) {
    wellnessTip = 'Schedule brief micro-breaks today to manage compounding sensory workloads.';
    dailyInsight = 'Stress warnings detected in active mood logs. Practice mindful pacing.';
    suggestedActivity = 'Box Breathing Exercise (10 mins)';
  }

  return { wellnessTip, dailyInsight, suggestedActivity };
}
