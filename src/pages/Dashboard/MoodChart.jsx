import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MoodChart({ weeklyData }) {
  const [selectedRange, setSelectedRange] = useState('week');

  const chartData = weeklyData ? weeklyData.map(item => ({
    name: item.day || item.date || '',
    score: item.mood || item.score || 4
  })) : [];

  return (
    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left space-y-4 h-full">
      <div className="flex justify-between items-center pb-2">
        <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider pl-0.5">Mood Overview (This Week)</h3>
        
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="bg-[#FAF8FF] border border-[#E9E2FF]/40 rounded-xl px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-[#7C5CFF] focus:outline-none cursor-pointer"
        >
          <option value="week">This Week</option>
        </select>
      </div>

      <div className="h-56 w-full pt-1">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardMatchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FAF9FF" vertical={false} />
              <XAxis dataKey="name" stroke="#A98CFF" style={{ fontSize: '8px', fontWeight: 'bold' }} tickLine={false} />
              <YAxis stroke="#A98CFF" domain={[1, 10]} ticks={[0, 5, 7, 10]} style={{ fontSize: '8px', fontWeight: 'bold' }} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#7C5CFF', 
                  borderColor: '#7C5CFF', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(124,92,255,0.08)',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
                labelStyle={{ color: '#FFFFFF' }}
                itemStyle={{ color: '#FFFFFF' }}
                formatter={(value, name, props) => [`${value}/10`, 'Mood']}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#7C5CFF" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#dashboardMatchGrad)" 
                name="Mood Level" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-gray-400 italic">No mood logs saved.</div>
        )}
      </div>
    </div>
  );
}
