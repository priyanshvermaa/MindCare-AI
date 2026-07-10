import React from 'react';

export default function QuickAddButtons({ onSelect }) {
  const options = [
    { label: '+ 250 ml', value: 250 },
    { label: '+ 500 ml', value: 500 },
    { label: '+ 750 ml', value: 750 },
    { label: '+ 1 L', value: 1000 },
  ];

  return (
    <div className="space-y-2.5">
      <span className="block text-[10px] font-extrabold text-[#73768F] uppercase tracking-wider">
        Quick Add
      </span>
      <div className="grid grid-cols-4 gap-3">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(opt.value)}
            className="py-3 px-2 rounded-2xl border border-[#E9E2FF]/60 bg-[#FAF9FF]/40 text-[#7C5CFF] font-extrabold text-xs hover:bg-[#7C5CFF] hover:text-white hover:border-[#7C5CFF] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
