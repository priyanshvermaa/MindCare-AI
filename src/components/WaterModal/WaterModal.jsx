import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplet } from 'lucide-react';
import WaterSlider from './WaterSlider';
import QuickAddButtons from './QuickAddButtons';
import CustomAmount from './CustomAmount';
import { useWater } from '../../context/WaterContext';

export default function WaterModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState(250);
  const [loading, setLoading] = useState(false);
  const { addWater } = useWater();

  // Close on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleQuickAdd = (value) => {
    // Add value to current selected amount, capped at 5000 ml
    setAmount((prev) => Math.min(5000, prev + value));
  };

  const handleCustomChange = (value) => {
    setAmount(value);
  };

  const handleIncrement = () => {
    setAmount((prev) => Math.min(5000, prev + 250));
  };

  const handleDecrement = () => {
    setAmount((prev) => Math.max(0, prev - 250));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount <= 0) return;
    setLoading(true);

    try {
      // Add water using context helper which handles sync
      await addWater(amount);
      onSuccess();
      onClose();
      setAmount(250); // Reset default
    } catch (err) {
      console.error('Failed to log water intake:', err);
    } finally {
      setLoading(false);
    }
  };

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

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Icon & Title */}
              <div className="text-center space-y-2 mt-2">
                <div className="w-14 h-14 rounded-full bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] mx-auto">
                  <Droplet className="w-7 h-7 fill-[#7C5CFF]/10" />
                </div>
                <h3 className="text-2xl font-black text-[#1C1C3A] tracking-tight">Add Water</h3>
                <p className="text-xs text-[#73768F] font-bold">Track your daily water intake</p>
              </div>

              {/* Selector amount display with +/- controls */}
              <div className="flex items-center justify-between px-4 py-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-10 h-10 rounded-full border border-[#E9E2FF]/60 bg-white text-[#7C5CFF] font-black text-xl hover:bg-[#7C5CFF] hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
                >
                  −
                </button>
                <div className="text-center">
                  <span className="text-3xl font-black text-[#7C5CFF]">
                    {amount || 0} <span className="text-base font-extrabold">ml</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-10 h-10 rounded-full border border-[#E9E2FF]/60 bg-white text-[#7C5CFF] font-black text-xl hover:bg-[#7C5CFF] hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
                >
                  +
                </button>
              </div>

              {/* Slider */}
              <WaterSlider value={amount} onChange={setAmount} max={2500} />

              {/* Quick Add grid */}
              <QuickAddButtons onSelect={handleQuickAdd} />

              {/* Custom input */}
              <CustomAmount value={amount} onChange={handleCustomChange} />

              {/* Bottom buttons */}
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
                  disabled={loading || amount <= 0}
                  className="py-4 rounded-2xl bg-[#7C5CFF] hover:bg-[#6846FF] text-white font-extrabold text-sm active:scale-98 transition-all shadow-lg shadow-[#7C5CFF]/20 flex items-center justify-center gap-2"
                >
                  {loading ? 'Adding...' : (
                    <>
                      <Droplet className="w-4 h-4 fill-white/10" />
                      Add Water
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
}
