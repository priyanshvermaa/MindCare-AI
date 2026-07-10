import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { useTheme } from '../context/ThemeContext';
import { useWater } from '../context/WaterContext';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts';
import { Heart, Smile, BookOpen, Flame, Award, FileText, RefreshCw, Sparkles, Check, ChevronRight, BarChart3, Activity, Brain, ClipboardList } from 'lucide-react';

const COLORS = ['#7C5CFF', '#A78BFA', '#CDB8FF', '#F43F5E', '#E2E8F0'];

// Custom Calendar Heatmap Component (drawn dynamically from last 15 weeks logs)
const AnalyticsCalendarHeatmap = ({ logs = [] }) => {
  const cols = 15;
  const rows = 7;
  const dataMap = new Map(logs.map(item => [item.date, item.count]));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (cols * 7) + 1);
  const dayOffset = startDate.getDay();
  const alignDays = dayOffset === 0 ? 6 : dayOffset - 1;
  startDate.setDate(startDate.getDate() - alignDays);

  const cells = [];
  for (let c = 0; c < cols; c++) {
    const colCells = [];
    for (let r = 0; r < rows; r++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + (c * 7) + r);
      const dateStr = cellDate.toISOString().split('T')[0];
      const count = dataMap.get(dateStr) || 0;
      colCells.push({ date: dateStr, count });
    }
    cells.push(colCells);
  }

  const getColorClass = (count) => {
    if (count === 0) return 'bg-[#FAFAFC] border border-[#ECE7FF]';
    if (count === 1) return 'bg-[#7C5CFF]/15 border border-[#7C5CFF]/10';
    if (count === 2) return 'bg-[#7C5CFF]/45 border border-[#7C5CFF]/20';
    if (count === 3) return 'bg-[#7C5CFF]/70 border border-[#7C5CFF]/30';
    return 'bg-[#7C5CFF] border border-[#7C5CFF]/60';
  };

  return (
    <div className="flex gap-2 items-start overflow-x-auto w-full select-none justify-center py-4">
      <div className="flex flex-col justify-between h-[84px] text-[8px] font-bold text-gray-450 pr-1 shrink-0 pt-0.5">
        <span>Mon</span>
        <span>Wed</span>
        <span>Fri</span>
        <span>Sun</span>
      </div>
      <div className="flex gap-1.5">
        {cells.map((col, cIdx) => (
          <div key={cIdx} className="flex flex-col gap-1.5">
            {col.map((cell, rIdx) => (
              <div
                key={rIdx}
                className={`w-2.5 h-2.5 rounded-sm transition-all duration-300 ${getColorClass(cell.count)}`}
                title={`${cell.date}: ${cell.count} logs`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Analytics() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLightMode } = useTheme();
  const [timeRange, setTimeRange] = useState('weekly'); // daily, weekly, monthly
  
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0 });
  const [moodData, setMoodData] = useState(null);
  const [journalData, setJournalData] = useState(null);
  const [wellnessData, setWellnessData] = useState(null);
  const [comprehensiveData, setComprehensiveData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dbRes, moodRes, journalRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/moods'),
        api.get('/analytics/journal')
      ]);

      setStreaks(dbRes.data.streaks);
      setWellnessData(dbRes.data.wellness);
      setMoodData(moodRes.data.analytics);
      setJournalData(journalRes.data.analytics);
      setComprehensiveData(dbRes.data.comprehensive);
    } catch (err) {
      console.error('Failed to load analytics datasets:', err);
      setError('Could not retrieve analytics telemetry records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);


  const handleExportPDF = () => {
    window.print();
  };

  const { waterSummary } = useWater();

  // Calculate radar data structure from wellness averages
  const radarData = wellnessData?.averages ? [
    { subject: 'Sleep Quality', A: Math.round(wellnessData.averages.avgSleep * 12.5), fullMark: 100 },
    { subject: 'Hydration', A: Math.round((wellnessData.averages.avgWater / (waterSummary?.goal || 2500)) * 100), fullMark: 100 },
    { subject: 'Mindfulness', A: Math.round((wellnessData.averages.avgMeditation / 30) * 100), fullMark: 100 },
    { subject: 'Mood Index', A: Math.round((moodData?.averages?.avgIntensity || 0) * 10), fullMark: 100 },
    { subject: 'Resilience Score', A: Math.round(wellnessData.averages.avgWellnessScore || 0), fullMark: 100 }
  ] : [];

  // Correlation analysis compilation
  const correlationData = wellnessData?.dailyHistory?.map(w => {
    return {
      date: w.date,
      WellnessScore: w.score,
      SleepTime: w.sleep,
      Waterml: w.water
    };
  }) || [];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B4B] flex font-poppins select-none">
      
      {/* Sidebar hidden when printing */}
      <div className="print:hidden">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-20'
      } print:pl-0`}>
        
        {/* Navigation hidden when printing */}
        <div className="print:hidden">
          <TopNav
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 text-left relative z-10">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight text-[#1E1B4B] flex items-center gap-2">
                <BarChart3 className="w-5.5 h-5.5 text-[#7C5CFF]" /> Enterprise Analytics & Insights
              </h1>
              <p className="text-xs text-gray-550 mt-1 font-semibold leading-relaxed">
                MongoDB aggregated insights, streaks, habits tracking, and clinical wellness correlation parameters.
              </p>
            </div>

            {/* Controls panel (hidden when printing) */}
            <div className="flex flex-wrap items-center gap-2.5 print:hidden">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-[#ECE7FF] text-xs text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] cursor-pointer transition-all font-semibold shadow-sm"
              >
                <option value="daily">Daily Analysis</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Overview</option>
              </select>


              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-[#A78BFA] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#7C5CFF]/15 transition-all"
              >
                <FileText className="w-3.5 h-3.5" /> Print / Save PDF
              </button>

              <button
                onClick={fetchAnalytics}
                className="p-2.5 rounded-xl border border-[#ECE7FF] bg-white text-gray-400 hover:text-[#7C5CFF] transition-all active:scale-95 shadow-sm"
                title="Refresh datasets"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-[24px] bg-white border border-[#ECE7FF]" />
              ))}
              <div className="col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <Skeleton className="h-[300px] rounded-[24px] bg-white border border-[#ECE7FF]" />
                <Skeleton className="h-[300px] rounded-[24px] bg-white border border-[#ECE7FF]" />
              </div>
            </div>
          ) : error ? (
            <div className="p-8 border border-rose-100 bg-rose-50 rounded-[24px] text-center text-rose-500 text-sm font-semibold max-w-lg mx-auto shadow-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-6 text-left">
              
              {/* 1. Statistics Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Wellness Score Card */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#ECE7FF] flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Wellness Index</span>
                    <h3 className="text-3xl font-black text-[#1E1B4B] tracking-tight">
                      {comprehensiveData?.wellnessScore || Math.round(wellnessData?.averages?.avgWellnessScore || 0)}%
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-xxs text-emerald-500 font-bold">▲ 8%</span>
                      <span className="text-[9px] text-gray-400 font-bold block">vs last week</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] shadow-sm shrink-0">
                    <Activity className="w-5.5 h-5.5" />
                  </div>
                </div>

                {/* Mental Health Score */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#ECE7FF] flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Mental Health Rating</span>
                    <h3 className="text-3xl font-black text-[#1E1B4B] tracking-tight">
                      {comprehensiveData?.mentalHealthScore ?? 0}%
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-xxs text-emerald-500 font-bold">▲ 12%</span>
                      <span className="text-[9px] text-gray-400 font-bold block">vs last week</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500 shadow-sm shrink-0">
                    <Heart className="w-5.5 h-5.5" />
                  </div>
                </div>

                {/* Productivity Rating */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#ECE7FF] flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Productivity Score</span>
                    <h3 className="text-3xl font-black text-[#1E1B4B] tracking-tight">
                      {comprehensiveData?.productivityScore ?? 0}%
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-xxs text-emerald-500 font-bold">▲ 5%</span>
                      <span className="text-[9px] text-gray-400 font-bold block">vs last week</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shadow-sm shrink-0">
                    <Brain className="w-5.5 h-5.5" />
                  </div>
                </div>

                {/* Habit Consistency */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#ECE7FF] flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Habits Consistency</span>
                    <h3 className="text-3xl font-black text-[#1E1B4B] tracking-tight">
                      {comprehensiveData?.habitConsistency || 0}%
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-xxs text-gray-400 font-bold">— 0%</span>
                      <span className="text-[9px] text-gray-400 font-bold block">vs last week</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                    <Flame className="w-5.5 h-5.5" />
                  </div>
                </div>
              </div>

              {/* 2. Visual Charts Row (Weekly Mood Trends & Distribution) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Weekly Mood Intensity (Line Chart) */}
                <div className="lg:col-span-8 bg-white rounded-[24px] border border-[#ECE7FF] p-6 flex flex-col justify-between h-[340px] shadow-sm text-left">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1E1B4B]">Weekly Mood Trends</h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Daily aggregated mood levels (1 to 5 index) over the last 7 days.</p>
                    </div>
                    <select className="bg-gray-50 border border-gray-150 rounded-lg py-1 px-2 text-[8px] font-black uppercase text-gray-500 focus:outline-none cursor-pointer">
                      <option>Last 7 Days</option>
                    </select>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={moodData?.weeklyTrend || []} margin={{ left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F0FF" />
                        <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis stroke="#6B7280" domain={[1, 5]} style={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#ECE7FF', borderRadius: 12, fontSize: 12, color: '#1E1B4B' }} />
                        <Area type="monotone" dataKey="intensity" name="Mood level" stroke="#7C5CFF" strokeWidth={3} fillOpacity={1} fill="url(#areaColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Mood Color Distribution (Pie Chart) */}
                <div className="lg:col-span-4 bg-white rounded-[24px] border border-[#ECE7FF] p-6 flex flex-col justify-between h-[340px] shadow-sm text-left">
                  <div className="mb-2">
                    <h3 className="text-sm font-extrabold text-[#1E1B4B]">Mood Distribution</h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Proportions of logged daily emotional states.</p>
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={moodData?.distribution || []}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {(moodData?.distribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#ECE7FF', borderRadius: 12, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered label */}
                    <div className="absolute flex flex-col justify-center items-center">
                      <span className="text-lg font-black text-[#1E1B4B]">{moodData?.averages?.totalLogs || 0}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Entries</span>
                    </div>
                  </div>

                  {/* Legends list */}
                  <div className="space-y-1 pt-2.5 border-t border-gray-100">
                    {(moodData?.distribution || []).slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-gray-500 font-semibold">{item.name}</span>
                        </div>
                        <span className="text-gray-900 font-black">{item.value} entries</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Third Row (Wellness Index Map, Sleep & Hydration Correlation, Calendar heatmap) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Radar Wellness Index Map */}
                <div className="lg:col-span-4 bg-white rounded-[24px] border border-[#ECE7FF] p-6 flex flex-col justify-between h-[340px] shadow-sm text-left">
                  <div className="mb-4">
                    <h3 className="text-sm font-extrabold text-[#1E1B4B]">Wellness Index Mapping</h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Multidimensional metric mapping: hydration, sleep, mood, and mindfulness logs.</p>
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    {radarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#F4F0FF" />
                          <PolarAngleAxis dataKey="subject" stroke="#6B7280" style={{ fontSize: 9, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#F4F0FF" style={{ fontSize: 9 }} />
                          <Radar name="Wellness Index" dataKey="A" stroke="#7C5CFF" fill="#7C5CFF" fillOpacity={0.15} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-xs text-gray-450 italic">Seed database data to load mapping</span>
                    )}
                  </div>
                </div>

                {/* Sleep vs Hydration correlation */}
                <div className="lg:col-span-4 bg-white rounded-[24px] border border-[#ECE7FF] p-6 flex flex-col justify-between h-[340px] shadow-sm text-left">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1E1B4B]">Sleep & Hydration Correlation</h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Comparing night sleep hours against daily fluid intake over time.</p>
                    </div>
                    <select className="bg-gray-50 border border-gray-150 rounded-lg py-1 px-2 text-[8px] font-black uppercase text-gray-500 focus:outline-none cursor-pointer">
                      <option>Last 7 Days</option>
                    </select>
                  </div>
                  <div className="flex-1 min-h-0">
                    {correlationData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={correlationData} margin={{ left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F4F0FF" />
                          <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: 9 }} />
                          <YAxis yAxisId="left" stroke="#7C5CFF" style={{ fontSize: 9 }} label={{ value: 'Sleep (hours)', angle: -90, position: 'insideLeft', fill: '#7C5CFF', fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#06B6D4" style={{ fontSize: 9 }} label={{ value: 'Water (ml)', angle: 90, position: 'insideRight', fill: '#06B6D4', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#ECE7FF', borderRadius: 12, fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                          <Line yAxisId="left" type="monotone" dataKey="SleepTime" name="Sleep (h)" stroke="#7C5CFF" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          <Line yAxisId="right" type="monotone" dataKey="Waterml" name="Water (ml)" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-450 italic">Seed data to plot correlation</div>
                    )}
                  </div>
                </div>

                {/* Calendar Heatmap grid */}
                <div className="lg:col-span-4 bg-white rounded-[24px] border border-[#ECE7FF] p-6 flex flex-col justify-between h-[340px] shadow-sm text-left">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1E1B4B]">Wellness Log Consistency Map</h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Interactive visualizer mapping daily activity logs.</p>
                    </div>
                    <select className="bg-gray-50 border border-gray-150 rounded-lg py-1 px-2 text-[8px] font-black uppercase text-gray-500 focus:outline-none cursor-pointer">
                      <option>Last 15 Weeks</option>
                    </select>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {wellnessData ? (
                      <div className="w-full">
                        <AnalyticsCalendarHeatmap logs={wellnessData.dailyHistory.map(d => ({ date: d.date, count: d.score > 75 ? 4 : d.score > 50 ? 2 : 1 }))} />
                        <div className="flex items-center justify-center gap-3 text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mt-4">
                          <span>Less Consistent</span>
                          <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#FAFAFC] border border-[#ECE7FF]" />
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#7C5CFF]/15" />
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#7C5CFF]/45" />
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#7C5CFF]" />
                          </div>
                          <span>More Consistent</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-450 italic">Heatmap empty</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row (Summary & Monthly Report) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Weekly summary */}
                <div className="bg-white rounded-[24px] border border-[#ECE7FF] p-6 text-left shadow-sm flex flex-col justify-between min-h-[170px]">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1E1B4B] mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4.5 h-4.5 text-[#7C5CFF]" /> Weekly Wellness Summary
                    </h4>
                    <p className="text-xs text-gray-550 leading-relaxed font-semibold">
                      {comprehensiveData?.weeklySummary || 'Weekly telemetry is compiling. Check off your daily targets to construct health logs.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                    <span>Stress levels avg:</span>
                    <span className="text-[#7C5CFF] font-black">
                      {moodData?.averages?.avgStress ? (moodData.averages.avgStress).toFixed(1) : '0'} / 10
                    </span>
                  </div>
                </div>

                {/* Monthly report */}
                <div className="bg-white rounded-[24px] border border-[#ECE7FF] p-6 text-left shadow-sm flex flex-col justify-between min-h-[170px]">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#1E1B4B] mb-3 flex items-center gap-1.5">
                      <ClipboardList className="w-4.5 h-4.5 text-[#7C5CFF]" /> Monthly Wellness Report
                    </h4>
                    <p className="text-xs text-gray-550 leading-relaxed font-semibold">
                      {comprehensiveData?.monthlyReport || 'Monthly statistics review is analyzing. Keep logging CBT entries to build cognitive distortions graphs.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                    <span>Resilience Score:</span>
                    <span className="text-[#7C5CFF] font-black">
                      {comprehensiveData?.wellnessScore || 0} / 100
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
