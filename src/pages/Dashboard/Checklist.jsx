import React, { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import api from '../../services/api';

export default function Checklist({ 
  stats, 
  latestJournal, 
  onOpenMood, 
  onOpenJournal, 
  onOpenWellness,
  onOpenWater,
  onOpenSleep,
  onRefresh
}) {
  const [submitting, setSubmitting] = useState(false);

  // Checks based on actual live backend data
  const loggedMood = !!stats?.todayMood && stats.todayMood !== 'No mood yet';
  const drankWater = stats?.waterIntake >= 2000;
  
  const wroteJournal = (() => {
    if (!latestJournal) return false;
    const journalDate = new Date(latestJournal.createdAt).toDateString();
    const today = new Date().toDateString();
    return journalDate === today;
  })();

  const meditated = stats?.meditationMinutes >= 15;
  const sleptHours = stats?.sleepHours >= 8;

  const items = [
    { label: 'Log your mood', checked: loggedMood, action: onOpenMood },
    { label: 'Write in journal', checked: wroteJournal, action: onOpenJournal },
    { 
      label: '15 min meditation', 
      checked: meditated, 
      action: async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
          // Increment meditation to 15
          await api.post('/dashboard/wellness', {
            sleepHours: stats?.sleepHours || 0,
            waterIntake: stats?.waterIntake || 0,
            meditationMinutes: 15
          });
          onRefresh();
        } catch (err) {
          console.error(err);
        } finally {
          setSubmitting(false);
        }
      }
    },
    { label: '8 hours of sleep', checked: sleptHours, action: onOpenSleep }
  ];

  const completedCount = items.filter(i => i.checked).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left flex flex-col justify-between h-full">
      <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider pl-0.5 mb-4">
        Today's Checklist
      </h3>

      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            onClick={item.action}
            className="flex items-center gap-3 cursor-pointer group py-0.5 select-none"
          >
            {item.checked ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-[#7C5CFF] shrink-0" />
            ) : (
              <Circle className="w-4.5 h-4.5 text-gray-300 group-hover:text-[#7C5CFF]/60 shrink-0" />
            )}
            <span className={`text-xs font-bold ${item.checked ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-[#7C5CFF] transition-colors'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-50 mt-4 space-y-2">
        <div className="flex justify-between items-center text-[9px] text-[#73768F] font-extrabold uppercase tracking-wider pl-0.5">
          <span>{completedCount} of {items.length} completed</span>
          <span className="text-[#7C5CFF]">{progressPercent}%</span>
        </div>
        
        <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-[#7C5CFF] transition-all" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
