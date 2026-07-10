import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReminderPanel({ goals }) {
  const navigate = useNavigate();

  // Find incomplete goals/habits
  const activeReminders = goals ? goals.filter(g => !g.completed) : [];

  const defaultReminders = [
    {
      month: 'JUL',
      day: '24',
      title: 'Habit Check-in',
      time: 'Tomorrow, 9:00 AM'
    },
    {
      month: 'JUL',
      day: '26',
      title: 'Weekly Reflection',
      time: 'Saturday, 8:00 PM'
    }
  ];

  return (
    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-5 pl-0.5">
        <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider">Upcoming Reminder</h3>
        <button
          onClick={() => navigate('/wellness')}
          className="text-[9px] text-[#7C5CFF] hover:underline font-extrabold uppercase tracking-wider"
        >
          View All
        </button>
      </div>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {activeReminders.length > 0 ? (
          activeReminders.slice(0, 2).map((rem, idx) => {
            const dateObj = new Date(rem.targetDate || rem.createdAt || Date.now());
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const day = dateObj.getDate();
            return (
              <div 
                key={rem._id || idx}
                onClick={() => navigate('/wellness')}
                className="flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 p-1.5 rounded-xl transition-all"
              >
                {/* Calendar box */}
                <div className="w-11.5 h-11.5 rounded-xl bg-[#7C5CFF]/8 flex flex-col items-center justify-center text-[#7C5CFF] shrink-0 font-poppins shadow-sm">
                  <span className="text-[7.5px] font-black tracking-widest leading-none mt-0.5">{month}</span>
                  <span className="text-sm font-black tracking-tight leading-none mt-1">{day}</span>
                </div>

                <div>
                  <span className="font-extrabold text-xs text-gray-900 block leading-tight">{rem.title}</span>
                  <span className="text-[9.5px] text-gray-400 font-semibold block mt-1">{rem.description || 'Tomorrow, 9:00 AM'}</span>
                </div>
              </div>
            );
          })
        ) : (
          defaultReminders.map((rem, idx) => (
            <div 
              key={idx}
              onClick={() => navigate('/wellness')}
              className="flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 p-1.5 rounded-xl transition-all"
            >
              {/* Calendar box */}
              <div className="w-11.5 h-11.5 rounded-xl bg-[#7C5CFF]/8 flex flex-col items-center justify-center text-[#7C5CFF] shrink-0 font-poppins shadow-sm">
                <span className="text-[7.5px] font-black tracking-widest leading-none mt-0.5">{rem.month}</span>
                <span className="text-sm font-black tracking-tight leading-none mt-1">{rem.day}</span>
              </div>

              <div>
                <span className="font-extrabold text-xs text-gray-900 block leading-tight">{rem.title}</span>
                <span className="text-[9.5px] text-gray-400 font-semibold block mt-1">{rem.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
