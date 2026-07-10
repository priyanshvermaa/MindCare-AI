import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon } from 'lucide-react';
import api from '../../services/api';

export default function SleepModal({ isOpen, onClose, onSuccess }) {
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(30);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hours === 0 && minutes === 0) return;
    setLoading(true);

    try {
      const sleepHoursDecimal = hours + minutes / 60;
      // Post to `/api/dashboard/wellness`
      await api.post('/dashboard/wellness', { sleepHours: sleepHoursDecimal });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setHours(7);
        setMinutes(30);
        setSuccess(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to log sleep:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSleepQuality = (hrs) => {
    if (hrs < 5) return { label: 'Poor 😴', color: 'text-red-500', bg: 'bg-red-50/50 border-red-100' };
    if (hrs < 7) return { label: 'Fair 🙂', color: 'text-amber-500', bg: 'bg-amber-50/50 border-amber-100' };
    if (hrs <= 9) return { label: 'Excellent 🌟', color: 'text-[#7C5CFF]', bg: 'bg-[#7C5CFF]/5 border-[#7C5CFF]/10' };
    if (hrs <= 10) return { label: 'Good ✅', color: 'text-emerald-500', bg: 'bg-emerald-50/50 border-emerald-100' };
    if (hrs <= 12) return { label: 'Fair 🙂', color: 'text-amber-500', bg: 'bg-amber-50/50 border-amber-100' };
    return { label: 'Poor (Oversleeping) 😴', color: 'text-red-500', bg: 'bg-red-50/50 border-red-100' };
  };

  const totalDecimal = hours + minutes / 60;
  const quality = getSleepQuality(totalDecimal);

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
            className="relative w-full max-w-md bg-white border border-[#E9E2FF]/60 rounded-[32px] p-6 md:p-8 shadow-[0_20px_50px_rgba(124,92,255,0.08)] z-10 overflow-hidden text-left"
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
                <h3 className="text-xl font-black text-[#1C1C3A]">Sleep Logged!</h3>
                <p className="text-sm text-[#73768F] font-bold">Your sleep statistics have been successfully updated.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Icon & Title */}
                <div className="text-center space-y-2 mt-2">
                  <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mx-auto shadow-sm">
                    <Moon className="w-7 h-7 fill-sky-500/10" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1C1C3A] tracking-tight">Log Last Night's Sleep</h3>
                  <p className="text-xs text-[#73768F] font-bold">Keep track of your rest for better mindfulness</p>
                </div>

                {/* Duration select dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#73768F] block pl-1">Hours</label>
                    <select
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value, 10))}
                      className="w-full bg-[#FAF9FF] border border-[#E9E2FF]/60 rounded-2xl px-4 py-3.5 text-sm text-[#1C1C3A] font-black focus:outline-none focus:border-[#7C5CFF]/80 focus:ring-1 focus:ring-[#7C5CFF]/80 cursor-pointer"
                    >
                      {Array.from({ length: 25 }).map((_, i) => (
                        <option key={i} value={i}>{i} hr</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#73768F] block pl-1">Minutes</label>
                    <select
                      value={minutes}
                      onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                      className="w-full bg-[#FAF9FF] border border-[#E9E2FF]/60 rounded-2xl px-4 py-3.5 text-sm text-[#1C1C3A] font-black focus:outline-none focus:border-[#7C5CFF]/80 focus:ring-1 focus:ring-[#7C5CFF]/80 cursor-pointer"
                    >
                      {Array.from({ length: 60 }).map((_, i) => (
                        <option key={i} value={i}>{i} min</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Preview Block */}
                <div className={`border p-4 rounded-2xl flex justify-between items-center transition-all ${quality.bg}`}>
                  <div>
                    <span className="text-[10px] font-black text-[#73768F] uppercase tracking-wider block">Total Sleep</span>
                    <span className="text-lg font-black text-gray-900 tracking-tight">
                      {hours}h {minutes}m
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-[#73768F] uppercase tracking-wider block">Sleep Quality</span>
                    <span className={`text-sm font-black uppercase tracking-wider ${quality.color}`}>
                      {quality.label}
                    </span>
                  </div>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-4 rounded-2xl bg-[#FAF9FF] hover:bg-[#FAF9FF]/80 text-[#73768F] font-extrabold text-sm active:scale-98 transition-all border border-[#E9E2FF]/30 flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (hours === 0 && minutes === 0)}
                    className="py-4 rounded-2xl bg-[#7C5CFF] hover:bg-[#6846FF] text-white font-extrabold text-sm active:scale-98 transition-all shadow-lg shadow-[#7C5CFF]/20 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Logging...' : (
                      <>
                        <Moon className="w-4 h-4 fill-white/10" />
                        Save Sleep
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
