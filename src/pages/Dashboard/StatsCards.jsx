import React from 'react';
import { Heart, Smile, Flame, Moon, Edit2, Plus } from 'lucide-react';
import WaterProgress from '../../components/WaterModal/WaterProgress';

export default function StatsCards({ stats, onOpenWater, onOpenSleep }) {
  // Safe stats values
  const wellnessScore = stats?.wellnessScore ?? 0;
  const todayMood = stats?.todayMood ?? 'No mood yet';
  const streak = stats?.streak ?? 0;
  const sleepHours = stats?.sleepHours ?? 0;
  const journalCount = stats?.journalEntriesCount ?? stats?.journalEntries ?? 0;

  const getSleepQualityLabel = (hrs) => {
    if (hrs < 5) return 'Poor 😴';
    if (hrs < 7) return 'Fair 🙂';
    if (hrs <= 9) return 'Excellent 🌟';
    if (hrs <= 10) return 'Good ✅';
    if (hrs <= 12) return 'Fair 🙂';
    return 'Poor (Oversleeping) 😴';
  };

  const getSleepQualityColor = (hrs) => {
    if (hrs < 5 || hrs > 12) return 'text-red-550';
    if (hrs < 7 || hrs > 10) return 'text-amber-500';
    if (hrs <= 9) return 'text-[#7C5CFF]';
    return 'text-emerald-500';
  };

  // Formatting helper for sleep
  const formatSleep = (hrs) => {
    const hours = Math.floor(hrs);
    const minutes = Math.round((hrs - hours) * 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  // Radial progress calculations
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (wellnessScore / 100) * circumference;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-5">
      {/* 1. Wellness Score Card */}
      <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[145px] text-left relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF]">
              <Heart className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Wellness Score</span>
          </div>

          {/* Radial indicator */}
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r={radius} fill="transparent" stroke="#F3EFFF" strokeWidth="2.5" />
              <circle 
                cx="18" 
                cy="18" 
                r={radius} 
                fill="transparent" 
                stroke="#7C5CFF" 
                strokeWidth="2.5" 
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[8px] font-black text-[#7C5CFF]">{wellnessScore}%</span>
          </div>
        </div>

        <div className="mt-2.5 space-y-1">
          <span className="text-2xl font-black text-gray-900 tracking-tight block leading-none">{wellnessScore}%</span>
          <span className="text-[9px] font-extrabold text-emerald-500 flex items-center gap-1">
            ▲ 12% <span className="text-gray-400 font-semibold">vs last week</span>
          </span>
        </div>
      </div>

      {/* 2. Today's Mood Card */}
      <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[145px] text-left relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Smile className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Today's Mood</span>
        </div>

        <div className="mt-2.5 space-y-1 w-full">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-gray-900 tracking-tight leading-none block">{todayMood}</span>
            <span className="text-[9px] text-[#73768F] font-bold">7/10</span>
          </div>
          
          {/* Green sparkline svg */}
          <div className="w-full h-4 pt-1 select-none pointer-events-none">
            <svg viewBox="0 0 100 20" className="w-full h-full text-emerald-400">
              <path d="M0,15 Q25,5 50,13 T100,5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Wellness Streak Card */}
      <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[145px] text-left relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Flame className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Current Streak</span>
        </div>

        <div className="mt-2.5 space-y-1">
          <span className="text-2xl font-black text-gray-900 tracking-tight block leading-none">{streak} Days</span>
          <span className="text-[9px] text-gray-400 font-extrabold block">Keep it up!</span>
        </div>
      </div>

      {/* 4. Sleep Last Night Card */}
      <div 
        onClick={onOpenSleep}
        className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[145px] text-left relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(124,92,255,0.04)] cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
              <Moon className="w-4.5 h-4.5 transition-transform group-hover:scale-110 duration-300" />
            </div>
            <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Sleep Last Night</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSleep();
            }}
            className="w-7 h-7 rounded-lg bg-[#7C5CFF]/8 hover:bg-[#7C5CFF] text-[#7C5CFF] hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
            title="Add Sleep"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3.5 space-y-1">
          <span className="text-2xl font-black text-gray-900 tracking-tight block leading-none">
            {formatSleep(sleepHours)}
            {sleepHours > 0 && (
              <span className="text-xs font-semibold text-gray-400"> / 8h</span>
            )}
          </span>
          <span className={`text-[9px] font-extrabold block uppercase tracking-wider mt-1.5 leading-none ${
            sleepHours === 0 ? 'text-gray-400' : getSleepQualityColor(sleepHours)
          }`}>
            {sleepHours === 0 ? 'No sleep logged yet.' : getSleepQualityLabel(sleepHours)}
          </span>
        </div>
      </div>

      {/* 5. Journal Entries Card */}
      <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[145px] text-left relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C5CFF]">
            <Edit2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Journal Entries</span>
        </div>

        <div className="mt-2.5 space-y-1">
          <span className="text-2xl font-black text-gray-900 tracking-tight block leading-none">{journalCount}</span>
          <span className="text-[9px] text-gray-400 font-extrabold block">This week</span>
        </div>
      </div>

      {/* 6. Water Intake Progress Card */}
      <WaterProgress stats={stats} onAddClick={onOpenWater} />
    </div>
  );
}
