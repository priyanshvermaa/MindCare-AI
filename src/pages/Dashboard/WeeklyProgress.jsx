import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower2, BookOpen, Droplet, Activity } from 'lucide-react';

export default function WeeklyProgress({ stats }) {
  const navigate = useNavigate();

  // Dynamic calculations based on backend logs
  const meditationProgress = stats ? Math.min(100, Math.round((stats.meditationMinutes / 15) * 100)) : 0;
  const journalProgress = stats ? Math.min(100, Math.round(((stats.journalEntriesCount || stats.journalEntries || 0) / 5) * 100)) : 0;
  const waterProgress = stats ? Math.min(100, Math.round((stats.waterIntake / (stats.waterGoal || 2500)) * 100)) : 0;
  const exerciseProgress = 0; // Default fallback for exercise minutes

  const items = [
    {
      name: 'Meditation',
      progress: meditationProgress,
      icon: Flower2,
      color: 'bg-[#7C5CFF]',
      textColor: 'text-[#7C5CFF]'
    },
    {
      name: 'Journaling',
      progress: journalProgress,
      icon: BookOpen,
      color: 'bg-indigo-400',
      textColor: 'text-indigo-500'
    },
    {
      name: 'Water Intake',
      progress: waterProgress,
      icon: Droplet,
      color: 'bg-emerald-400',
      textColor: 'text-emerald-500'
    },
    {
      name: 'Exercise',
      progress: exerciseProgress,
      icon: Activity,
      color: 'bg-amber-400',
      textColor: 'text-amber-500'
    }
  ];

  return (
    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-5 pl-0.5">
        <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider">Weekly Progress</h3>
        <button
          onClick={() => navigate('/analytics')}
          className="text-[9px] text-[#7C5CFF] hover:underline font-extrabold uppercase tracking-wider"
        >
          View All
        </button>
      </div>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="space-y-1.5 pl-0.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-gray-700 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.textColor}`} />
                  {item.name}
                </span>
                <span className="text-[10px] font-black text-gray-500">{item.progress}%</span>
              </div>
              
              <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.color} transition-all`} 
                  style={{ width: `${item.progress}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
