import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Greeting({ user }) {
  const navigate = useNavigate();

  // Get name
  const name = user?.name ? user.name.split(' ')[0] : 'Priyansh';

  // Get greeting based on current local time
  const getGreetingText = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
      <div className="text-left select-none">
        <h1 className="text-3xl md:text-[34px] font-black text-gray-900 tracking-tight leading-none mb-2">
          {getGreetingText()}, {name === 'Test' ? 'Priyansh' : name}! 👋
        </h1>
        <p className="text-xs md:text-sm text-gray-500 font-bold tracking-wide">
          Here's your wellness overview for today.
        </p>
      </div>

      <button
        onClick={() => navigate('/ai-assistant')}
        className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-full bg-[#7C5CFF]/8 hover:bg-[#7C5CFF]/15 text-[#7C5CFF] font-extrabold text-[11px] uppercase tracking-wider transition-all select-none shrink-0"
      >
        <Sparkles className="w-3.5 h-3.5 fill-[#7C5CFF]" /> AI Assistant
      </button>
    </div>
  );
}
