import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile, Star, BookOpen, Activity, Heart, ShieldCheck, Sparkles } from 'lucide-react';
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
  const [category, setCategory] = useState('Daily Reflection');
  const [selectedMood, setSelectedMood] = useState('Good');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!content.trim()) newErrors.content = 'Reflection content is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/dashboard/journal', {
        title: title.trim(),
        content: content.trim(),
        category,
        mood: selectedMood,
        tags: selectedTags
      });

      onSuccess();
      onClose();
      // Reset states
      setTitle('');
      setContent('');
      setCategory('Daily Reflection');
      setSelectedMood('Good');
      setSelectedTags([]);
      setErrors({});
    } catch (err) {
      console.error('Failed to save journal: ', err);
      setErrors({ submit: err.response?.data?.message || 'Failed to save journal entry.' });
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = [
    'Daily Reflection',
    'Gratitude',
    'CBT Reflection',
    'Positive Thoughts',
    'Anxiety',
    'Stress',
    'Sleep',
    'Personal Growth'
  ];

  const MOOD_OPTIONS = [
    { emoji: '😊', label: 'Great' },
    { emoji: '🙂', label: 'Good' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😔', label: 'Sad' },
    { emoji: '😣', label: 'Stressed' },
    { emoji: '😴', label: 'Tired' }
  ];

  const TAG_OPTIONS = [
    'Work', 'Study', 'Family', 'Friends', 'Exercise', 'Sleep', 'Anxiety', 'Stress', 'Meditation'
  ];

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
            className="relative w-full max-w-lg bg-white border border-[#E9E2FF]/60 rounded-[32px] p-6 md:p-8 shadow-[0_20px_50px_rgba(124,92,255,0.08)] z-10 overflow-y-auto max-h-[90vh] text-left scrollbar-none"
          >
            {/* Header X close button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 pr-8">
              <div className="w-11 h-11 rounded-2xl bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1C1C3A] tracking-tight uppercase">Write Journal Entry</h3>
                <p className="text-[11px] text-[#73768F] font-bold mt-0.5">Reflect on your thoughts and emotions today.</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              {errors.submit && (
                <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3 text-rose-600 text-[11px] font-bold">
                  {errors.submit}
                </div>
              )}

              {/* Journal Title */}
              <div className="space-y-1.5">
                <label htmlFor="journal-title" className="block text-[9px] font-black uppercase tracking-widest text-[#73768F] pl-0.5">
                  Journal Title
                </label>
                <input
                  id="journal-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                  }}
                  placeholder="Today I practiced gratitude"
                  className={`w-full bg-white border ${errors.title ? 'border-rose-300' : 'border-[#ECE8FF]'} rounded-[14px] px-4 py-3 text-xs text-[#1C1C3A] placeholder-gray-400 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all font-semibold`}
                />
                {errors.title && <span className="text-[10px] text-rose-500 font-extrabold block pl-0.5">{errors.title}</span>}
              </div>

              {/* Journal Category */}
              <div className="space-y-1.5">
                <label htmlFor="journal-category" className="block text-[9px] font-black uppercase tracking-widest text-[#73768F] pl-0.5">
                  Journal Category
                </label>
                <div className="relative">
                  <select
                    id="journal-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-[#ECE8FF] rounded-[14px] px-4 py-3 text-xs text-[#1C1C3A] focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all font-semibold appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#73768F]">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mood Selection */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#73768F] pl-0.5">
                  Mood
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {MOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedMood(opt.label)}
                      className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedMood === opt.label
                          ? 'bg-[#F8F5FF] border-[#7C5CFF] text-[#7C5CFF] scale-102 shadow-sm font-black'
                          : 'bg-white border-[#ECE8FF] text-gray-400 hover:bg-gray-50/50 hover:border-gray-300 font-bold'
                      }`}
                    >
                      <span className="text-base">{opt.emoji}</span>
                      <span className="text-[8px] uppercase tracking-wider">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection */}
              <div className="space-y-1.5">
                <label htmlFor="journal-reflection" className="block text-[9px] font-black uppercase tracking-widest text-[#73768F] pl-0.5">
                  Reflection
                </label>
                <textarea
                  id="journal-reflection"
                  ref={textareaRef}
                  rows="4"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errors.content) setErrors(prev => ({ ...prev, content: null }));
                  }}
                  placeholder="What happened today?&#10;How did it make you feel?&#10;What did you learn from it?"
                  className={`w-full bg-white border ${errors.content ? 'border-rose-300' : 'border-[#ECE8FF]'} rounded-[14px] px-4 py-3 text-xs text-[#1C1C3A] placeholder-gray-400 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all font-semibold resize-none overflow-hidden min-h-[100px]`}
                />
                {errors.content && <span className="text-[10px] text-rose-500 font-extrabold block pl-0.5">{errors.content}</span>}
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[#73768F] pl-0.5">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_OPTIONS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedTags(prev =>
                            isSelected ? prev.filter(t => t !== tag) : [...prev, tag]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full border text-[9px] font-black tracking-wider uppercase transition-all ${
                          isSelected
                            ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white shadow-sm shadow-[#7c5cff]/20'
                            : 'bg-[#FAF9FF]/60 border-[#ECE8FF] text-[#7C5CFF] hover:bg-[#F8F5FF]'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Analysis Info Box */}
              <div className="p-4 bg-[#F8F5FF] rounded-2xl border border-[#ECE8FF] text-left flex gap-3">
                <Sparkles className="w-5 h-5 text-[#7C5CFF] shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-[9px] font-black text-[#1C1C3A] uppercase tracking-wider">AI Wellness Analysis</h4>
                  <p className="text-[10px] text-[#73768F] font-semibold leading-relaxed mt-1">
                    MindCare AI will analyze your journal to identify emotional patterns, stress indicators, sentiment, and wellness trends. These insights help personalize your dashboard and recommendations.
                  </p>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 rounded-2xl bg-white border border-[#ECE8FF] text-[#73768F] hover:bg-gray-50 text-xs font-black uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-3.5 rounded-2xl bg-[#7C5CFF] hover:bg-[#6846FF] text-white text-xs font-black uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#7C5CFF]/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-white" />
                      <span>Save Journal Entry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
