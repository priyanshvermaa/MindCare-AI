import React from 'react';

export default function WaterSlider({ value, onChange, max = 2500 }) {
  return (
    <div className="space-y-2">
      <div className="relative pt-1">
        <input
          type="range"
          min="0"
          max={max}
          step="50"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-purple-50 rounded-lg appearance-none cursor-pointer accent-[#7C5CFF] focus:outline-none"
        />
      </div>
      <div className="flex justify-between text-[10px] font-extrabold text-[#73768F] uppercase tracking-wider">
        <span>0 ml</span>
        <span>{max} ml</span>
      </div>
    </div>
  );
}
