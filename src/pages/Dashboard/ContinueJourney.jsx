import React from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContinueJourney() {
  const navigate = useNavigate();

  const sessions = [
    {
      title: 'Morning Mindfulness',
      author: 'With MindCare',
      duration: '10 min • Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400'
    },
    {
      title: 'Breath & Grounding',
      author: 'With Emma Walsh',
      duration: '8 min • Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400'
    },
    {
      title: 'Body Scan Relaxation',
      author: 'With Jason Stephenson',
      duration: '15 min • Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=400'
    }
  ];

  return (
    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left space-y-4">
      <div className="flex justify-between items-center pl-0.5">
        <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider">Continue Where You Left Off</h3>
        <button
          onClick={() => navigate('/meditation')}
          className="text-[9px] text-[#7C5CFF] hover:underline font-extrabold uppercase tracking-wider"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sessions.map((track, i) => (
          <div
            key={i}
            className="p-3.5 bg-[#FAF9FF]/40 border border-gray-100 hover:border-purple-200 rounded-2xl flex items-center justify-between gap-4 transition-all cursor-pointer group"
            onClick={() => navigate('/meditation')}
          >
            <div className="flex items-center gap-3">
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-11 h-11 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <span className="font-black text-xs text-gray-900 block truncate group-hover:text-[#7C5CFF] transition-colors">{track.title}</span>
                <span className="text-[9px] text-[#73768F] font-bold block mt-1 uppercase tracking-wider">
                  {track.duration}
                </span>
              </div>
            </div>

            <button className="w-8 h-8 rounded-full bg-white hover:bg-[#7C5CFF]/10 border border-[#E9E2FF] flex items-center justify-center text-[#7C5CFF] shrink-0 shadow-sm transition-all group-hover:scale-105">
              <Play className="w-3.5 h-3.5 fill-[#7C5CFF] ml-0.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
