import React from 'react';
import { Smile, BookOpen, Target, Flower2, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions({ onOpenMood, onOpenJournal, onOpenWellness }) {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Log Mood',
      subtitle: 'How are you feeling today?',
      icon: Smile,
      iconColor: 'text-emerald-500 bg-emerald-50',
      action: onOpenMood
    },
    {
      title: 'Write in Journal',
      subtitle: 'Reflect your thoughts',
      icon: BookOpen,
      iconColor: 'text-[#7C5CFF] bg-[#7C5CFF]/8',
      action: onOpenJournal
    },
    {
      title: 'Track Habits',
      subtitle: 'Build healthy routines',
      icon: Target,
      iconColor: 'text-rose-500 bg-rose-50',
      action: onOpenWellness
    },
    {
      title: 'Start Meditation',
      subtitle: 'Find your calm',
      icon: Flower2,
      iconColor: 'text-purple-500 bg-purple-50',
      action: () => navigate('/meditation')
    }
  ];

  return (
    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left flex flex-col justify-between h-full">
      <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider flex items-center gap-1.5 pl-0.5 border-b border-[#FAF9FF] pb-3 mb-4">
        <Zap className="w-4 h-4 text-[#7C5CFF] fill-[#7C5CFF]/10" /> Quick Actions
      </h3>

      <div className="flex-1 flex flex-col justify-center gap-[18px]">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <div
              key={i}
              onClick={act.action}
              className="flex items-center justify-between px-3 h-[52px] rounded-xl border border-slate-100/80 hover:border-[#E9E2FF]/60 hover:bg-[#FAF9FF]/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8.5 h-8.5 rounded-lg ${act.iconColor} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-gray-900 block leading-tight">{act.title}</span>
                  <span className="text-[9px] text-[#73768F] font-bold block mt-0.5">{act.subtitle}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7C5CFF] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
