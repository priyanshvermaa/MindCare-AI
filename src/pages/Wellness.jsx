import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { useTheme } from '../context/ThemeContext';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Plus, Trash2, Award, Flame, Sparkles, Check,
  BookOpen, Activity, Moon, Target, Compass, Droplet, TrendingUp, MoreHorizontal
} from 'lucide-react';

const CATEGORIES = ['Mindfulness', 'Physical', 'Work', 'Nutrition', 'Social'];
const PRIORITIES = ['low', 'medium', 'high'];

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

  // Fetch Data
  const fetchWellnessData = async () => {
    try {
      const [goalsRes, habitsRes, streakRes] = await Promise.all([
        api.get('/goals'),
        api.get('/habits'),
        api.get('/habits/streak')
      ]);

      setGoals(goalsRes.data.goals || []);
      setHabits(habitsRes.data.habits || []);
      setGamification(streakRes.data.analytics);
    } catch (err) {
      console.error('Failed to load wellness data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWellnessData();
  }, []);

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

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#1E1B4B] flex font-poppins select-none relative">
      
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

            <div className="flex gap-4 shrink-0 pb-1">
              <button
                onClick={() => setShowHabitModal(true)}
                className="flex items-center gap-1.5 px-4.5 py-3 rounded-[14px] border border-[#ECE7FF] bg-white hover:bg-gray-50 text-[#1E1B4B] font-extrabold text-[14px] shadow-[0_8px_30px_rgba(124,92,255,0.08)] transition-all"
              >
                <Plus className="w-4.5 h-4.5" /> Add Habit
              </button>
              <button
                onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-1.5 px-5 py-3 rounded-[14px] bg-gradient-to-r from-[#7C5CFF] to-[#A78BFA] text-white font-extrabold text-[14px] uppercase tracking-wider shadow-[0_8px_30px_rgba(124,92,255,0.08)] transition-all"
              >
                <Plus className="w-4.5 h-4.5" /> Create Goal
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-12 gap-6">
              <Skeleton className="lg:col-span-9 h-[350px] rounded-[24px] bg-white border border-[#ECE7FF]" />
              <Skeleton className="lg:col-span-3 h-[350px] rounded-[24px] bg-white border border-[#ECE7FF]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (70% = col-span-9 of 12-column grid) */}
              <div className="lg:col-span-9 space-y-6">
                
                {/* Statistics Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Wellness Score */}
                  <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] border border-[#ECE7FF] flex items-center justify-between min-h-[140px] hover:-translate-y-0.5 transition-all duration-300">
                    <div className="text-left flex flex-col justify-center h-full">
                      <span className="text-[14px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Wellness Score</span>
                      <span className="text-[28px] font-black text-[#1E1B4B] block leading-none">{wellnessScore}%</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xxs text-emerald-500 font-bold">▲ +12%</span>
                        <span className="text-[9px] text-[#6B7280] font-semibold">vs last week</span>
                      </div>
                    </div>
                    {/* Ring gauge */}
                    <div className="w-14 h-14 relative flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#F4F0FF" strokeWidth="2.5" />
                        <circle
                          cx="18" cy="18" r="15" fill="none" stroke="#7C5CFF" strokeWidth="2.5"
                          strokeDasharray="100" strokeDashoffset={100 - wellnessScore}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex items-center justify-center text-[10px] font-black text-[#7C5CFF]">{wellnessScore}%</div>
                    </div>
                  </div>

                  {/* Card 2: Current Streak */}
                  <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] border border-[#ECE7FF] flex items-center justify-between min-h-[140px] hover:-translate-y-0.5 transition-all duration-300">
                    <div className="text-left flex flex-col justify-center h-full">
                      <span className="text-[14px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Current Streak</span>
                      <span className="text-[28px] font-black text-[#1E1B4B] block leading-none">{gamification.currentStreak ?? 0} Days</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xxs text-emerald-500 font-bold">▲ 2 days</span>
                        <span className="text-[9px] text-[#6B7280] font-semibold">vs last week</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0 shadow-sm">
                      <Flame className="w-6 h-6 fill-orange-500" />
                    </div>
                  </div>

                  {/* Card 3: Longest Streak */}
                  <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] border border-[#ECE7FF] flex items-center justify-between min-h-[140px] hover:-translate-y-0.5 transition-all duration-300">
                    <div className="text-left flex flex-col justify-center h-full">
                      <span className="text-[14px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Longest Streak</span>
                      <span className="text-[28px] font-black text-[#1E1B4B] block leading-none">{gamification.longestStreak ?? 0} Days</span>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xxs text-emerald-500 font-bold">▲ New record</span>
                        <span className="text-[9px] text-emerald-550 font-black">Record Badge</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Daily Habits checklist */}
                <div className="bg-white rounded-[24px] border border-[#ECE7FF] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] space-y-6 min-h-[300px] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center select-none border-b border-gray-50 pb-3">
                      <h3 className="text-[20px] font-extrabold text-[#1E1B4B] flex items-center gap-2">
                        <Check className="w-5.5 h-5.5 text-[#7C5CFF]" /> Daily Habits Checklist
                      </h3>
                      <button
                        onClick={fetchWellnessData}
                        className="text-[14px] text-[#7C5CFF] hover:underline font-extrabold uppercase tracking-wider"
                      >
                        Today's Logs
                      </button>
                    </div>

                    {habits.length > 0 ? (
                      <div className="divide-y divide-gray-50 mt-2">
                        {habits.map((habit) => {
                          const habitMeta = getHabitIcon(habit.habitName);
                          const HabitIcon = habitMeta.Icon;
                          return (
                            <div
                              key={habit._id}
                              className={`py-3.5 flex justify-between items-center transition-all ${
                                habit.completed ? 'opacity-85' : ''
                              }`}
                            >
                              <div className="flex items-center gap-5 text-left overflow-hidden flex-1 pr-4">
                                <button
                                  onClick={() => handleToggleHabit(habit._id)}
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                    habit.completed
                                      ? 'bg-[#7C5CFF] border-transparent text-white'
                                      : 'border-[#ECE7FF] bg-[#FAFAFC] hover:border-[#7C5CFF]/45'
                                  }`}
                                >
                                  {habit.completed && <Check className="w-4 h-4 stroke-[3]" />}
                                </button>

                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${habitMeta.color}`}>
                                  <HabitIcon className="w-5 h-5" />
                                </div>

                                <div className="overflow-hidden flex-1 pl-1">
                                  <span className={`text-[16px] font-bold block truncate ${habit.completed ? 'text-gray-400 line-through font-semibold' : 'text-gray-900'}`}>
                                    {habit.habitName}
                                  </span>
                                  <span className="text-[10px] text-[#6B7280] font-semibold block uppercase mt-0.5">
                                    {habit.category || 'General'} • Streak: {habit.streak}d
                                  </span>
                                </div>

                                <div className="hidden sm:block w-36 overflow-hidden pr-2">
                                  <div className="w-full bg-[#FAFAFC] h-1.5 rounded-full overflow-hidden border border-[#ECE7FF]">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        habit.completed ? 'bg-emerald-500' : 'bg-[#7C5CFF]'
                                      }`}
                                      style={{ width: habit.completed ? '100%' : '65%' }}
                                    />
                                  </div>
                                </div>
                                <span className="hidden sm:inline text-[10px] font-extrabold text-gray-550 uppercase shrink-0">
                                  {habit.completed ? 'Completed' : 'Pending'}
                                </span>
                              </div>

                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setActiveHabitMenuId(activeHabitMenuId === habit._id ? null : habit._id)}
                                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                                >
                                  <MoreHorizontal className="w-4.5 h-4.5" />
                                </button>
                                
                                {activeHabitMenuId === habit._id && (
                                  <div className="absolute right-0 mt-1 w-28 bg-white border border-[#ECE7FF] rounded-xl shadow-lg z-20 p-1 text-left">
                                    <button
                                      onClick={() => handleDeleteHabit(habit._id)}
                                      className="w-full px-3 py-2 text-xxs font-extrabold uppercase text-rose-500 hover:bg-[#FAF8FF] rounded-lg transition-colors flex items-center gap-1.5"
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
                      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#ECE7FF] rounded-[24px] text-center text-gray-400 text-[16px] space-y-4 my-2">
                        <BookOpen className="w-10 h-10 text-[#7C5CFF]/60 mb-1" />
                        <p className="font-semibold text-gray-500 max-w-sm leading-relaxed pl-1">
                          No habits logged yet. Click "Add Habit" to track sleep, water, hydration, screen time, or custom habits.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setShowHabitModal(true)}
                      className="flex items-center gap-1.5 px-6 py-3 rounded-[14px] border border-[#ECE7FF] bg-[#FAFAFC] hover:bg-white text-[#7C5CFF] font-bold text-[14px] transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Habit
                    </button>
                  </div>
                </div>

                {/* Active Goals Board */}
                <div className="space-y-4 relative">
                  <div className="flex justify-between items-center">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {goals.map((goal) => {
                        return (
                          <div
                            key={goal._id}
                            className={`bg-white rounded-[24px] border border-[#ECE7FF] p-6 text-left shadow-[0_8px_30px_rgba(124,92,255,0.08)] flex flex-col justify-between min-h-[180px] relative hover:-translate-y-0.5 transition-all duration-300 ${
                              goal.completed ? 'opacity-70' : ''
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                  goal.priority === 'high'
                                    ? 'bg-rose-50 border border-rose-100 text-rose-500'
                                    : goal.priority === 'medium'
                                    ? 'bg-amber-50 border border-amber-100 text-amber-500'
                                    : 'bg-[#FAFAFC] border border-[#ECE7FF] text-gray-500'
                                }`}>
                                  {goal.priority}
                                </span>
                                
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleToggleGoal(goal._id, goal.completed)}
                                    className={`w-5.5 h-5.5 rounded border flex items-center justify-center transition-colors ${
                                      goal.completed
                                        ? 'bg-[#7C5CFF] border-transparent text-white'
                                        : 'border-[#ECE7FF] bg-[#FAFAFC]'
                                    }`}
                                  >
                                    {goal.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGoal(goal._id)}
                                    className="p-0.5 text-gray-400 hover:text-rose-500"
                                    title="Delete Goal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <span className={`text-[16px] font-extrabold block leading-snug line-clamp-2 ${goal.completed ? 'text-gray-400 line-through font-semibold' : 'text-[#1E1B4B]'}`}>
                                {goal.title}
                              </span>
                              <span className="text-[10px] text-[#6B7280] font-semibold block mt-1 uppercase">
                                {goal.category} • Target {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <div className="mt-4">
                              <div className="flex justify-between items-center text-[10px] text-gray-400 font-extrabold uppercase mb-1">
                                <span>{goal.completed ? '1/1 Goal' : '0/1 Goal'}</span>
                                <span>{goal.completed ? '100%' : '0%'}</span>
                              </div>
                              <div className="w-full bg-[#FAFAFC] h-1.5 rounded-full overflow-hidden border border-[#ECE7FF]">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    goal.completed ? 'bg-emerald-500' : 'bg-gray-200'
                                  }`}
                                  style={{ width: goal.completed ? '100%' : '0%' }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 border border-dashed border-[#ECE7FF] rounded-[24px] text-center text-gray-450 text-[16px] bg-white shadow-[0_8px_30px_rgba(124,92,255,0.08)] flex flex-col items-center justify-center space-y-4">
                      <Target className="w-10 h-10 text-[#7C5CFF]/60" />
                      <p className="font-semibold text-gray-500 max-w-sm leading-relaxed">No goals set yet. Click "Create Goal" to track milestones.</p>
                    </div>
                  )}

                  {/* Floating Action Circle */}
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="absolute -right-3.5 -bottom-3.5 w-11 h-11 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#7C5CFF]/20 hover:scale-105 active:scale-95 transition-all z-20"
                    title="Quick Create Goal"
                  >
                    <Plus className="w-5.5 h-5.5" />
                  </button>
                </div>

              </div>

              {/* Right Column (30% = col-span-3 of 12-column grid) */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Wellness Index circular chart */}
                <div className="bg-white rounded-[24px] border border-[#ECE7FF] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] text-left flex flex-col justify-between items-center w-full min-h-[140px]">
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left flex flex-col justify-center h-full">
                      <span className="text-[14px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Wellness Index</span>
                      <span className="text-[28px] font-black text-[#1E1B4B] block leading-none">{habits.length > 0 || goals.length > 0 ? wellnessScore : 0}%</span>
                      <div className="flex gap-3 mt-2 text-[10px] text-gray-500 font-semibold">
                        <span>Phy: {habits.length > 0 ? Math.min(100, Math.round(gamification.completionRate)) : 0}%</span>
                        <span>Men: {gamification.level > 1 || gamification.xp > 0 ? Math.min(100, Math.round(gamification.level * 10)) : 0}%</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 relative flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#F4F0FF" strokeWidth="2.5" />
                        <circle
                          cx="18" cy="18" r="15" fill="none" stroke="#7C5CFF" strokeWidth="2.5"
                          strokeDasharray="100"
                          strokeDashoffset={100 - (habits.length > 0 || goals.length > 0 ? wellnessScore : 0)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex items-center justify-center text-[10px] font-black text-[#7C5CFF]">{habits.length > 0 || goals.length > 0 ? wellnessScore : 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Achievement Badges */}
                <div className="bg-white rounded-[24px] border border-[#ECE7FF] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] text-left w-full">
                  <div className="flex justify-between items-center mb-4 pb-1 border-b border-gray-50">
                    <h4 className="text-[14px] font-extrabold uppercase tracking-widest text-[#1E1B4B] flex items-center gap-1">
                      <Award className="w-4.5 h-4.5 text-[#7C5CFF]" /> Achievement Badges
                    </h4>
                  </div>

                  <div className="grid grid-cols-5 gap-3 justify-items-center">
                    {/* Badge 1: 7 Day Streak */}
                    <div
                      className={`flex flex-col items-center text-center transition-all ${
                        gamification.longestStreak >= 7 ? 'opacity-100' : 'opacity-35 cursor-not-allowed'
                      }`}
                      title={gamification.longestStreak >= 7 ? '7 Day Streak Unlocked!' : 'Locked: Reach a 7-day habits log streak'}
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                        <Flame className="w-5 h-5 fill-orange-500" />
                      </div>
                      <span className="text-[8px] font-bold text-gray-650 block mt-1.5 truncate max-w-full">7d Streak</span>
                    </div>

                    {/* Badge 2: First Log */}
                    <div
                      className={`flex flex-col items-center text-center transition-all ${
                        (habits.some(h => h.streak > 0) || goals.some(g => g.completed)) ? 'opacity-100' : 'opacity-35 cursor-not-allowed'
                      }`}
                      title={(habits.some(h => h.streak > 0) || goals.some(g => g.completed)) ? 'First Log Unlocked!' : 'Locked: Track a habit or complete a goal'}
                    >
                      <div className="w-10 h-10 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-500 shadow-sm shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold text-gray-655 block mt-1.5 truncate max-w-full">First Log</span>
                    </div>

                    {/* Badge 3: Meditation Master */}
                    <div
                      className={`flex flex-col items-center text-center transition-all ${
                        habits.some(h => h.completed && (h.habitName.toLowerCase().includes('meditation') || h.habitName.toLowerCase().includes('mindful')))
                          ? 'opacity-100'
                          : 'opacity-35 cursor-not-allowed'
                      }`}
                      title={
                        habits.some(h => h.completed && (h.habitName.toLowerCase().includes('meditation') || h.habitName.toLowerCase().includes('mindful')))
                          ? 'Zen Master Unlocked!'
                          : 'Locked: Complete a mindfulness habit log'
                      }
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                        <Compass className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold text-gray-655 block mt-1.5 truncate max-w-full">Zen Master</span>
                    </div>

                    {/* Badge 4: Hydration Hero */}
                    <div
                      className={`flex flex-col items-center text-center transition-all ${
                        habits.some(h => h.completed && (h.habitName.toLowerCase().includes('hydration') || h.habitName.toLowerCase().includes('water')))
                          ? 'opacity-100'
                          : 'opacity-35 cursor-not-allowed'
                      }`}
                      title={
                        habits.some(h => h.completed && (h.habitName.toLowerCase().includes('hydration') || h.habitName.toLowerCase().includes('water')))
                          ? 'Hydration Hero Unlocked!'
                          : 'Locked: Complete a water hydration habit log'
                      }
                    >
                      <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 shadow-sm shrink-0">
                        <Droplet className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold text-gray-655 block mt-1.5 truncate max-w-full">Hydration</span>
                    </div>

                    {/* Badge 5: Locked */}
                    <div className="flex flex-col items-center text-center opacity-35 cursor-not-allowed" title="Early Bird (Locked)">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-bold text-gray-400 block mt-1.5 truncate max-w-full">Early Bird</span>
                    </div>
                  </div>
                </div>

                {/* Today's Motivation Card */}
                <div className="rounded-[24px] border border-[#ECE7FF] p-6 text-left bg-gradient-to-br from-[#7C5CFF]/5 to-[#A78BFA]/10 relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-[0_8px_30px_rgba(124,92,255,0.08)] w-full">
                  <div className="relative z-10">
                    <span className="text-[10px] text-[#7C5CFF] font-black uppercase tracking-wider block mb-1">Today's Motivation</span>
                    <p className="text-[16px] text-gray-700 font-bold leading-relaxed italic max-w-[210px]">
                      "The smallest daily habit creates the biggest long-term change."
                    </p>
                  </div>
                  
                  <div className="absolute right-0 bottom-0 top-0 w-[40%] opacity-20 pointer-events-none -z-10">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-[#7C5CFF]">
                      <path d="M70 100 Q40 50 80 10 Q60 50 70 100 Z" fill="currentColor" />
                      <path d="M50 80 Q25 40 60 20 Q45 50 50 80 Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* Weekly progress trend */}
                <div className="bg-white rounded-[24px] border border-[#ECE7FF] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.08)] text-left w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[14px] font-extrabold uppercase tracking-widest text-[#1E1B4B] flex items-center gap-1">
                      <TrendingUp className="w-4.5 h-4.5 text-[#7C5CFF]" /> Weekly Progress
                    </h4>
                    <select className="bg-gray-50 border border-gray-150 rounded-lg py-1 px-2 text-[8px] font-black uppercase text-gray-500 focus:outline-none cursor-pointer">
                      <option>This Week</option>
                    </select>
                  </div>

                  <div className="h-32 text-gray-350 relative my-3 pr-2 pl-2 flex flex-col justify-center items-center">
                    {hasActivityData ? (
                      <svg viewBox="0 0 100 35" className="w-full h-full">
                        <line x1="0" y1="5" x2="100" y2="5" stroke="#F4F0FF" strokeWidth="0.5" />
                        <line x1="0" y1="15" x2="100" y2="15" stroke="#F4F0FF" strokeWidth="0.5" />
                        <line x1="0" y1="25" x2="100" y2="25" stroke="#F4F0FF" strokeWidth="0.5" />

                        <path d={pathD} fill="none" stroke="#7C5CFF" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <TrendingUp className="w-8 h-8 text-gray-300 mb-1" />
                        <span className="text-xxs text-gray-400 font-bold">No data available yet.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[10px] font-extrabold uppercase text-gray-400 pt-2 border-t border-gray-50">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFF]" /> Habits Completed</span>
                  </div>
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

        </main>
      </div>
    </div>
  );
}
