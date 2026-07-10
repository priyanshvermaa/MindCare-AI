import React from 'react';
import { Droplet, Plus } from 'lucide-react';

export default function WaterProgress({ stats, onAddClick }) {
  const currentWater = stats?.waterIntake ?? 0;
  const targetWater = stats?.waterGoal ?? 2500; // Dynamic target goal from backend summary
  const percentage = Math.min(100, Math.round((currentWater / targetWater) * 100));

  // Determine hydration text
  let hydrationText = 'Keep drinking!';
  if (percentage >= 100) {
    hydrationText = 'Goal completed 🎉';
  } else if (percentage >= 80) {
    hydrationText = 'Almost reached today\'s goal!';
  } else if (percentage >= 40) {
    hydrationText = 'Great progress!';
  }

  // Format liters
  const formattedCurrent = (currentWater / 1000).toFixed(2);
  const formattedTarget = (targetWater / 1000).toFixed(1);

  return (
    <div 
      onClick={onAddClick}
      className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[145px] text-left relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(124,92,255,0.04)] cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Droplet className="w-4.5 h-4.5 fill-blue-500/10 transition-transform group-hover:scale-110 duration-300" />
          </div>
          <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Water Intake</span>
        </div>

        {/* Floating Plus button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddClick();
          }}
          className="w-7 h-7 rounded-lg bg-[#7C5CFF]/8 hover:bg-[#7C5CFF] text-[#7C5CFF] hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
          title="Add Water"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xl font-black text-gray-900 tracking-tight leading-none">
            {formattedCurrent}L <span className="text-xs font-semibold text-gray-400">/ {formattedTarget}L</span>
          </span>
          <span className="text-[10px] font-black text-blue-500">{percentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className="text-[9px] font-extrabold text-[#73768F] block uppercase tracking-wider mt-1.5 leading-none transition-colors group-hover:text-[#7C5CFF]">
          {hydrationText}
        </span>
      </div>
    </div>
  );
}
