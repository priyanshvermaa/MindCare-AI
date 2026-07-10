import React from 'react';

export default function CustomAmount({ value, onChange }) {
  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
      return;
    }
    const num = Math.min(5000, Math.max(0, parseInt(val, 10) || 0));
    onChange(num);
  };

  return (
    <div className="space-y-2">
      <span className="block text-[10px] font-extrabold text-[#73768F] uppercase tracking-wider">
        Custom Amount
      </span>
      <div className="relative">
        <input
          type="number"
          placeholder="Enter amount"
          value={value === 0 || value === '' ? '' : value}
          onChange={handleInputChange}
          className="w-full bg-[#FAF9FF]/40 border border-[#E9E2FF]/60 rounded-2xl px-5 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all font-bold"
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#73768F]">
          ml
        </span>
      </div>
    </div>
  );
}
