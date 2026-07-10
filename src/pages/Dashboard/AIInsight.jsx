import React, { useState, useEffect } from 'react';
import { Sparkles, Activity, TrendingUp, AlertTriangle, Compass, Moon, Heart, Droplet, PenTool, Dumbbell, Calendar, Target, Info, RefreshCw, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Loading Skeleton Component
function MetricSkeleton() {
  return (
    <div className="animate-pulse space-y-3 mt-2.5 p-4 rounded-2xl border border-dashed border-[#E9E2FF] bg-[#FAF9FF]/30 text-left">
      <div className="h-3 bg-gray-200 rounded-full w-24 mb-1"></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-10 bg-gray-100 rounded-xl"></div>
        <div className="h-10 bg-gray-100 rounded-xl"></div>
      </div>
      <div className="h-12 bg-gray-100 rounded-xl"></div>
    </div>
  );
}

// Empty State Component
function MetricEmptyState({ title }) {
  return (
    <div className="mt-2.5 p-5 rounded-2xl border border-dashed border-[#E9E2FF] bg-[#FAF9FF]/40 text-center space-y-2.5">
      <Info className="w-6 h-6 text-gray-400 mx-auto" />
      <div>
        <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">No {title} Logged</h4>
        <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-[220px] mx-auto mt-1">
          Complete daily logging check-ins on your dashboard to see active telemetry insights.
        </p>
      </div>
    </div>
  );
}

// Error State Component
// Shows a retry button to re-fetch telemetry data
function MetricErrorState({ onRetry }) {
  return (
    <div className="mt-2.5 p-5 rounded-2xl border border-rose-100 bg-rose-50/50 text-center space-y-3">
      <AlertTriangle className="w-6 h-6 text-rose-550 mx-auto" />
      <div>
        <h4 className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">Data Fetch Failed</h4>
        <p className="text-[10px] text-rose-600 font-semibold leading-relaxed max-w-[200px] mx-auto mt-1">
          Secure connection to the analytics database failed.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 mx-auto flex items-center gap-1 shadow-sm shadow-rose-600/10"
      >
        <RefreshCw className="w-3 h-3" /> Retry Connection
      </button>
    </div>
  );
}

// Sleep Analysis Panel
function SleepPanel({ data }) {
  if (!data || !data.averages || data.averages.count === 0) {
    return <MetricEmptyState title="Sleep Logs" />;
  }

  const { avgSleep, avgWellnessScore } = data.averages;
  const recommended = data.recommendedSleep || '7–9 hours';

  return (
    <div className="p-4 rounded-2xl border border-[#E9E2FF]/60 bg-[#FAF9FF]/40 space-y-3 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-indigo-500 uppercase tracking-wider">Target Range</span>
          <p className="text-xs font-black text-gray-900">{recommended}</p>
        </div>
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-indigo-500 uppercase tracking-wider">30d Average</span>
          <p className="text-xs font-black text-gray-900">{avgSleep ? avgSleep.toFixed(1) : 0} hrs</p>
        </div>
      </div>
      
      <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-1 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-[8px] font-extrabold text-[#7C5CFF] uppercase tracking-wider">Wellness Score</span>
          <span className="text-[10px] font-extrabold text-[#7C5CFF]">{Math.round(avgWellnessScore || 70)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-[#7C5CFF] to-[#A88BFF] h-1.5 rounded-full" 
            style={{ width: `${Math.min(100, Math.max(0, avgWellnessScore || 70))}%` }}
          />
        </div>
      </div>

      {data.dailyHistory && data.dailyHistory.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider pl-0.5">Recent History</span>
          <div className="space-y-1 bg-white border border-[#E9E2FF]/40 rounded-xl p-2 max-h-[100px] overflow-y-auto scrollbar-thin">
            {data.dailyHistory.slice(0, 3).map((h, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-[#FAF9FF] last:border-b-0 text-[10px]">
                <span className="font-bold text-gray-500">{h.date}</span>
                <span className="font-extrabold text-gray-800">{h.sleep ? h.sleep.toFixed(1) : 0} hrs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mood Trend Panel
function MoodPanel({ data }) {
  if (!data || !data.analytics || data.analytics.avgMoodScore === 0) {
    return <MetricEmptyState title="Moods" />;
  }

  const { avgMoodScore, mostFrequentMood, weeklyAverage, monthlyAverage } = data.analytics;

  return (
    <div className="p-4 rounded-2xl border border-[#E9E2FF]/60 bg-[#FAF9FF]/40 space-y-3 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-rose-500 uppercase tracking-wider">Averages (30d)</span>
          <p className="text-xs font-black text-gray-900">{avgMoodScore || 0}/10</p>
        </div>
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-rose-500 uppercase tracking-wider">Dominant Mood</span>
          <p className="text-[10px] font-black text-gray-900 truncate">{mostFrequentMood || 'None'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-white border border-[#E9E2FF]/40 rounded-xl p-2.5 text-[9.5px]">
        <div className="flex justify-between border-r border-[#FAF9FF] pr-2">
          <span className="text-gray-400 font-bold">7-Day Avg</span>
          <span className="font-black text-gray-800">{weeklyAverage || 0}/10</span>
        </div>
        <div className="flex justify-between pl-2">
          <span className="text-gray-400 font-bold">30-Day Avg</span>
          <span className="font-black text-gray-800">{monthlyAverage || 0}/10</span>
        </div>
      </div>

      {data.history && data.history.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider pl-0.5">Recent Logs</span>
          <div className="space-y-1 bg-white border border-[#E9E2FF]/40 rounded-xl p-2 max-h-[100px] overflow-y-auto scrollbar-thin">
            {data.history.slice(0, 3).map((m, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-[#FAF9FF] last:border-b-0 text-[10px]">
                <span className="font-bold text-gray-500">{m.entryDate || new Date(m.createdAt).toDateString().slice(4, 15)}</span>
                <span className="font-black text-rose-650">{m.mood} ({m.score || 0}/10)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hydration Status Panel
function HydrationPanel({ data }) {
  if (!data || data.avgDailyIntake === 0) {
    return <MetricEmptyState title="Hydration" />;
  }

  const { todayIntake, goal, percentage, streak, longestStreak, avg7DayIntake, goalCompletionRate } = data;

  return (
    <div className="p-4 rounded-2xl border border-[#E9E2FF]/60 bg-[#FAF9FF]/40 space-y-3 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-sky-500 uppercase tracking-wider">Today's Intake</span>
          <p className="text-xs font-black text-gray-900">{todayIntake || 0} / {goal || 2000} ml</p>
        </div>
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-sky-500 uppercase tracking-wider">Goal Achieved</span>
          <p className="text-xs font-black text-gray-900">{percentage || 0}%</p>
        </div>
      </div>

      <div className="p-2.5 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-1.5 text-[9.5px]">
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">7-Day Avg</span>
          <span className="font-black text-gray-800">{avg7DayIntake || 0} ml</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">30d Completion Rate</span>
          <span className="font-black text-gray-800">{goalCompletionRate || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">Streak</span>
          <span className="font-black text-sky-650">{streak || 0} days (Max: {longestStreak || 0})</span>
        </div>
      </div>
    </div>
  );
}

// Journaling Insights Panel
function JournalPanel({ data }) {
  if (!data || !data.analytics || data.analytics.totalEntries === 0) {
    return <MetricEmptyState title="Journal Entries" />;
  }

  const { totalEntries, currentStreak, longestStreak, weeklyCount, avgWords } = data.analytics;

  const tagsSet = new Set();
  data.journals?.slice(0, 10).forEach(j => {
    j.tags?.forEach(tag => tagsSet.add(tag));
  });
  const tagsList = Array.from(tagsSet).slice(0, 3);

  const sentiments = data.journals?.slice(0, 10).map(j => j.sentiment).filter(Boolean) || [];
  const sentimentsCounts = {};
  sentiments.forEach(s => sentimentsCounts[s] = (sentimentsCounts[s] || 0) + 1);
  const dominantSentiment = Object.keys(sentimentsCounts).length > 0 
    ? Object.keys(sentimentsCounts).reduce((a, b) => sentimentsCounts[a] > sentimentsCounts[b] ? a : b)
    : 'neutral';

  return (
    <div className="p-4 rounded-2xl border border-[#E9E2FF]/60 bg-[#FAF9FF]/40 space-y-3 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-amber-500 uppercase tracking-wider">Total Entries</span>
          <p className="text-xs font-black text-gray-900">{totalEntries || 0}</p>
        </div>
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-amber-500 uppercase tracking-wider">Dominant Sentiment</span>
          <p className="text-xs font-black text-gray-900 capitalize text-amber-600">{dominantSentiment}</p>
        </div>
      </div>

      <div className="p-2.5 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-1 text-[9.5px]">
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">This Week</span>
          <span className="font-black text-gray-800">{weeklyCount || 0} entries</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">Average Length</span>
          <span className="font-black text-gray-800">{avgWords || 0} words</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">Streak</span>
          <span className="font-black text-amber-650">{currentStreak || 0} days (Max: {longestStreak || 0})</span>
        </div>
      </div>

      {tagsList.length > 0 && (
        <div className="space-y-1">
          <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider pl-0.5">Top Keywords</span>
          <div className="flex gap-1.5 flex-wrap">
            {tagsList.map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-[#FAF9FF] border border-[#E9E2FF]/60 text-gray-505 font-bold text-[9px] rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Exercise Activity Panel
function ExercisePanel({ data }) {
  if (!data || data.length === 0) {
    return <MetricEmptyState title="Exercise Habits" />;
  }

  const totalExercises = data.length;
  const totalStreaks = data.reduce((sum, h) => sum + (h.streak || 0), 0);
  const totalCompletions = data.reduce((sum, h) => sum + (h.completedDates?.length || 0), 0);

  return (
    <div className="p-4 rounded-2xl border border-[#E9E2FF]/60 bg-[#FAF9FF]/40 space-y-3 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-purple-500 uppercase tracking-wider">Exercise Habits</span>
          <p className="text-xs font-black text-gray-900">{totalExercises}</p>
        </div>
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-purple-500 uppercase tracking-wider">Total Completions</span>
          <p className="text-xs font-black text-gray-900">{totalCompletions} times</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider pl-0.5">Habit Checklist</span>
        <div className="space-y-1 bg-white border border-[#E9E2FF]/40 rounded-xl p-2 max-h-[120px] overflow-y-auto scrollbar-thin">
          {data.map((h, idx) => (
            <div key={idx} className="flex justify-between items-center py-1.5 border-b border-[#FAF9FF] last:border-b-0 text-[10px]">
              <span className="font-bold text-gray-800 truncate pr-2 flex-1">{h.habitName}</span>
              <span className="font-black text-purple-650 shrink-0">{h.streak || 0}d streak</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Meditation Practice Panel
function MeditationPanel({ data }) {
  if (!data || data.minutesMeditated === 0) {
    return <MetricEmptyState title="Meditation Stats" />;
  }

  const { minutesMeditated, completedSessions, longestMeditation, currentStreak, completionRate, weeklyMinutes } = data;

  return (
    <div className="p-4 rounded-2xl border border-[#E9E2FF]/60 bg-[#FAF9FF]/40 space-y-3 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-emerald-500 uppercase tracking-wider">Total Duration</span>
          <p className="text-xs font-black text-gray-900">{minutesMeditated || 0} mins</p>
        </div>
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-emerald-500 uppercase tracking-wider">Completed</span>
          <p className="text-xs font-black text-gray-900">{completedSessions || 0} sessions</p>
        </div>
      </div>

      <div className="p-2.5 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-1 text-[9.5px]">
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">This Week</span>
          <span className="font-black text-gray-800">{weeklyMinutes || 0} mins</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">Longest Session</span>
          <span className="font-black text-gray-800">{longestMeditation || 0} mins</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">Completion Rate</span>
          <span className="font-black text-gray-800">{completionRate || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-bold">Streak</span>
          <span className="font-black text-emerald-650">{currentStreak || 0} days</span>
        </div>
      </div>
    </div>
  );
}

// Habit Streaks Panel
function HabitsPanel({ data }) {
  if (!data || data.length === 0) {
    return <MetricEmptyState title="Habits" />;
  }

  const totalHabits = data.length;
  const completedToday = data.filter(h => h.completedToday || h.completed).length;

  return (
    <div className="p-4 rounded-2xl border border-[#E9E2FF]/60 bg-[#FAF9FF]/40 space-y-3 text-left">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Habits</span>
          <p className="text-xs font-black text-gray-900">{totalHabits}</p>
        </div>
        <div className="p-3 bg-white border border-[#E9E2FF]/40 rounded-xl space-y-0.5 shadow-sm">
          <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Today's Progress</span>
          <p className="text-xs font-black text-gray-900">{completedToday} / {totalHabits}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider pl-0.5">Habit Details</span>
        <div className="space-y-1.5 bg-white border border-[#E9E2FF]/40 rounded-xl p-2.5 max-h-[120px] overflow-y-auto scrollbar-thin">
          {data.map((h, idx) => (
            <div key={idx} className="flex justify-between items-center py-1 border-b border-[#FAF9FF] last:border-b-0 text-[10px]">
              <span className="font-bold text-gray-800 truncate pr-2 flex-1">{h.habitName}</span>
              <div className="flex gap-2 shrink-0">
                <span className="text-gray-400 font-medium capitalize">{h.category}</span>
                <span className="font-black text-slate-650">{h.streak || 0}d</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIInsight({ aiWellness, onOpenMood, onOpenJournal }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'metrics'
  
  // Interactive Metric States
  const [selectedMetric, setSelectedMetric] = useState('sleep'); // 'sleep' | 'mood' | 'hydration' | 'journal' | 'exercise' | 'meditation' | 'habits'
  const [metricData, setMetricData] = useState(null);
  const [metricLoading, setMetricLoading] = useState(false);
  const [metricError, setMetricError] = useState(null);

  // Fetch real data on metric selection
  const fetchMetricData = async (metric) => {
    setMetricLoading(true);
    setMetricError(null);
    try {
      let data = {};
      if (metric === 'sleep') {
        const [dashRes, profileRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/user/profile')
        ]);
        data = {
          averages: dashRes.data.wellness?.averages,
          dailyHistory: dashRes.data.wellness?.dailyHistory,
          recommendedSleep: profileRes.data.profile?.recommendedSleep
        };
      } else if (metric === 'mood') {
        const [analyticsRes, historyRes] = await Promise.all([
          api.get('/moods/analytics'),
          api.get('/moods')
        ]);
        data = {
          analytics: analyticsRes.data.analytics,
          history: historyRes.data.moods || historyRes.data.entries || []
        };
      } else if (metric === 'hydration') {
        const response = await api.get('/water/stats');
        data = response.data.stats;
      } else if (metric === 'journal') {
        const [analyticsRes, journalsRes] = await Promise.all([
          api.get('/journals/analytics'),
          api.get('/journals')
        ]);
        data = {
          analytics: analyticsRes.data.analytics,
          journals: journalsRes.data.journals || journalsRes.data.entries || []
        };
      } else if (metric === 'exercise') {
        const response = await api.get('/habits');
        const habits = response.data.habits || [];
        data = habits.filter(h => h.category?.toLowerCase() === 'exercise');
      } else if (metric === 'meditation') {
        const response = await api.get('/meditations/stats');
        data = response.data.stats;
      } else if (metric === 'habits') {
        const response = await api.get('/habits');
        data = response.data.habits || [];
      }
      setMetricData(data);
    } catch (err) {
      console.error(`Failed to fetch ${metric} telemetry data:`, err);
      setMetricError(`Failed to load ${metric} data.`);
    } finally {
      setMetricLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'metrics' && selectedMetric && aiWellness && aiWellness.hasInsights !== false) {
      fetchMetricData(selectedMetric);
    }
  }, [activeTab, selectedMetric, aiWellness]);

  if (aiWellness && aiWellness.error) {
    return (
      <div className="bg-white border border-rose-100/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(244,63,94,0.02)] text-left flex flex-col justify-center items-center h-full min-h-[300px] text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
          <AlertTriangle className="w-6 h-6 animate-bounce" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">AI Insights Unavailable</h4>
          <p className="text-[10px] text-rose-650 font-semibold leading-relaxed max-w-[220px] mx-auto mt-1">
            {aiWellness.error}
          </p>
        </div>
      </div>
    );
  }

  if (!aiWellness) {
    return (
      <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left flex flex-col justify-center items-center h-full min-h-[300px]">
        <Sparkles className="w-8 h-8 text-[#7C5CFF] animate-spin mb-3" />
        <p className="text-xs text-gray-550 font-semibold">AI compiling wellness telemetry...</p>
      </div>
    );
  }

  if (aiWellness.hasInsights === false) {
    return (
      <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.02)] text-left flex flex-col justify-between h-full relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#FAF9FF] mb-4">
          <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider flex items-center gap-1.5 pl-0.5">
            <Sparkles className="w-4 h-4 text-[#7C5CFF] fill-[#7C5CFF]/10" /> AI Insights
          </h3>
        </div>

        {/* Empty State Content */}
        <div className="flex-1 flex flex-col justify-center items-center py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF9FF] border border-[#E9E2FF]/60 flex items-center justify-center text-[#7C5CFF] shadow-sm">
            <Brain className="w-8 h-8 animate-pulse text-[#7C5CFF]" />
          </div>
          
          <div className="space-y-2 max-w-[280px]">
            <h4 className="text-sm font-black text-slate-800">
              We'll start generating personalized wellness insights once you begin using MindCare AI.
            </h4>
            <p className="text-[10px] text-gray-550 font-semibold leading-relaxed">
              Log your mood, write journals, track water intake, meditation, sleep and habits to unlock AI-powered recommendations.
            </p>
          </div>
        </div>

        {/* Pinned Action Button */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={onOpenMood}
            className="w-full py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 text-center"
          >
            Start Your First Mood Log
          </button>
          <button
            onClick={onOpenJournal}
            className="w-full py-2.5 rounded-xl border border-[#E9E2FF] hover:bg-[#FAF9FF]/40 text-[#7C5CFF] font-extrabold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 text-center"
          >
            Write First Journal
          </button>
        </div>
      </div>
    );
  }

  const recommendations = Array.isArray(aiWellness.personalizedRecommendations)
    ? aiWellness.personalizedRecommendations
    : [
        'Practice deep box breathing for 5 minutes during work breaks.',
        'Wind down 30 minutes before bed with digital screen limits.',
        'Keep hydration consistent by keeping a water bottle at your desk.'
      ];

  return (
    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.02)] text-left flex flex-col h-full min-h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#FAF9FF] mb-4">
        <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#7C5CFF] fill-[#7C5CFF]/10" /> AI Insights Brain
        </h3>
        
        {/* Tab Buttons */}
        <div className="flex gap-1.5 bg-[#FAF9FF] p-0.5 rounded-lg border border-[#E9E2FF]/30">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'insights'
                ? 'bg-white text-[#7C5CFF] shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'metrics'
                ? 'bg-white text-[#7C5CFF] shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Metrics
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-0.5 scrollbar-thin max-h-[420px]">
        {/* Overall Wellness Summary & Status */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-extrabold text-[#7C5CFF] uppercase tracking-wider">Overall Wellness Summary</span>
          {(() => {
            const summary = aiWellness.overallWellnessSummary;
            if (!summary) return <p className="text-[11px] text-gray-400 italic">No summary available.</p>;

            // Try splitting by newline first
            let lines = summary.split('\n').map(l => l.replace(/^[\s•\-\*]+/, '').trim()).filter(Boolean);
            
            // If it's a single paragraph with no bullets, split by sentence boundary to convert to bullet points
            if (lines.length === 1 && !summary.includes('•') && !summary.includes('-') && !summary.includes('*')) {
              const sentenceRegex = /[^.!?]+[.!?]+(\s|$)/g;
              const matches = summary.match(sentenceRegex);
              if (matches && matches.length > 1) {
                lines = matches.map(s => s.trim());
              }
            }

            return (
              <ul className="text-[11px] text-gray-750 leading-relaxed font-semibold list-none pl-0 space-y-1 text-left">
                {lines.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#7C5CFF] mt-1 text-[12px] font-bold select-none">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>

        {activeTab === 'insights' ? (
          <div className="space-y-4">
            {/* Top Positive Habit & Area for Improvement */}
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5 font-bold" />
                  <span className="text-[8px] font-extrabold uppercase tracking-wider">Top Habit</span>
                </div>
                <p className="text-[9.5px] text-emerald-800 font-semibold leading-snug">
                  {aiWellness.topPositiveHabit}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5 font-bold" />
                  <span className="text-[8px] font-extrabold uppercase tracking-wider">Growth Focus</span>
                </div>
                <p className="text-[9.5px] text-amber-800 font-semibold leading-snug">
                  {aiWellness.biggestAreaForImprovement}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Clickable Metric Categories List */}
            <div className="space-y-2.5">
              {[
                { id: 'sleep', name: 'Sleep Analysis', icon: Moon, color: 'indigo', text: aiWellness.sleepAnalysis },
                { id: 'mood', name: 'Mood Trend', icon: Heart, color: 'rose', text: aiWellness.moodTrend },
                { id: 'hydration', name: 'Hydration Status', icon: Droplet, color: 'sky', text: aiWellness.hydrationAnalysis },
                { id: 'journal', name: 'Journaling Insights', icon: PenTool, color: 'amber', text: aiWellness.journalAnalysis },
                { id: 'exercise', name: 'Exercise Activity', icon: Dumbbell, color: 'purple', text: aiWellness.exerciseAnalysis },
                { id: 'meditation', name: 'Meditation Practice', icon: Compass, color: 'emerald', text: aiWellness.meditationAnalysis },
                { id: 'habits', name: 'Habit Streaks', icon: Calendar, color: 'slate', text: aiWellness.habitConsistency },
              ].map((m) => {
                const Icon = m.icon;
                const isActive = selectedMetric === m.id;
                
                // Class & Animation styles for color groups
                const styles = {
                  indigo: {
                    active: 'bg-indigo-50/70 border-indigo-350 text-indigo-750 ring-2 ring-indigo-500/10',
                    badge: 'bg-indigo-100 text-indigo-650',
                    iconAnim: 'group-hover:animate-pulse',
                    textColor: 'text-indigo-600'
                  },
                  rose: {
                    active: 'bg-rose-50/70 border-rose-350 text-rose-750 ring-2 ring-rose-500/10',
                    badge: 'bg-rose-100 text-rose-650',
                    iconAnim: 'group-hover:animate-bounce',
                    textColor: 'text-rose-600'
                  },
                  sky: {
                    active: 'bg-sky-50/70 border-sky-350 text-sky-750 ring-2 ring-sky-500/10',
                    badge: 'bg-sky-100 text-sky-650',
                    iconAnim: 'group-hover:animate-bounce',
                    textColor: 'text-sky-600'
                  },
                  amber: {
                    active: 'bg-amber-50/70 border-amber-350 text-amber-750 ring-2 ring-amber-500/10',
                    badge: 'bg-amber-100 text-amber-650',
                    iconAnim: 'group-hover:-rotate-12 transition-transform duration-200',
                    textColor: 'text-amber-600'
                  },
                  purple: {
                    active: 'bg-purple-50/70 border-purple-350 text-purple-750 ring-2 ring-purple-500/10',
                    badge: 'bg-purple-100 text-purple-650',
                    iconAnim: 'group-hover:rotate-45 transition-transform duration-200',
                    textColor: 'text-purple-600'
                  },
                  emerald: {
                    active: 'bg-emerald-50/70 border-emerald-350 text-emerald-750 ring-2 ring-emerald-500/10',
                    badge: 'bg-emerald-100 text-emerald-650',
                    iconAnim: 'group-hover:animate-spin-slow',
                    textColor: 'text-emerald-600'
                  },
                  slate: {
                    active: 'bg-slate-50 border-slate-300 text-slate-750 ring-2 ring-slate-500/10',
                    badge: 'bg-slate-100 text-slate-650',
                    iconAnim: 'group-hover:scale-110 transition-transform duration-200',
                    textColor: 'text-slate-600'
                  }
                };

                const currentStyle = styles[m.color];

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMetric(m.id)}
                    className={`group w-full flex items-start gap-3 p-3 rounded-2xl border text-left cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-[#FAF9FF] focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/20 ${
                      isActive 
                        ? currentStyle.active 
                        : 'bg-white border-[#E9E2FF]/40 text-[#1C1C3A]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isActive ? currentStyle.badge : `bg-${m.color}-50 text-${m.color}-600`
                    } ${m.color === 'indigo' && !isActive ? 'bg-indigo-50 text-indigo-600' : ''}
                      ${m.color === 'rose' && !isActive ? 'bg-rose-50 text-rose-600' : ''}
                      ${m.color === 'sky' && !isActive ? 'bg-sky-50 text-sky-600' : ''}
                      ${m.color === 'amber' && !isActive ? 'bg-amber-50 text-amber-600' : ''}
                      ${m.color === 'purple' && !isActive ? 'bg-purple-50 text-purple-600' : ''}
                      ${m.color === 'emerald' && !isActive ? 'bg-emerald-50 text-emerald-600' : ''}
                      ${m.color === 'slate' && !isActive ? 'bg-slate-50 text-slate-600' : ''}
                    `}>
                      <Icon className={`w-3.5 h-3.5 ${currentStyle.iconAnim}`} />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider block ${
                        isActive ? '' : currentStyle.textColor
                      }`}>{m.name}</span>
                      <p className="text-[9.5px] text-gray-550 font-semibold leading-relaxed truncate">{m.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detailed Analytics Panel Section */}
            <div className="border-t border-[#FAF9FF] pt-4 mt-2">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Brain className="w-3.5 h-3.5 text-[#7C5CFF]" />
                <span className="text-[10px] font-extrabold text-[#1C1C3A] uppercase tracking-wider">
                  Telemetry Analytics
                </span>
              </div>

              {metricLoading && <MetricSkeleton />}
              
              {metricError && (
                <MetricErrorState onRetry={() => fetchMetricData(selectedMetric)} />
              )}

              {!metricLoading && !metricError && (
                <>
                  {selectedMetric === 'sleep' && (
                    <SleepPanel data={metricData} />
                  )}
                  {selectedMetric === 'mood' && (
                    <MoodPanel data={metricData} />
                  )}
                  {selectedMetric === 'hydration' && (
                    <HydrationPanel data={metricData} />
                  )}
                  {selectedMetric === 'journal' && (
                    <JournalPanel data={metricData} />
                  )}
                  {selectedMetric === 'exercise' && (
                    <ExercisePanel data={metricData} />
                  )}
                  {selectedMetric === 'meditation' && (
                    <MeditationPanel data={metricData} />
                  )}
                  {selectedMetric === 'habits' && (
                    <HabitsPanel data={metricData} />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explore Analytics Button */}
      <button
        onClick={() => navigate('/analytics')}
        className="w-full mt-4 py-2.5 rounded-xl border border-[#E9E2FF] hover:border-[#7C5CFF]/20 hover:bg-[#FAF9FF]/40 text-[#7C5CFF] hover:text-[#6D4AE5] font-extrabold text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5"
      >
        <Compass className="w-3.5 h-3.5" /> Explore Analytics Trends
      </button>
    </div>
  );
}
