import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile, Star, BookOpen, Activity, Heart, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';

const ModalWrapper = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
          />

          {/* Dialog Card box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg glass-card border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl z-10 overflow-hidden text-left"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 1. ADD MOOD MODAL
export const MoodModal = ({ isOpen, onClose, onSuccess }) => {
  const [mood, setMood] = useState(7); // default to 7 (Good)
  const [note, setNote] = useState('');
  const [activitiesList, setActivitiesList] = useState([
    'Sleep', 'Exercise', 'Study', 'Work', 'Friends', 'Family', 'Health', 'Relationship', 'Finance', 'Weather', 'Meditation', 'Travel', 'Productivity', 'Self Care'
  ]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Close on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    if (!customTag.trim()) return;
    const tag = customTag.trim();
    if (!activitiesList.includes(tag)) {
      setActivitiesList((prev) => [...prev, tag]);
    }
    if (!selectedActivities.includes(tag)) {
      setSelectedActivities((prev) => [...prev, tag]);
    }
    setCustomTag('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map 1-10 to 1-5 scale for the backend api
      const mappedMood = Math.ceil(mood / 2);
      
      // Post mood
      await api.post('/dashboard/mood', {
        mood: mappedMood,
        activities: selectedActivities,
      });

      // Post journal note if present
      if (note.trim()) {
        const title = `Mood Reflection - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        await api.post('/dashboard/journal', {
          title,
          content: note.trim()
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset states
        setMood(7);
        setNote('');
        setSelectedActivities([]);
        setSuccess(false);
      }, 1200);

    } catch (err) {
      console.error('Failed to log mood: ', err);
    } finally {
      setLoading(false);
    }
  };

  const moodDetails = {
    1: { emoji: '😭', label: 'Very Sad', color: 'text-red-500' },
    2: { emoji: '😭', label: 'Very Sad', color: 'text-red-500' },
    3: { emoji: '😢', label: 'Sad', color: 'text-blue-500' },
    4: { emoji: '😢', label: 'Sad', color: 'text-blue-500' },
    5: { emoji: '😐', label: 'Neutral', color: 'text-gray-500' },
    6: { emoji: '😐', label: 'Neutral', color: 'text-gray-500' },
    7: { emoji: '😊', label: 'Good', color: 'text-emerald-500' },
    8: { emoji: '😊', label: 'Good', color: 'text-emerald-500' },
    9: { emoji: '😄', label: 'Happy', color: 'text-amber-500' },
    10: { emoji: '😍', label: 'Amazing', color: 'text-[#7C5CFF]' },
  };

  const currentMood = moodDetails[mood];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1C1C3A]/40 backdrop-blur-md"
          />

          {/* Dialog Card box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg bg-white border border-[#E9E2FF]/60 rounded-[28px] p-6 md:p-8 shadow-[0_20px_50px_rgba(124,92,255,0.08)] z-10 overflow-hidden text-left"
          >
            {/* Header X button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            {success ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto text-3xl">
                  ✓
                </div>
                <h3 className="text-xl font-black text-[#1C1C3A]">Mood Saved!</h3>
                <p className="text-sm text-[#73768F] font-bold">Your daily tracker has been updated successfully.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Icon & Title */}
                <div className="text-center space-y-1">
                  <motion.div 
                    key={mood}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl select-none"
                  >
                    {currentMood.emoji}
                  </motion.div>
                  <h3 className="text-2xl font-black text-[#1C1C3A] tracking-tight">Log Your Mood</h3>
                  <p className="text-xs text-[#73768F] font-bold">Take a moment to reflect on how you're feeling.</p>
                </div>

                {/* Mood Selector Slider */}
                <div className="bg-[#FAF9FF] border border-[#E9E2FF]/40 rounded-2xl p-4 text-center space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#73768F]">Score: {mood}/10</span>
                    <span className={`text-xs font-black uppercase tracking-wider ${currentMood.color}`}>
                      {currentMood.label}
                    </span>
                  </div>
                  <input
                    id="mood-slider"
                    type="range"
                    min="1"
                    max="10"
                    value={mood}
                    onChange={(e) => setMood(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#E9E2FF]/60 rounded-lg appearance-none cursor-pointer accent-[#7C5CFF] focus:outline-none"
                  />
                  <div className="flex justify-between text-[9px] text-[#73768F] font-extrabold uppercase tracking-wider px-1">
                    <span>Sad</span>
                    <span>Neutral</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* Associated Activities */}
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#73768F] mb-2.5">
                    What's influencing your mood?
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1 pb-1">
                    {activitiesList.map((activity) => {
                      const isSelected = selectedActivities.includes(activity);
                      return (
                        <button
                          type="button"
                          key={activity}
                          onClick={() => toggleActivity(activity)}
                          className={`text-xxs px-3 py-1.5 rounded-full border active:scale-95 transition-all ${
                            isSelected
                              ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white font-extrabold'
                              : 'bg-[#FAF9FF] border-[#E9E2FF]/60 text-[#73768F] font-bold hover:bg-[#FAF9FF]/80'
                          }`}
                        >
                          {activity}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Custom factor tag builder */}
                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom factor..."
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      className="bg-[#FAF9FF] border border-[#E9E2FF]/60 rounded-xl px-3 py-1.5 text-xs text-[#1C1C3A] placeholder-[#73768F]/60 focus:outline-none focus:border-[#7C5CFF]/80 w-full"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="px-3.5 py-1.5 bg-[#FAF9FF] border border-[#E9E2FF]/60 rounded-xl text-[#7C5CFF] hover:bg-[#7C5CFF] hover:text-white transition-all text-xs font-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Journal Note Text area */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 px-0.5">
                    <label htmlFor="mood-note" className="block text-[10px] font-black uppercase tracking-wider text-[#73768F]">
                      Optional Note
                    </label>
                    <span className="text-[9px] font-bold text-[#73768F]/60">{note.length}/300</span>
                  </div>
                  <textarea
                    id="mood-note"
                    rows="2.5"
                    maxLength={300}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's on your mind today?"
                    className="bg-[#FAF9FF] border border-[#E9E2FF]/60 rounded-2xl px-4 py-3 text-sm text-[#1C1C3A] placeholder-[#73768F]/60 focus:outline-none focus:border-[#7C5CFF]/80 focus:ring-1 focus:ring-[#7C5CFF]/80 w-full transition-colors resize-none"
                  />
                </div>

                {/* Submit / Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3.5 rounded-2xl bg-[#FAF9FF] hover:bg-[#FAF9FF]/80 text-[#73768F] font-extrabold text-sm active:scale-98 transition-all border border-[#E9E2FF]/30 flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3.5 rounded-2xl bg-gradient-to-r from-[#7C5CFF] to-[#A78BFA] hover:from-[#6846FF] hover:to-[#906BFF] text-white font-extrabold text-sm active:scale-98 transition-all shadow-lg shadow-[#7C5CFF]/20 flex items-center justify-center gap-1.5"
                  >
                    {loading ? 'Saving...' : 'Save Mood'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 2. CBT JOURNAL MODAL
export const JournalModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/dashboard/journal', { title, content });
      onSuccess();
      onClose();
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Failed to save journal: ', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Write CBT Journal Entry">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="journal-title" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Journal Title
          </label>
          <input
            id="journal-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Focusing on my triggers..."
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent w-full transition-colors"
          />
        </div>

        <div>
          <label htmlFor="journal-content" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Reflective Thought Record
          </label>
          <textarea
            id="journal-content"
            required
            rows="6"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What situation triggered your stress? Write down your automated distorted core belief and try to challenge it using reframed realistic sentences."
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent w-full transition-colors resize-none"
          />
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-xxs text-slate-500 flex gap-2">
          <BookOpen className="w-4.5 h-4.5 text-brand-tech shrink-0 mt-0.5" />
          <span>
            MindCare AI automatically analyzes the sentiment (anxious, positive, neutral, exhausted) of your journal logs to plot your weekly resilience dashboard stats.
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full justify-center"
        >
          {loading ? 'Saving Journal...' : 'Save Journal Entry'}
        </Button>
      </form>
    </ModalWrapper>
  );
};

// 3. LOG WELLNESS STATS MODAL
export const WellnessModal = ({ isOpen, onClose, onSuccess, initialStats }) => {
  const [sleepHours, setSleepHours] = useState(initialStats?.sleepHours || 0);
  const [waterIntake, setWaterIntake] = useState(initialStats?.waterIntake || 0);
  const [meditationMinutes, setMeditationMinutes] = useState(initialStats?.meditationMinutes || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialStats) {
      setSleepHours(initialStats.sleepHours || 0);
      setWaterIntake(initialStats.waterIntake || 0);
      setMeditationMinutes(initialStats.meditationMinutes || 0);
    }
  }, [initialStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/dashboard/activity', {
        sleepHours,
        waterIntake,
        meditationMinutes,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to log wellness stats: ', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Log Daily Physical Wellness Stats">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sleep input */}
        <div>
          <label htmlFor="sleep" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Sleep Hours (hours today)
          </label>
          <input
            id="sleep"
            type="number"
            min="0"
            max="24"
            step="0.5"
            required
            value={sleepHours === 0 ? '' : sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent w-full transition-colors"
          />
        </div>

        {/* Water input */}
        <div>
          <label htmlFor="water" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Water Intake (ml today)
          </label>
          <input
            id="water"
            type="number"
            min="0"
            step="100"
            required
            value={waterIntake === 0 ? '' : waterIntake}
            onChange={(e) => setWaterIntake(parseInt(e.target.value, 10) || 0)}
            placeholder="0"
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent w-full transition-colors"
          />
        </div>

        {/* Meditation input */}
        <div>
          <label htmlFor="meditation" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Meditation Time (minutes today)
          </label>
          <input
            id="meditation"
            type="number"
            min="0"
            required
            value={meditationMinutes === 0 ? '' : meditationMinutes}
            onChange={(e) => setMeditationMinutes(parseInt(e.target.value, 10) || 0)}
            placeholder="0"
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent w-full transition-colors"
          />
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-xxs text-slate-500 flex gap-2">
          <Activity className="w-4.5 h-4.5 text-brand-accent shrink-0 mt-0.5" />
          <span>
            Entering stats updates your computed Wellness Score. Complete daily targets (8 hrs sleep, 2000ml water, 15 mins meditation) to achieve a 100% score rating.
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full justify-center"
        >
          {loading ? 'Saving Metrics...' : 'Update Statistics'}
        </Button>
      </form>
    </ModalWrapper>
  );
};
