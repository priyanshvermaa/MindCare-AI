import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { useTheme } from '../context/ThemeContext';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Plus, Trash2, Award, Flame, Sparkles, Check,
  BookOpen, Activity, Moon, Target, Compass, Droplet, TrendingUp, MoreHorizontal, Sun,
  Calendar, Smile, Trophy, X
} from 'lucide-react';

const CATEGORIES = ['Mindfulness', 'Physical', 'Work', 'Nutrition', 'Social'];
const PRIORITIES = ['low', 'medium', 'high'];

const BADGE_ICONS = {
  Heart: Heart,
  BookOpen: BookOpen,
  Droplet: Droplet,
  Flame: Flame,
  Moon: Moon,
  Compass: Compass,
  Sparkles: Sparkles,
  Target: Target,
  Plus: Plus,
  Award: Award
};

const getHabitIcon = (category) => {
  const cat = category.toLowerCase();
  if (cat.includes('hydration') || cat.includes('water')) return { Icon: Droplet, color: 'text-sky-500 bg-sky-50' };
  if (cat.includes('meditation') || cat.includes('mindful')) return { Icon: Compass, color: 'text-[#7C5CFF] bg-[#7C5CFF]/10' };
  if (cat.includes('sleep') || cat.includes('rest')) return { Icon: Moon, color: 'text-indigo-500 bg-indigo-50' };
  if (cat.includes('exercise') || cat.includes('workout') || cat.includes('run')) return { Icon: Activity, color: 'text-emerald-500 bg-emerald-50' };
  if (cat.includes('journal') || cat.includes('reflect')) return { Icon: BookOpen, color: 'text-amber-500 bg-amber-50' };
  return { Icon: Target, color: 'text-purple-500 bg-purple-50' };
};

export default function Wellness() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLightMode } = useTheme();

  // Data States
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [badges, setBadges] = useState([]);
  const [flippedBadges, setFlippedBadges] = useState([]);
  const [gamification, setGamification] = useState({
    xp: 0,
    level: 1,
    badges: [],
    achievements: [],
    completionRate: 0
  });

  // UI / Modal States
  const [loading, setLoading] = useState(true);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [submittingHabit, setSubmittingHabit] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [xpUpdateAlert, setXpUpdateAlert] = useState(null);

  // New Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalCat, setGoalCat] = useState('Mindfulness');
  const [goalPriority, setGoalPriority] = useState('medium');
  const [goalDate, setGoalDate] = useState('');

  // New Habit Form
  const [habitName, setHabitName] = useState('');
  const [habitCat, setHabitCat] = useState('General');
  const [habitTarget, setHabitTarget] = useState(1);

  // active menu for habit delete dropdowns
  const [activeHabitMenuId, setActiveHabitMenuId] = useState(null);
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Fetch Data
  const fetchWellnessData = async () => {
    try {
      const [goalsRes, habitsRes, streakRes, badgesRes] = await Promise.all([
        api.get('/goals'),
        api.get('/habits'),
        api.get('/habits/streak'),
        api.get('/badges')
      ]);

      setGoals(goalsRes.data.goals || []);
      setHabits(habitsRes.data.habits || []);
      setGamification(streakRes.data.analytics);
      setBadges(badgesRes.data.badges || []);
    } catch (err) {
      console.error('Failed to load wellness data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWellnessData();
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash === '#achievement-badges') {
      const element = document.getElementById('achievement-badges');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }
  }, [loading]);

  const triggerXpAlert = (amount) => {
    setXpUpdateAlert(amount > 0 ? `+${amount} XP` : `${amount} XP`);
    setTimeout(() => setXpUpdateAlert(null), 3000);
  };

  // ── Goals Actions ────────────────────────────────────────────
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle || !goalDate) return;
    setSubmittingGoal(true);
    try {
      await api.post('/goals', {
        title: goalTitle,
        description: goalDesc,
        category: goalCat,
        priority: goalPriority,
        targetDate: goalDate
      });
      triggerXpAlert(50);
      setGoalTitle('');
      setGoalDesc('');
      setShowGoalModal(false);
      await fetchWellnessData();
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleToggleGoal = async (id, currentStatus) => {
    try {
      const response = await api.put(`/goals/${id}`, {
        completed: !currentStatus
      });
      if (response.data.xpAwarded > 0) {
        triggerXpAlert(response.data.xpAwarded);
      }
      await fetchWellnessData();
    } catch (err) {
      console.error('Failed to toggle goal:', err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      await fetchWellnessData();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  // ── Habits Actions ───────────────────────────────────────────
  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!habitName) return;
    setSubmittingHabit(true);
    try {
      await api.post('/habits', {
        habitName,
        category: habitCat,
        target: habitTarget
      });
      setHabitName('');
      setShowHabitModal(false);
      await fetchWellnessData();
    } catch (err) {
      console.error('Failed to create habit:', err);
    } finally {
      setSubmittingHabit(false);
    }
  };

  const handleToggleHabit = async (id) => {
    try {
      const response = await api.put(`/habits/${id}`);
      triggerXpAlert(response.data.xpAwarded);
      await fetchWellnessData();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (!confirm('Delete this habit?')) return;
    try {
      await api.delete(`/habits/${id}`);
      await fetchWellnessData();
      setActiveHabitMenuId(null);
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const wellnessScore = habits.length === 0 && goals.length === 0
    ? 0
    : Math.min(
        100,
        Math.round(
          ((habits.filter(h => h.completed).length / Math.max(1, habits.length)) * 70) +
          ((goals.filter(g => g.completed).length / Math.max(1, goals.length)) * 30)
        )
      );

  const getWeeklyHabitsActivity = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const completedCount = habits.filter(h => h.completedDates && h.completedDates.includes(dateStr)).length;
      days.push({ dayName, count: completedCount });
    }
    return days;
  };

  const activity = getWeeklyHabitsActivity();
  const hasActivityData = activity.some(d => d.count > 0);
  
  let pathD = '';
  if (hasActivityData) {
    const maxCount = Math.max(1, ...activity.map(d => d.count));
    const points = activity.map((d, index) => {
      const x = 10 + (index * 13.3);
      const y = 30 - ((d.count / maxCount) * 22);
      return `${x},${y}`;
    });
    pathD = `M ${points.join(' L ')}`;
  }

  const highlightText = (text, highlight) => {
    if (!highlight) return text;
    const parts = text.split(highlight);
    if (parts.length > 1) {
      return (
        <>
          {parts[0]}
          <span className="text-[#E11D48] font-black">{highlight}</span>
          {parts[1]}
        </>
      );
    }
    return text;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B4B] flex font-poppins select-none relative">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation header bar */}
        <TopNav
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Centered platform workspace with equal margins */}
        <main className="flex-1 px-10 py-8 pb-10 max-w-[1440px] mx-auto w-full space-y-6 text-left relative z-10">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pb-4">
            
            {/* Floating XP Alert popup */}
            <AnimatePresence>
              {xpUpdateAlert && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -20, scale: 1.1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-10 top-0 bg-[#7C5CFF] text-white px-4 py-2 rounded-[14px] font-extrabold text-[14px] shadow-[0_8px_30px_rgba(124,92,255,0.08)] flex items-center gap-1.5 z-50"
                >
                  <Sparkles className="w-4 h-4" /> {xpUpdateAlert}
                </motion.div>
              )}
            </AnimatePresence>
 
            <div>
              <h1 className="text-[28px] font-black text-[#1E1B4B] tracking-tight flex items-center gap-2">
                <Heart className="w-7 h-7 text-rose-500 fill-rose-500/10" /> Wellness & Habits
              </h1>
              <p className="text-[16px] text-[#6B7280] mt-1 font-semibold leading-relaxed">
                Track healthy routines, build resilience, and improve your mental wellbeing every day.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-12 gap-6">
              <Skeleton className="lg:col-span-9 h-[350px] rounded-[24px] bg-white border border-[#ECE7FF]" />
              <Skeleton className="lg:col-span-3 h-[350px] rounded-[24px] bg-white border border-[#ECE7FF]" />
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Statistics Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                  
                  {/* Card 1: Wellness Score */}
                  <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.015)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[125px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                        <Heart className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Wellness Score</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <span className="text-2.5xl font-black text-gray-900 leading-none block">{wellnessScore}%</span>
                      <span className="text-[9px] text-[#6B7280] font-extrabold block">Overall Routine Status</span>
                    </div>
                  </div>

                  {/* Card 2: Current Streak */}
                  <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.015)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[125px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <Flame className="w-4.5 h-4.5 fill-orange-500" />
                      </div>
                      <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Current Streak</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <span className="text-2.5xl font-black text-gray-900 leading-none block flex items-center gap-1">
                        {gamification.currentStreak ?? 0} Days <span className="text-xs text-emerald-500">🔥</span>
                      </span>
                      <span className="text-[9px] text-emerald-550 font-extrabold block">Keep it going!</span>
                    </div>
                  </div>

                  {/* Card 3: Longest Streak */}
                  <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.015)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[125px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                        <Award className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Longest Streak</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <span className="text-2.5xl font-black text-gray-900 leading-none block">{gamification.longestStreak ?? 0} Days</span>
                      <span className="text-[9px] text-gray-400 font-extrabold block">All-time Record</span>
                    </div>
                  </div>

                  {/* Card 4: Wellness Index */}
                  <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.015)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[125px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-xl bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] shrink-0">
                        <Trophy className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Wellness Index</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <span className="text-2.5xl font-black text-gray-900 leading-none block">{habits.length > 0 || goals.length > 0 ? wellnessScore : 0}%</span>
                      <div className="flex gap-2 text-[9px] text-gray-450 font-extrabold">
                        <span>Phy: {habits.length > 0 ? Math.min(100, Math.round(gamification.completionRate)) : 0}%</span>
                        <span>•</span>
                        <span>Men: {gamification.level > 1 || gamification.xp > 0 ? Math.min(100, Math.round(gamification.level * 10)) : 0}%</span>
                      </div>
                    </div>
                  </div>
              </div>

                {/* Columns Split - Left Column (Habits) & Right Column (Goals) aligned 50-50 stretch */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
                  
                  {/* Daily Habits Checklist (Left Column) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[24px] border border-[#ECE7FF] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] flex flex-col justify-between min-h-[480px]"
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center select-none border-b border-gray-50 pb-3">
                        <h3 className="text-[20px] font-extrabold text-[#1E1B4B] flex items-center gap-2">
                          <Check className="w-5.5 h-5.5 text-[#7C5CFF]" /> Daily Habits Checklist
                        </h3>
                        <button
                          onClick={fetchWellnessData}
                          className="text-[14px] text-[#7C5CFF] hover:underline font-extrabold uppercase tracking-wider animate-pulse"
                        >
                          Today's Logs
                        </button>
                      </div>

                      {habits.length > 0 ? (
                        <div className="divide-y divide-gray-50 flex-1 overflow-y-auto pr-1 my-3 space-y-1">
                          {habits.map((habit) => {
                            const habitMeta = getHabitIcon(habit.habitName);
                            const HabitIcon = habitMeta.Icon;
                            return (
                              <div
                                key={habit._id}
                                className={`py-4 flex justify-between items-center transition-all hover:bg-slate-50/40 px-2 rounded-2xl group ${
                                  habit.completed ? 'opacity-85' : ''
                                }`}
                              >
                                <div className="flex items-center gap-4 text-left overflow-hidden flex-1">
                                  <button
                                    onClick={() => handleToggleHabit(habit._id)}
                                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                      habit.completed
                                        ? 'bg-[#7C5CFF] border-transparent text-white shadow-md shadow-[#7C5CFF]/20'
                                        : 'border-[#ECE7FF] bg-[#FAFAFC] hover:border-[#7C5CFF]'
                                    }`}
                                  >
                                    {habit.completed && <Check className="w-4 h-4 stroke-[3]" />}
                                  </button>

                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${habitMeta.color}`}>
                                    <HabitIcon className="w-5 h-5" />
                                  </div>

                                  <div className="overflow-hidden flex-1">
                                    <span className={`text-sm font-bold block truncate ${habit.completed ? 'text-gray-400 line-through font-semibold' : 'text-gray-900'}`}>
                                      {habit.habitName}
                                    </span>
                                    <span className="text-[10px] text-[#6B7280] font-semibold block truncate uppercase mt-0.5">
                                      {habit.category || 'General'}
                                    </span>
                                  </div>

                                  {/* Progress bar and text */}
                                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-24">
                                    <div className="w-full bg-[#FAFAFC] h-1.5 rounded-full overflow-hidden border border-[#ECE7FF]">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                          habit.completed ? 'bg-emerald-500' : 'bg-[#7C5CFF]'
                                        }`}
                                        style={{ width: habit.completed ? '100%' : '50%' }}
                                      />
                                    </div>
                                    <span className="text-[9px] text-gray-400 font-extrabold uppercase">
                                      {habit.completed ? `${habit.target || 1} / ${habit.target || 1}` : `0 / ${habit.target || 1}`} entry
                                    </span>
                                  </div>

                                  {/* Streak */}
                                  <div className="flex items-center gap-1 shrink-0 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                    <span className="text-[9px] text-orange-600 font-black tracking-wider uppercase">{habit.streak}d streak</span>
                                  </div>
                                </div>

                                <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => setActiveHabitMenuId(activeHabitMenuId === habit._id ? null : habit._id)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                                  >
                                    <MoreHorizontal className="w-4.5 h-4.5" />
                                  </button>
                                  
                                  {activeHabitMenuId === habit._id && (
                                    <div className="absolute right-0 mt-1 w-28 bg-white border border-[#ECE7FF] rounded-xl shadow-lg z-20 p-1 text-left">
                                      <button
                                        onClick={() => handleDeleteHabit(habit._id)}
                                        className="w-full px-3 py-2 text-[10px] font-extrabold uppercase text-rose-500 hover:bg-[#FAF8FF] rounded-lg transition-colors flex items-center gap-1.5"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-[#ECE7FF] rounded-[24px] text-center text-gray-400 text-[16px] space-y-4 my-2">
                          <BookOpen className="w-10 h-10 text-[#7C5CFF]/60 mb-1" />
                          <p className="font-semibold text-gray-500 max-w-sm leading-relaxed pl-1">
                            No habits logged yet. Click "Add Habit" to track sleep, water, hydration, screen time, or custom habits.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center pt-4 border-t border-gray-50">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03, boxShadow: "0 4px 15px rgba(124,92,255,0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowHabitModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#7C5CFC] hover:bg-[#7C5CFC]/5 text-[#7C5CFC] font-extrabold text-xs uppercase tracking-wider transition-all min-w-[200px]"
                      >
                        ➕ Add New Habit
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Active Goals Board (Right Column) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[24px] border border-[#ECE7FF] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] flex flex-col justify-between min-h-[480px]"
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center select-none border-b border-gray-50 pb-3">
                        <h3 className="text-[20px] font-extrabold text-[#1E1B4B] flex items-center gap-2">
                          <Target className="w-5.5 h-5.5 text-[#7C5CFF]" /> Active Goals
                        </h3>
                        <button
                          onClick={() => setShowGoalModal(true)}
                          className="text-[14px] text-[#7C5CFF] hover:underline font-extrabold uppercase tracking-wider"
                        >
                          View All Goals
                        </button>
                      </div>

                      {goals.length > 0 ? (
                        <div className="divide-y divide-gray-50 flex-1 overflow-y-auto pr-1 my-3 space-y-1">
                          {goals.map((goal) => {
                            const goalMeta = getHabitIcon(goal.category || 'General');
                            const GoalIcon = goalMeta.Icon;
                            return (
                              <div
                                key={goal._id}
                                className={`py-4 flex justify-between items-center transition-all hover:bg-slate-50/40 px-2 rounded-2xl group ${
                                  goal.completed ? 'opacity-80' : ''
                                }`}
                              >
                                <div className="flex items-center gap-4 text-left overflow-hidden flex-1">
                                  <button
                                    onClick={() => handleToggleGoal(goal._id, goal.completed)}
                                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                      goal.completed
                                        ? 'bg-[#7C5CFF] border-transparent text-white shadow-md shadow-[#7C5CFF]/20'
                                        : 'border-[#ECE7FF] bg-[#FAFAFC] hover:border-[#7C5CFF]'
                                    }`}
                                  >
                                    {goal.completed && <Check className="w-4 h-4 stroke-[3]" />}
                                  </button>

                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${goalMeta.color}`}>
                                    <GoalIcon className="w-5 h-5" />
                                  </div>

                                  <div className="overflow-hidden flex-1">
                                    <span className={`text-sm font-bold block truncate ${goal.completed ? 'text-gray-400 line-through font-semibold' : 'text-gray-900'}`}>
                                      {goal.title}
                                    </span>
                                    <span className="text-[10px] text-[#6B7280] font-semibold block truncate uppercase mt-0.5">
                                      Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>

                                  {/* Progress bar & percentage */}
                                  <div className="flex flex-col items-end gap-1 shrink-0 w-24 pr-2">
                                    <div className="w-full bg-[#FAFAFC] h-1.5 rounded-full overflow-hidden border border-[#ECE7FF]">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                          goal.completed ? 'bg-emerald-500' : 'bg-[#7C5CFF]'
                                        }`}
                                        style={{ width: goal.completed ? '100%' : '0%' }}
                                      />
                                    </div>
                                    <span className="text-[9px] text-gray-400 font-extrabold uppercase">
                                      {goal.completed ? '100%' : '0%'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => handleDeleteGoal(goal._id)}
                                    className="p-1.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                                    title="Delete Goal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-[#ECE7FF] rounded-[24px] text-center text-gray-450 text-[16px] space-y-4 my-2">
                          <Target className="w-10 h-10 text-[#7C5CFF]/60" />
                          <p className="font-semibold text-gray-500 max-w-sm leading-relaxed">No goals set yet. Click "Create Goal" to track milestones.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center pt-4 border-t border-gray-50">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03, boxShadow: "0 4px 15px rgba(124,92,255,0.15)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowGoalModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#7C5CFC] hover:bg-[#7C5CFC]/5 text-[#7C5CFC] font-extrabold text-xs uppercase tracking-wider transition-all min-w-[200px]"
                      >
                        ➕ Add New Goal
                      </motion.button>
                    </div>
                  </motion.div>
                </div>

                {/* Achievement Badges Section */}
                <div id="achievement-badges" className="pt-8 pb-12 w-full space-y-8">
                  {/* Spacing: 32px top, 12px between title/subtitle, 32px bottom spacing before badges grid */}
                  <div className="space-y-3 text-left">
                    <h2 className="text-[24px] font-black text-[#1E1B4B] tracking-tight flex items-center gap-2">
                      🏅 Achievement Badges
                    </h2>
                    <p className="text-[14px] text-[#6B7280] font-semibold leading-relaxed">
                      Celebrate your progress and unlock badges for your consistency and growth.
                    </p>
                  </div>

                  {/* 3D Flip Card Custom Styles */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes badgePulse {
                      0%, 100% { transform: scale(1); }
                      50% { transform: scale(1.03); }
                    }
                    @keyframes greenGlow {
                      0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.15), 0 8px 30px rgba(0,0,0,0.015); }
                      50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.35), 0 8px 30px rgba(0,0,0,0.02); }
                    }
                    @keyframes sparkleAnim {
                      0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
                      50% { opacity: 0.9; transform: scale(1.2) rotate(45deg); }
                    }
                    .animate-badge-pulse {
                      animation: badgePulse 2.5s infinite ease-in-out;
                    }
                    .animate-green-glow {
                      animation: greenGlow 2.5s infinite ease-in-out;
                    }
                    .animate-sparkle {
                      animation: sparkleAnim 3.5s infinite ease-in-out;
                    }
                    .perspective-1000 {
                      perspective: 1000px;
                    }
                    .card-container {
                      width: 170px;
                      height: 210px;
                      margin: 0 auto;
                    }
                    .card-inner {
                      width: 100%;
                      height: 100%;
                      transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
                      transform-style: preserve-3d;
                      position: relative;
                    }
                    .card-flipped {
                      transform: rotateY(180deg);
                    }
                    .card-front, .card-back {
                      backface-visibility: hidden;
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      border-radius: 24px;
                    }
                    .card-back {
                      transform: rotateY(180deg);
                    }
                  `}} />

                  {/* Empty state for zero unlocked badges */}
                  {badges.length > 0 && badges.filter(b => b.isUnlocked).length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 bg-white border border-[#EAEAEA] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] text-center space-y-2.5 w-full my-4">
                      <span className="text-4xl animate-bounce">🏆</span>
                      <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider">Start tracking habits to unlock your first badge.</p>
                    </div>
                  )}

                  {/* Grid layout */}
                  <div className="grid gap-6 w-full animate-fadeIn" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                    {badges.map((badge) => {
                      const BadgeIcon = BADGE_ICONS[badge.icon] || Award;
                      const isFlipped = flippedBadges.includes(badge.id);

                      return (
                        <div
                          key={badge.id}
                          className="perspective-1000 card-container"
                          onMouseLeave={() => {
                            setFlippedBadges(prev => prev.filter(x => x !== badge.id));
                          }}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setFlippedBadges(prev => 
                                prev.includes(badge.id)
                                  ? prev.filter(x => x !== badge.id)
                                  : [...prev, badge.id]
                              );
                            }}
                            className={`card-inner cursor-pointer hover:shadow-[0_15px_35px_rgba(124,92,255,0.15)] hover:-translate-y-1.5 hover:scale-[1.03] transition-all duration-350 rounded-[24px] border border-[#EAEAEA] hover:border-[#7C5CFF] ${
                              isFlipped ? 'card-flipped' : ''
                            } ${badge.isUnlocked ? 'animate-green-glow' : ''}`}
                          >
                            {/* FRONT SIDE */}
                            <div className={`card-front flex flex-col items-center justify-center text-center p-4 bg-white border border-[#EAEAEA] transition-all duration-300 relative ${
                              badge.isUnlocked
                                ? 'shadow-[0_8px_30px_rgba(124,92,255,0.06)]'
                                : 'opacity-70 grayscale'
                            }`}>
                              
                              {/* Sparkles (Unlocked Only - subtle purple) */}
                              {badge.isUnlocked && (
                                <>
                                  <span className="absolute top-3 left-4 text-[#7C5CFF]/30 text-xs font-black select-none animate-sparkle">✦</span>
                                  <span className="absolute top-4 right-4 text-[#7C5CFF]/30 text-[8px] font-black select-none animate-sparkle">✦</span>
                                  <span className="absolute bottom-12 left-5 text-[#7C5CFF]/30 text-[9px] font-black select-none animate-sparkle">✦</span>
                                  <span className="absolute bottom-16 right-5 text-[#7C5CFF]/30 text-xs font-black select-none animate-sparkle">✦</span>
                                </>
                              )}

                              {/* Lock Icon in top-right for locked cards */}
                              {!badge.isUnlocked && (
                                <span className="absolute top-3.5 right-3.5 text-slate-350 text-xs select-none">🔒</span>
                              )}

                              {/* Large Icon Container */}
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm mb-3.5 shrink-0 transition-transform duration-300 ${
                                badge.isUnlocked
                                  ? 'bg-[#7C5CFF]/10 text-[#7C5CFF] scale-105 animate-badge-pulse'
                                  : 'bg-slate-50 border border-slate-100 text-slate-350'
                              }`}>
                                <BadgeIcon className="w-7 h-7" />
                              </div>

                              <span className={`text-[12px] font-black block truncate w-full text-center tracking-wide ${
                                badge.isUnlocked ? 'text-[#1E1B4B]' : 'text-slate-400'
                              }`}>
                                {badge.name}
                              </span>

                              {/* Status Badge */}
                              {badge.isUnlocked ? (
                                <span className="text-[9px] font-extrabold block mt-2 tracking-widest uppercase text-emerald-500">
                                  Unlocked
                                </span>
                              ) : (
                                <span className="text-[9px] font-extrabold mt-2 tracking-widest uppercase text-slate-400 flex items-center gap-1">
                                  Locked
                                </span>
                              )}
                            </div>

                            {/* BACK SIDE */}
                            <div className="card-back bg-white border border-[#EAEAEA] shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-4 flex flex-col justify-between text-center overflow-hidden">
                              <div className="space-y-2 w-full">
                                {/* How to unlock label pill */}
                                <div className="bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#ECE7FF]/65 rounded-full px-3.5 py-0.5 flex items-center justify-center gap-1 text-[8.5px] font-black uppercase tracking-wider mx-auto w-max select-none">
                                  <span>☆</span> How to unlock
                                </div>

                                {/* Headline criteria */}
                                <div className="text-[11px] font-black text-[#1E1B4B] w-full text-center leading-normal py-1">
                                  {badge.headline}
                                </div>

                                {/* Divider line */}
                                <div className="w-full border-t border-[#EAEAEA] my-1" />

                                {/* Progress info */}
                                <div className="text-[10px] font-semibold text-slate-500">
                                  Progress: <span className="font-black text-[#1E1B4B]">{badge.current} / {badge.target}</span>
                                </div>

                                {/* Reward info */}
                                <div className="text-[10px] font-semibold text-slate-500">
                                  Reward: <span className="font-black text-[#7C5CFF]">{badge.reward}</span>
                                </div>
                              </div>

                              {/* Unlock Button */}
                              <button
                                type="button"
                                disabled={!badge.isUnlocked}
                                className={`w-full py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all mt-1 ${
                                  badge.isUnlocked
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02]'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                                }`}
                              >
                                {badge.isUnlocked ? 'Unlocked' : 'Locked'}
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center items-center gap-1.5 text-[11px] text-[#7C5CFF] font-semibold pt-2">
                    <span className="animate-pulse">👆</span> Click on any badge to flip it!
                  </div>
                </div>

              </div>
            )}

          {/* Create Goal Modal */}
          {showGoalModal && (
            <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md p-6 bg-white border border-[#ECE7FF] rounded-[24px] relative shadow-2xl z-10 space-y-4">
                <h3 className="text-[20px] font-extrabold text-[#1E1B4B] mb-2 text-left">Create Daily Goal</h3>
                <form onSubmit={handleCreateGoal} className="space-y-4 text-left">
                  <div>
                    <label className="text-[14px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Goal Title</label>
                    <input
                      type="text"
                      required
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="e.g., Morning box breathing session"
                      className="bg-[#FAFAFC] border border-[#ECE7FF] rounded-[14px] px-4 py-3 text-[16px] text-gray-900 w-full focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[14px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Description (Optional)</label>
                    <textarea
                      value={goalDesc}
                      onChange={(e) => setGoalDesc(e.target.value)}
                      placeholder="Enter details..."
                      rows="2"
                      className="bg-[#FAFAFC] border border-[#ECE7FF] rounded-[14px] px-4 py-3 text-[16px] text-gray-900 w-full focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[14px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Category</label>
                      <select
                        value={goalCat}
                        onChange={(e) => setGoalCat(e.target.value)}
                        className="bg-[#FAFAFC] border border-[#ECE7FF] rounded-[14px] px-3 py-3 text-[16px] text-gray-900 w-full focus:outline-none cursor-pointer font-semibold"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[14px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Priority</label>
                      <select
                        value={goalPriority}
                        onChange={(e) => setGoalPriority(e.target.value)}
                        className="bg-[#FAFAFC] border border-[#ECE7FF] rounded-[14px] px-3 py-3 text-[16px] text-gray-900 w-full focus:outline-none cursor-pointer font-semibold"
                      >
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[14px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Target Date</label>
                    <input
                      type="date"
                      required
                      value={goalDate}
                      onChange={(e) => setGoalDate(e.target.value)}
                      className="bg-[#FAFAFC] border border-[#ECE7FF] rounded-[14px] px-4 py-3 text-[16px] text-gray-900 w-full focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGoalModal(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-500 bg-white font-bold text-xs rounded-[14px] hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingGoal}
                      className="px-5 py-2.5 bg-[#7C5CFF] text-white font-bold text-xs rounded-[14px] hover:bg-[#6D4AE5] transition-colors shadow-sm disabled:opacity-50"
                    >
                      Create Goal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Habit Modal */}
          {showHabitModal && (
            <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md p-6 bg-white border border-[#ECE7FF] rounded-[24px] relative shadow-2xl z-10 space-y-4">
                <h3 className="text-[20px] font-extrabold text-[#1E1B4B] mb-2 text-left">Add New Habit</h3>
                <form onSubmit={handleCreateHabit} className="space-y-4 text-left">
                  <div>
                    <label className="text-[14px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Habit Name</label>
                    <input
                      type="text"
                      required
                      value={habitName}
                      onChange={(e) => setHabitName(e.target.value)}
                      placeholder="e.g., Hydration target (2L)"
                      className="bg-[#FAFAFC] border border-[#ECE7FF] rounded-[14px] px-4 py-3 text-[16px] text-gray-900 w-full focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[14px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Category</label>
                      <select
                        value={habitCat}
                        onChange={(e) => setHabitCat(e.target.value)}
                        className="bg-[#FAFAFC] border border-[#ECE7FF] rounded-[14px] px-3 py-3 text-[16px] text-gray-900 w-full focus:outline-none cursor-pointer font-semibold"
                      >
                        <option value="Hydration">Hydration</option>
                        <option value="Sleep">Sleep</option>
                        <option value="Exercise">Exercise</option>
                        <option value="Meditation">Meditation</option>
                        <option value="Reading">Reading</option>
                        <option value="Walking">Walking</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[14px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Daily Target (Times)</label>
                      <input
                        type="number"
                        min="1"
                        value={habitTarget}
                        onChange={(e) => setHabitTarget(parseInt(e.target.value, 10))}
                        className="bg-[#FAFAFC] border border-[#ECE7FF] rounded-[14px] px-4 py-3 text-[16px] text-gray-900 w-full focus:outline-none font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowHabitModal(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-500 bg-white font-bold text-xs rounded-[14px] hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingHabit}
                      className="px-5 py-2.5 bg-[#7C5CFF] text-white font-bold text-xs rounded-[14px] hover:bg-[#6D4AE5] transition-colors shadow-sm disabled:opacity-50"
                    >
                      Create Habit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Badge Detail / Instruction Modal */}
          {selectedBadge && (
            <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-sm p-6 bg-white border border-[#ECE7FF] rounded-[24px] relative shadow-2xl z-10 text-center space-y-4">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-sm ${
                  selectedBadge.condition ? 'bg-purple-50 text-[#7C5CFF]' : 'bg-gray-100 text-gray-400'
                }`}>
                  <selectedBadge.icon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[20px] font-black text-[#1E1B4B]">{selectedBadge.title}</h3>
                  <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block ${
                    selectedBadge.condition ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {selectedBadge.condition ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed px-2">
                  {selectedBadge.description}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBadge(null)}
                    className="w-full py-2.5 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-extrabold text-xs uppercase tracking-wider rounded-[14px] shadow-sm transition-all"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
