import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWater } from '../context/WaterContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplet, Plus, Trash2, Edit2, Target, Sparkles, Award,
  TrendingUp, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Bell, Check, X, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, LabelList
} from 'recharts';

// Simple custom Confetti particle generator
const ConfettiEffect = ({ active }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    const tempParticles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: -10 - Math.random() * 20, // start above screen
      size: 5 + Math.random() * 7,
      color: ['#3B82F6', '#60A5FA', '#93C5FD', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'][Math.floor(Math.random() * 7)],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2.5,
      angle: Math.random() * 360,
    }));
    setParticles(tempParticles);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: '-10vh', rotate: 0, opacity: 1 }}
          animate={{
            y: '110vh',
            rotate: p.angle + 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

// Realistic Glass Component
const RealisticGlass = ({ percentage }) => {
  const heightPercent = Math.min(100, Math.max(0, percentage));
  return (
    <div className="relative w-[76px] h-[120px] bg-white/10 border-2 border-slate-300/40 rounded-b-[24px] rounded-t-[6px] shadow-[inset_0_2px_12px_rgba(255,255,255,0.7),0_8px_20px_rgba(45,127,249,0.12)] overflow-hidden flex flex-col justify-end">
      {/* Glossy Highlight / Sheen */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/30 to-white/5 pointer-events-none z-20" />
      <div className="absolute top-1.5 left-2 right-2 h-[2px] bg-white/40 rounded-full z-20" />
      
      {/* Liquid */}
      <motion.div
        className="w-full relative bg-gradient-to-t from-[#2D7FF9] to-[#4F8DFF]"
        initial={{ height: 0 }}
        animate={{ height: `${heightPercent}%` }}
        transition={{ type: 'spring', stiffness: 35, damping: 15 }}
      >
        {/* Animated wave */}
        {heightPercent > 0 && heightPercent < 100 && (
          <div className="absolute top-0 left-0 right-0 -mt-2 h-2 overflow-hidden pointer-events-none z-10">
            <svg viewBox="0 0 120 28" className="w-[200%] h-full animate-[wave_4s_linear_infinite] fill-[#4F8DFF] opacity-90">
              <path d="M0 15 Q 30 0, 60 15 T 120 15 T 180 15 T 240 15 V 30 H 0 Z" />
            </svg>
          </div>
        )}
        
        {/* Bubbles */}
        {heightPercent > 10 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
            <div className="absolute w-1 h-1 bg-white rounded-full bottom-2 left-3 animate-[bubble_2s_infinite]" style={{ animationDelay: '0.2s' }} />
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full bottom-3 right-4 animate-[bubble_2.5s_infinite]" style={{ animationDelay: '0.5s' }} />
            <div className="absolute w-1 h-1 bg-white rounded-full bottom-6 left-5 animate-[bubble_1.8s_infinite]" style={{ animationDelay: '0.8s' }} />
            <div className="absolute w-1.2 h-1.2 bg-white rounded-full bottom-4 left-8 animate-[bubble_2.2s_infinite]" style={{ animationDelay: '1.2s' }} />
          </div>
        )}
      </motion.div>
      
      {/* Base thickness overlay for glass bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-300/10 border-t border-white/20 z-10 pointer-events-none" />
    </div>
  );
};

export default function WaterIntake() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLightMode } = useTheme();
  const { user } = useAuth();

  // Selected date state
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Core Data States and actions from WaterContext
  const {
    waterSummary: todaySummary,
    waterLogs: todayLogs,
    weeklyChartData,
    monthlyChartData,
    waterStats: stats,
    waterAiInsights: aiInsights,
    waterLoading: loading,
    fetchWaterTelemetry,
    addWater,
    updateWater,
    deleteWater,
    resetTodayWater,
    setDailyGoal
  } = useWater();

  // UI States
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState('Weekly');

  // Modals & Popovers
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(2000);
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState(250);
  const [customNotes, setCustomNotes] = useState('');
  
  // Edit log
  const [editingLog, setEditingLog] = useState(null);
  const [editAmount, setEditAmount] = useState(250);
  const [editNotes, setEditNotes] = useState('');

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', action = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Helper date conversions
  const getFormattedLocalDate = (d = new Date()) => {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDatePickerLabel = (d = new Date()) => {
    const todayStr = getFormattedLocalDate(new Date());
    const targetStr = getFormattedLocalDate(d);
    
    if (todayStr === targetStr) {
      return `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getFormattedLocalDate(yesterday);
    if (yesterdayStr === targetStr) {
      return `Yesterday, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    fetchWaterTelemetry(selectedDate, true);
  }, [selectedDate, fetchWaterTelemetry]);

  // Add water
  const handleAddWater = async (amount, notes = '') => {
    if (amount <= 0) {
      addToast('Water intake must be positive.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await addWater(amount, notes, selectedDate);
      addToast(`Logged +${amount} ml successfully.`, 'success');
      
      const currentGoal = todaySummary?.goal || 2000;
      const currentIntake = todaySummary?.totalIntake || 0;
      if (currentIntake + amount >= currentGoal && currentIntake < currentGoal) {
        setShowConfetti(true);
        addToast('🎉 Daily water goal completed!', 'success');
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (err) {
      console.error('Failed to log water:', err);
      addToast('Failed to write log.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete water
  const handleDeleteWater = async (logId) => {
    const logToDelete = todayLogs.find((l) => l._id === logId);
    if (!logToDelete) return;

    try {
      await deleteWater(logId, selectedDate);
      addToast(`Removed ${logToDelete.amount} ml.`, 'info', {
        label: 'Undo',
        onClick: async () => {
          try {
            await addWater(logToDelete.amount, logToDelete.notes || '', selectedDate);
            addToast('Restored water log.', 'success');
          } catch (restoreErr) {
            console.error('Failed to restore log:', restoreErr);
          }
        }
      });
    } catch (err) {
      console.error('Failed to delete log:', err);
      addToast('Failed to delete log.', 'error');
    }
  };

  // Set Goal
  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    if (tempGoal <= 0) {
      addToast('Goal must be positive.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await setDailyGoal(tempGoal, selectedDate);
      addToast(`Daily goal set to ${tempGoal} ml.`, 'success');
      setShowGoalModal(false);
    } catch (err) {
      console.error('Failed to set goal:', err);
      addToast('Failed to save goal.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit log amount
  const handleEditLogSubmit = async (e) => {
    e.preventDefault();
    if (!editingLog || editAmount <= 0) return;
    try {
      setActionLoading(true);
      await updateWater(editingLog._id, editAmount, editNotes, selectedDate);
      addToast('Drink record updated.', 'success');
      setEditingLog(null);
    } catch (err) {
      console.error('Failed to update log:', err);
      addToast('Failed to edit record.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Date navigation
  const navigateDate = (days) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(nextDate);
  };

  // Calculations
  const totalIntake = todaySummary?.totalIntake ?? 0;
  const goal = todaySummary?.goal ?? 2000;
  const remaining = todaySummary?.remaining ?? 2000;
  const percentage = todaySummary?.percentage ?? 0;
  const goalAchieved = todaySummary?.goalAchieved ?? false;
  
  const formattedStreak = todaySummary?.streak ?? 0;
  const formatted7DayAvg = stats?.avg7DayIntake ?? 1750;
  const formattedBest = stats?.bestDay?.amount ?? 2200;
  const formattedWeekTotal = stats?.weeklyTotal ? (stats.weeklyTotal / 1000).toFixed(2) + ' L' : '12.25 L';

  // Circle Arc geometry (r=105 for 60% inner height framework)
  const r = 105;
  const arcLength = 2 * Math.PI * r * 0.75; // 270 degrees
  const arcGap = 2 * Math.PI * r * 0.25;
  const strokeOffset = arcLength * (1 - Math.min(100, percentage) / 100);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1C1C3A] font-poppins select-none relative overflow-x-hidden">
      <ConfettiEffect active={showConfetti} />

      {/* Toasts wrapper */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="p-4 rounded-2xl shadow-xl flex items-center justify-between border border-blue-100 bg-white text-blue-850 pointer-events-auto"
            >
              <span className="text-xs font-bold">{t.message}</span>
              {t.action && (
                <button
                  onClick={t.action.onClick}
                  className="ml-3 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`transition-all duration-300 min-h-screen flex flex-col ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        <TopNav onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 px-8 pb-8 pt-6 w-full text-left relative z-10 max-w-7xl mx-auto">
          
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-50 pb-3 mb-6">
            <div className="text-left select-none flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 shadow-sm">
                <Droplet className="w-5 h-5 fill-blue-500/20" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block mb-1">Water Intake</span>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Hydration Log</h1>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {/* Native date picker */}
              <div className="relative">
                <input
                  type="date"
                  value={getFormattedLocalDate(selectedDate)}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer z-30"
                />
                <button className="flex items-center gap-2.5 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-600 font-extrabold text-[11px] tracking-wider uppercase rounded-2xl border border-gray-100 shadow-sm transition-all">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{getDatePickerLabel(selectedDate)}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>

              {/* Back & Forth dates controls */}
              <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm shrink-0">
                <button
                  onClick={() => navigateDate(-1)}
                  className="w-7 h-7 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-500 active:scale-90 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  className="w-7 h-7 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-500 active:scale-90 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
              <div className="lg:col-span-5 bg-white border border-[#EDE8FF]/50 rounded-[24px] h-[480px]" />
              <div className="lg:col-span-7 bg-white border border-[#EDE8FF]/50 rounded-[24px] h-[480px]" />
            </div>
) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Progress & Insights (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col space-y-8">
                               {/* 1. Large circular progress card (h-[520px], pt-10 pb-8 px-8 (32px all-sides except 40px top)) */}
                 <div className="bg-white border border-[#EDE8FF]/50 rounded-[24px] pt-10 pb-8 px-8 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden h-[520px]">
                   
                   {/* Arc Progress ring & Co-centered Glass container (Height 300px, vertically centering glass) */}
                   <div className="relative w-80 h-[300px] flex items-center justify-center shrink-0 select-none mt-2">
                     <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 300">
                       <defs>
                         <linearGradient id="waterProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                           <stop offset="0%" stopColor="#4F8DFF" />
                           <stop offset="100%" stopColor="#2D7FF9" />
                         </linearGradient>
                       </defs>
                       {/* Gray track (strokeWidth = 12) */}
                       <circle
                         cx="160"
                         cy="115"
                         r="105"
                         fill="transparent"
                         stroke="#F1F5F9"
                         strokeWidth="12"
                         strokeLinecap="round"
                         strokeDasharray={`${arcLength} ${arcGap}`}
                         transform="rotate(135 160 115)"
                       />
                       {/* Active blue gradient progress */}
                       <motion.circle
                         cx="160"
                         cy="115"
                         r="105"
                         fill="transparent"
                         stroke="url(#waterProgressGrad)"
                         strokeWidth="12"
                         strokeLinecap="round"
                         strokeDasharray={`${arcLength} ${arcGap}`}
                         initial={{ strokeDashoffset: arcLength }}
                         animate={{ strokeDashoffset: strokeOffset }}
                         transition={{ duration: 1.2, ease: 'easeOut' }}
                         transform="rotate(135 160 115)"
                       />
                     </svg>

                     {/* Glass perfectly co-centered at circle center (160, 115) */}
                     <div className="absolute top-[115px] left-[160px] -translate-x-1/2 -translate-y-1/2 z-10">
                       <RealisticGlass percentage={percentage} />
                     </div>

                     {/* Under-ring indicators container (Glass bottom y=175 + spacing 18px = top of container at y=193) */}
                     <div className="absolute top-[193px] flex flex-col items-center select-none w-full">
                       
                       {/* Current Intake Value */}
                       <div className="flex items-baseline justify-center gap-0.5 leading-none">
                         <span className="text-[36px] font-black text-gray-900 tracking-tight leading-none">
                           {totalIntake.toLocaleString()}
                         </span>
                         <span className="text-[13px] font-black text-gray-400 uppercase tracking-wider leading-none">
                           ml
                         </span>
                       </div>

                       {/* Goal Text (Value -> Goal text spacing: 10px) */}
                       <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest block leading-none mt-[10px]">
                         of {goal.toLocaleString()} ml goal
                       </span>
                       
                       {/* Goal achieved badge (Goal text -> badge spacing: 22px) */}
                       {goalAchieved && (
                         <motion.div 
                           initial={{ scale: 0.9, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 leading-none shadow-sm mt-[22px]"
                         >
                           <Check className="w-3.5 h-3.5 stroke-[3]" /> Goal Achieved! 🎉
                         </motion.div>
                       )}
                     </div>
                   </div>

                   {/* Horizontal progress bar (Sit 24-32px from badge/opening -> mt-6 is 24px) */}
                   <div className="w-full space-y-1.5 shrink-0 px-2 mt-6">
                     <div className="w-full h-3 bg-blue-50/50 rounded-full border border-blue-100/20 overflow-hidden">
                       <motion.div 
                         className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full"
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(100, percentage)}%` }}
                         transition={{ duration: 0.8 }}
                       />
                     </div>
                     {/* Aligned labels exactly to edges and center */}
                     <div className="relative w-full h-4 mt-2 select-none">
                       <span className="absolute left-0 text-[11px] font-black text-gray-450 tracking-wider leading-none">0</span>
                       <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-black text-gray-455 tracking-wider leading-none">{(goal / 2).toLocaleString()}</span>
                       <span className="absolute right-0 text-[11px] font-black text-gray-450 tracking-wider leading-none">{goal.toLocaleString()}</span>
                     </div>
                   </div>

                  {/* Bottom Action Subcards (Strict Grid, Equal Width and Spacing, Gap increased to 20-24px -> gap-5) */}
                  <div className="grid grid-cols-2 gap-5 w-full mt-4 shrink-0 pt-3 border-t border-gray-50 relative z-30">
                    
                    {/* Subcard 1: Add Water */}
                    <div className="relative">
                      <button
                        onClick={() => handleAddWater(250)}
                        className="w-full h-[58px] px-4 bg-white border border-gray-150 hover:border-blue-200 rounded-[20px] shadow-sm flex items-center gap-3 text-left transition-all active:scale-95 group"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                          <Droplet className="w-4.5 h-4.5 fill-blue-500/10 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-0.5 leading-none">
                          {/* Card Titles: 18px */}
                          <span className="text-[18px] font-black text-blue-500 tracking-tight block leading-none">+ 250 ml</span>
                          {/* Labels: 13-14px */}
                          <span className="text-[13px] font-extrabold text-gray-450 block uppercase tracking-wider leading-none">Add Water</span>
                        </div>
                      </button>

                      {/* Floating quick action chevron dropdown */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuickAddDropdown(!showQuickAddDropdown);
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-gray-50 border border-gray-150 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-450"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Options */}
                      <AnimatePresence>
                        {showQuickAddDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowQuickAddDropdown(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute bottom-16 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl p-2.5 z-50 flex flex-col gap-1 text-left"
                            >
                              <button
                                onClick={() => {
                                  handleAddWater(250);
                                  setShowQuickAddDropdown(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 rounded-xl text-xs font-black text-gray-700"
                              >
                                + 250 ml (Regular Glass)
                              </button>
                              <button
                                onClick={() => {
                                  handleAddWater(500);
                                  setShowQuickAddDropdown(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 rounded-xl text-xs font-black text-gray-700"
                              >
                                + 500 ml (Large Bottle)
                              </button>
                              <button
                                onClick={() => {
                                  handleAddWater(750);
                                  setShowQuickAddDropdown(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 rounded-xl text-xs font-black text-gray-700"
                              >
                                + 750 ml (Tall Flask)
                              </button>
                              <button
                                onClick={() => {
                                  setShowQuickAddDropdown(false);
                                  setCustomAmount(250);
                                  setCustomNotes('');
                                  setShowCustomModal(true);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 rounded-xl text-xs font-black text-blue-600"
                              >
                                Custom Amount...
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Subcard 2: Daily Goal */}
                    <button
                      onClick={() => {
                        setTempGoal(goal);
                        setShowGoalModal(true);
                      }}
                      className="w-full h-[58px] px-4 bg-white border border-gray-150 hover:border-blue-200 rounded-[20px] shadow-sm flex items-center gap-3 text-left transition-all active:scale-95 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <Target className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="space-y-0.5 leading-none">
                        {/* Card Titles: 18px */}
                        <span className="text-[18px] font-black text-gray-900 tracking-tight block leading-none">{goal.toLocaleString()} ml</span>
                        {/* Labels: 13-14px */}
                        <span className="text-[13px] font-extrabold text-gray-400 block uppercase tracking-wider leading-none">Daily Goal</span>
                      </div>
                    </button>

                  </div>
                </div>

                {/* 2. Hydration Insights & 4 Statistics indicator Cards (h-[390px], p-6 (24px)) */}
                <div className="bg-white border border-[#EDE8FF]/50 rounded-[24px] p-6 shadow-sm flex flex-col justify-between h-[390px]">
                  
                  {/* Header Title: Section Title (22-24px) */}
                  <div className="flex items-center gap-2 select-none shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <h3 className="font-black text-[22px] text-[#1C1C3A] tracking-tight leading-none">Today's Hydration Insights</h3>
                  </div>

                  {/* Soft green card success alert box with balanced padding */}
                  <div className="p-4 bg-[#ECFDF5] border border-[#D1FAE5] rounded-[20px] flex items-start gap-3.5 text-left relative overflow-hidden shrink-0 mt-3">
                    <div className="w-5.5 h-5.5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    
                    <div className="space-y-1 flex-1 pr-12">
                      {/* Card Titles: 18px */}
                      <h4 className="text-[18px] font-black text-[#065F46] leading-snug">Great job!</h4>
                      {/* Labels: 13-14px */}
                      <p className="text-[13px] font-extrabold text-[#047857]/80 leading-normal">
                        {goalAchieved 
                          ? "You've reached your daily water goal. Keep it up!" 
                          : `Keep going! Log ${remaining.toLocaleString()} ml more water to achieve today's goal.`}
                      </p>
                    </div>

                    {/* Droplet vector background mask */}
                    <div className="absolute right-4 bottom-3 w-12 h-12 opacity-85 select-none pointer-events-none">
                      <svg viewBox="0 0 24 24" className="w-full h-full text-blue-400 fill-blue-400/20">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* 4 Bottom statistics indicators (Equal heights h-[100px], equal widths, horizontal alignment) */}
                  <div className="grid grid-cols-4 gap-4 mt-4 shrink-0">
                    
                    <div className="h-[100px] p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-between text-left">
                      {/* Labels: 13-14px */}
                      <span className="text-[13px] font-extrabold text-gray-400 uppercase tracking-wider block leading-none">7 Days Avg</span>
                      {/* Card Titles/Values: 18px */}
                      <span className="text-[18px] font-black text-gray-900 tracking-tight block leading-none mb-1">
                        {formatted7DayAvg.toLocaleString()}
                      </span>
                    </div>

                    <div className="h-[100px] p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-between text-left">
                      {/* Labels: 13-14px */}
                      <span className="text-[13px] font-extrabold text-gray-400 uppercase tracking-wider block leading-none">Best Day</span>
                      {/* Card Titles/Values: 18px */}
                      <span className="text-[18px] font-black text-gray-900 tracking-tight block leading-none mb-1">
                        {formattedBest.toLocaleString()}
                      </span>
                    </div>

                    <div className="h-[100px] p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-between text-left">
                      {/* Labels: 13-14px */}
                      <span className="text-[13px] font-extrabold text-gray-400 uppercase tracking-wider block leading-none">Goal Streak</span>
                      {/* Card Titles/Values: 18px */}
                      <span className="text-[18px] font-black text-gray-900 tracking-tight block leading-none mb-1">
                        {formattedStreak}d
                      </span>
                    </div>

                    <div className="h-[100px] p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-between text-left">
                      {/* Labels: 13-14px */}
                      <span className="text-[13px] font-extrabold text-gray-400 uppercase tracking-wider block leading-none">Total Week</span>
                      {/* Card Titles/Values: 18px */}
                      <span className="text-[18px] font-black text-gray-900 tracking-tight block leading-none mb-1">
                        {formattedWeekTotal}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* RIGHT COLUMN: Intake History & Analytics Chart (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col space-y-8">
                
                {/* 1. Today's Intake History List (h-[500px] to align perfectly with Left Card 1) */}
                <div className="bg-white border border-[#EDE8FF]/50 rounded-[24px] p-6 shadow-sm flex flex-col justify-between h-[500px]">
                  
                  {/* Section Title: 22-24px, aligns exactly with left title, view all on title baseline */}
                  <div className="flex items-baseline justify-between border-b border-gray-150 pb-3.5 mb-4 shrink-0 select-none">
                    <h3 className="font-black text-[22px] text-[#1C1C3A] tracking-tight leading-none">Today's Intake History</h3>
                    <button 
                      onClick={() => alert("Showing full calendar log view.")}
                      className="text-[13px] font-black text-blue-500 hover:text-blue-600 transition-colors tracking-wide"
                    >
                      View all
                    </button>
                  </div>

                  {/* Scrollable list content */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                    {todayLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-12 text-center text-gray-400 space-y-3 select-none">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                          <Droplet className="w-8 h-8 stroke-[1.5]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[14px] font-black uppercase tracking-wider text-gray-400 leading-none">No drinks logged yet</p>
                          <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wide block">Log water below to start tracking your daily hydration</p>
                        </div>
                      </div>
                    ) : (
                      todayLogs.map((log) => (
                        <div 
                          key={log._id}
                          className="px-4 py-3.5 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                              <Droplet className="w-4.5 h-4.5 fill-blue-500/10" />
                            </div>
                            <div className="space-y-0.5 text-left leading-none">
                              {/* List titles: 14px */}
                              <span className="text-[14px] font-black text-gray-900 block leading-none">{log.amount} ml</span>
                              {/* Labels: 13-14px */}
                              <span className="text-[13px] font-extrabold text-gray-450 block uppercase tracking-wider leading-none">{log.time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 select-none relative h-8 shrink-0">
                            {/* Static blue indicator far right */}
                            <span className="text-[14px] font-black text-blue-500 tracking-tight group-hover:opacity-0 transition-opacity duration-150">
                              {log.amount} ml
                            </span>
                            
                            {/* Hover Edit/Delete controls */}
                            <div className="absolute right-0 top-0 bottom-0 items-center gap-1 flex opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gray-50 rounded-xl px-1.5 border border-gray-100">
                              <button
                                onClick={() => {
                                  setEditingLog(log);
                                  setEditAmount(log.amount);
                                  setEditNotes(log.notes || '');
                                }}
                                className="w-6.5 h-6.5 rounded-lg text-gray-400 hover:bg-white hover:text-blue-500 flex items-center justify-center transition-all"
                                title="Edit amount"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteWater(log._id)}
                                className="w-6.5 h-6.5 rounded-lg text-gray-400 hover:bg-white hover:text-rose-500 flex items-center justify-center transition-all"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Weekly Bar Chart Over Last 7 Days (h-[390px] to align perfectly with Left Card 2) */}
                <div className="bg-white border border-[#EDE8FF]/50 rounded-[24px] p-6 shadow-sm text-left h-[390px] flex flex-col justify-between">
                  
                  {/* Header Title: Section Title (22-24px), Weekly/Monthly toggle aligned with title baseline */}
                  <div className="flex items-baseline justify-between border-b border-gray-150 pb-3 mb-4 shrink-0 select-none">
                    <h3 className="font-black text-[22px] text-[#1C1C3A] tracking-tight leading-none">Water Intake Over Last 7 Days</h3>
                    
                    <div className="bg-gray-50 border border-gray-100 p-1 rounded-2xl flex items-center">
                      <button
                        onClick={() => setActiveTab('Weekly')}
                        className={`px-3.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          activeTab === 'Weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Weekly
                      </button>
                      <button
                        onClick={() => setActiveTab('Monthly')}
                        className={`px-3.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          activeTab === 'Monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  {/* Centered responsive bar chart (increased left YAxis padding to 12px) */}
                  <div className="flex-1 w-full text-[10px] font-extrabold font-poppins mt-2 select-none relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="95%">
                      <BarChart 
                        data={activeTab === 'Weekly' ? weeklyChartData : monthlyChartData} 
                        margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                        <XAxis 
                          dataKey="day" 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#94A3B8', fontWeight: 800 }}
                        />
                        <YAxis 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#94A3B8', fontWeight: 800 }}
                          domain={[0, 2500]}
                          ticks={[0, 500, 1000, 1500, 2000, 2500]}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border border-gray-100 p-2.5 rounded-xl shadow-lg leading-none">
                                  <p className="text-[10px] font-black text-gray-400 uppercase">{payload[0].payload.date}</p>
                                  <p className="text-[11px] font-black text-blue-500 mt-1">{payload[0].value} ml</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        
                        {/* Target Baseline Goal Line */}
                        <ReferenceLine 
                          y={goal} 
                          stroke="#10B981" 
                          strokeDasharray="4 4" 
                          strokeWidth={1.5} 
                          label={{ 
                            value: `Goal ${goal.toLocaleString()} ml`, 
                            position: 'right', 
                            fill: '#10B981', 
                            fontSize: 9, 
                            fontWeight: 900 
                          }} 
                        />
                        
                        <Bar dataKey="amount" radius={[5, 5, 0, 0]} maxBarSize={32}>
                          {(activeTab === 'Weekly' ? weeklyChartData : monthlyChartData).map((entry, idx) => {
                            const isToday = idx === (activeTab === 'Weekly' ? weeklyChartData.length - 1 : monthlyChartData.length - 1);
                            return (
                              <Cell 
                                key={`cell-${idx}`}
                                fill={isToday ? '#3B82F6' : '#93C5FD'}
                                fillOpacity={isToday ? 1 : 0.4}
                              />
                            );
                          })}
                          <LabelList 
                            dataKey="amount" 
                            position="top" 
                            fill="#1E293B" 
                            fontWeight={805} 
                            fontSize={10}
                            offset={6}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Axis Label ml */}
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block self-start pl-1 select-none pt-1 shrink-0">
                    (ml)
                  </span>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* MODALS CONTAINER */}

      {/* 1. Daily Goal Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalModal(false)}
              className="absolute inset-0 bg-[#1C1C3A]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white border border-gray-150 rounded-[28px] p-6 shadow-2xl z-10 text-left"
            >
              <button
                onClick={() => setShowGoalModal(false)}
                className="absolute right-5 top-5 text-gray-405 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleUpdateGoal} className="space-y-5">
                <div className="text-center space-y-1.5 mt-2">
                  <h3 className="text-base font-black text-gray-900">Set Daily Goal</h3>
                  <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">Baseline target volume</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase block tracking-widest pl-0.5">Amount (ml)</label>
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:border-blue-500 font-bold text-gray-800"
                    placeholder="2000"
                    min="100"
                    max="10000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="py-3 rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 font-extrabold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/10"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Custom Amount Log Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomModal(false)}
              className="absolute inset-0 bg-[#1C1C3A]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white border border-gray-150 rounded-[28px] p-6 shadow-2xl z-10 text-left"
            >
              <button
                onClick={() => setShowCustomModal(false)}
                className="absolute right-5 top-5 text-gray-405 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-5">
                <div className="text-center space-y-1.5 mt-2">
                  <h3 className="text-base font-black text-gray-900">Custom Log</h3>
                  <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">Log specific volume</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase block tracking-widest pl-0.5">Amount (ml)</label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:border-blue-500 font-bold text-gray-800"
                      placeholder="250"
                      min="1"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase block tracking-widest pl-0.5">Notes (Optional)</label>
                    <input
                      type="text"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:border-blue-500 font-bold text-gray-800 text-xs"
                      placeholder="e.g. glass with lunch"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="py-3 rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 font-extrabold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleAddWater(customAmount, customNotes);
                      setShowCustomModal(false);
                    }}
                    className="py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/10"
                  >
                    Add Drink
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Edit Log Modal */}
      <AnimatePresence>
        {editingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLog(null)}
              className="absolute inset-0 bg-[#1C1C3A]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white border border-gray-150 rounded-[28px] p-6 shadow-2xl z-10 text-left"
            >
              <button
                onClick={() => setEditingLog(null)}
                className="absolute right-5 top-5 text-gray-405 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleEditLogSubmit} className="space-y-5">
                <div className="text-center space-y-1.5 mt-2">
                  <h3 className="text-base font-black text-gray-900">Edit Log Entry</h3>
                  <p className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider">Modify logged drink volume</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase block tracking-widest pl-0.5">Amount (ml)</label>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:border-blue-500 font-bold text-gray-800"
                      placeholder="250"
                      min="1"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase block tracking-widest pl-0.5">Notes</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:border-blue-500 font-bold text-gray-800 text-xs"
                      placeholder="e.g. glass with lunch"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="py-3 rounded-2xl bg-gray-50 border border-gray-100 text-gray-500 font-extrabold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/10"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(-50%); }
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #FAFBFF;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>

    </div>
  );
}
