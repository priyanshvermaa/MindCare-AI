import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { Skeleton } from '../components/ui/Skeleton';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Smile, Briefcase, Heart, Users, BookOpen, Activity, MoreHorizontal, 
  Trash2, Edit2, Calendar, HelpCircle, ArrowRight, Sparkles, Flower2, BarChart2 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import meditatingWomanFacingImg from '../assets/meditating_woman_facing.png';

// Emoji sets
const EMOJIS = [
  { label: 'Terrible', emoji: '😡', color: '#F43F5E', bg: 'bg-rose-50 border-rose-100 text-rose-500', backendVal: '😭 Very Sad' },
  { label: 'Bad', emoji: '☹️', color: '#F59E0B', bg: 'bg-amber-50 border-amber-100 text-amber-500', backendVal: '😔 Low' },
  { label: 'Okay', emoji: '😐', color: '#EAB308', bg: 'bg-yellow-50 border-yellow-100 text-yellow-500', backendVal: '😐 Neutral' },
  { label: 'Good', emoji: '😊', color: '#10B981', bg: 'bg-emerald-50 border-emerald-100 text-emerald-500', backendVal: '😊 Happy' },
  { label: 'Great', emoji: '😄', color: '#06B6D4', bg: 'bg-cyan-50 border-cyan-100 text-cyan-500', backendVal: '😍 Amazing' }
];

const backendToFrontendMood = {
  '😭 Very Sad': 'Terrible',
  '😢 Sad': 'Terrible',
  '😔 Low': 'Bad',
  '😐 Neutral': 'Okay',
  '🙂 Okay': 'Okay',
  '😊 Happy': 'Good',
  '😄 Very Happy': 'Good',
  '🤩 Excited': 'Great',
  '😌 Calm': 'Great',
  '😍 Amazing': 'Great'
};

const frontendToBackendMood = {
  'Terrible': '😭 Very Sad',
  'Bad': '😔 Low',
  'Okay': '😐 Neutral',
  'Good': '😊 Happy',
  'Great': '😍 Amazing'
};

const CONTRIBUTOR_ITEMS = [
  { label: 'Work', icon: Briefcase },
  { label: 'Health', icon: Heart },
  { label: 'Relationships', icon: Users },
  { label: 'Study', icon: BookOpen },
  { label: 'Exercise', icon: Activity },
  { label: 'Other', icon: MoreHorizontal }
];

export default function MoodTracker() {
  const navigate = useNavigate();

  // Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Form States
  const [selectedMood, setSelectedMood] = useState('Good');
  const [intensity, setIntensity] = useState(7);
  const [selectedContributors, setSelectedContributors] = useState(['Health']);
  const [note, setNote] = useState('');
  
  // Edit States
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Feedback States
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Data Lists
  const [logsList, setLogsList] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await api.get('/moods', {
        params: { limit: 10 }
      });
      if (response.data && response.data.logs) {
        setLogsList(response.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSelectContributor = (label) => {
    if (selectedContributors.includes(label)) {
      setSelectedContributors(selectedContributors.filter(c => c !== label));
    } else {
      setSelectedContributors([...selectedContributors, label]);
    }
  };

  const handleSaveMood = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const backendMood = frontendToBackendMood[selectedMood] || '😐 Neutral';

    // Map stress, anxiety, energy, and motivation contextually based on selected mood
    let stressLevel = 5;
    let anxietyLevel = 5;
    let energyLevel = 5;
    let motivationLevel = 5;

    if (selectedMood === 'Great' || selectedMood === 'Good') {
      stressLevel = 2;
      anxietyLevel = 2;
      energyLevel = 8;
      motivationLevel = 8;
    } else if (selectedMood === 'Bad' || selectedMood === 'Terrible') {
      stressLevel = 8;
      anxietyLevel = 8;
      energyLevel = 3;
      motivationLevel = 3;
    }

    const payload = {
      mood: backendMood,
      intensity: parseInt(intensity, 10),
      stressLevel,
      anxietyLevel,
      energyLevel,
      motivationLevel,
      sleepHours: 8,
      waterIntake: 1500,
      meditationMinutes: 10,
      tags: selectedContributors,
      notes: note
    };

    try {
      if (isUpdateMode) {
        await api.put(`/moods/${editingId}`, payload);
        setSuccessMsg('Mood log successfully updated!');
        cancelUpdateMode();
      } else {
        await api.post('/moods', payload);
        setSuccessMsg('Daily mood log successfully saved!');
        resetForm();
      }
      fetchLogs();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save mood entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    const fMood = backendToFrontendMood[log.mood] || 'Okay';
    setSelectedMood(fMood);
    setIntensity(log.intensity);
    setSelectedContributors(log.tags || ['Health']);
    setNote(log.notes || '');
    setEditingId(log._id);
    setIsUpdateMode(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mood log?')) return;
    try {
      await api.delete(`/moods/${id}`);
      fetchLogs();
      if (isUpdateMode && editingId === id) {
        cancelUpdateMode();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const cancelUpdateMode = () => {
    setIsUpdateMode(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMood('Good');
    setIntensity(7);
    setSelectedContributors(['Health']);
    setNote('');
  };

  // Setup formatted chart data
  const chartData = [...logsList]
    .reverse()
    .slice(-7)
    .map(log => {
      const date = new Date(log.createdAt);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        name: dayName,
        score: log.score || 5
      };
    });

  // Current Date display helper
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex font-poppins relative">
      
      {/* Sidebar fixed */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation header */}
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 text-left relative z-10">
          
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-50 pb-3">
            <div className="text-left select-none">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7C5CFF] block mb-2">Mood Tracker</span>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Log Your Mood</h1>
              <p className="text-xs text-gray-500 font-semibold mt-2.5">Track how you feel and discover patterns over time.</p>
            </div>

            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-[#E9E2FF] bg-[#FAF8FF] hover:bg-[#F3EFFF] text-[#7C5CFF] font-extrabold text-[11px] uppercase tracking-wider transition-colors shadow-sm shrink-0"
            >
              <BarChart2 className="w-4 h-4" /> View Analytics
            </button>
          </div>

          {/* Feedback Toasts */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> {errorMsg}
            </div>
          )}

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Card: Form */}
            <div className="lg:col-span-7 bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6.5 shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between">
              <form onSubmit={handleSaveMood} className="space-y-6">
                
                {/* 1. Emoji deck */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider pl-0.5">How are you feeling right now?</h3>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {EMOJIS.map((em) => {
                      const isSelected = selectedMood === em.label;
                      return (
                        <button
                          type="button"
                          key={em.label}
                          onClick={() => setSelectedMood(em.label)}
                          className={`p-4 rounded-[20px] border flex flex-col items-center justify-center gap-2 transition-all relative ${
                            isSelected
                              ? 'border-[#7C5CFF] bg-[#7C5CFF]/4 shadow-sm scale-102'
                              : 'border-[#E9E2FF]/50 bg-white hover:bg-gray-50/50'
                          }`}
                        >
                          <span className="text-3xl select-none">{em.emoji}</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-[#7C5CFF]' : 'text-gray-400'}`}>
                            {em.label}
                          </span>
                          
                          {/* Check badge on top right */}
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#7C5CFF] text-white flex items-center justify-center text-[7px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Slider */}
                <div className="space-y-3 pl-0.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      Mood Intensity <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
                    </span>
                    <span className="text-lg font-black text-[#7C5CFF]">{intensity}/10</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold leading-none">On a scale of 1 to 10</p>
                  
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                    className="w-full accent-[#7C5CFF] h-1.5 bg-[#F3EFFF] rounded-lg cursor-pointer"
                  />
                </div>

                {/* 3. Contributors selection chips */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider pl-0.5">What's contributing to your mood? <span className="text-[9px] text-gray-400 font-semibold">(Optional)</span></h3>
                  
                  <div className="flex flex-wrap gap-2.5 pl-0.5">
                    {CONTRIBUTOR_ITEMS.map((ct) => {
                      const Icon = ct.icon;
                      const isSelected = selectedContributors.includes(ct.label);
                      return (
                        <button
                          type="button"
                          key={ct.label}
                          onClick={() => handleSelectContributor(ct.label)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-extrabold uppercase tracking-wider transition-all relative ${
                            isSelected
                              ? 'bg-[#7C5CFF]/8 border-[#7C5CFF] text-[#7C5CFF]'
                              : 'bg-white border-[#E9E2FF]/60 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {ct.label}
                          
                          {/* Check badge */}
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFF] text-white flex items-center justify-center text-[5px] font-bold shrink-0">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Notes Textarea */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider pl-0.5">Add a note <span className="text-[9px] text-gray-400 font-semibold">(Optional)</span></h3>
                  <div className="relative pl-0.5">
                    <textarea
                      maxLength="300"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Write your thoughts..."
                      className="w-full h-24 p-3.5 border border-[#E9E2FF]/85 rounded-2xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all resize-none"
                    />
                    <span className="absolute bottom-3 right-3 text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                      {note.length}/300
                    </span>
                  </div>
                </div>

                {/* Footer submit & edit date button */}
                <div className="flex justify-between items-center pt-2.5 pl-0.5">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-150 text-[10px] text-gray-500 font-bold cursor-default select-none shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Today, {formattedToday.split(',').slice(1,3).join(',')}
                  </div>

                  <div className="flex gap-2">
                    {isUpdateMode && (
                      <button
                        type="button"
                        onClick={cancelUpdateMode}
                        className="px-5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#7C5CFF]/15 hover:scale-[1.01] active:scale-[0.99] transition-all shrink-0 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : '✓ Save Mood'}
                    </button>
                  </div>
                </div>

              </form>
            </div>

            {/* Right Column: History & Logs */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-8">
              
              {/* Top: Mood History Chart */}
              <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between flex-1 min-h-[300px]">
                <div className="flex justify-between items-center pb-2 pl-0.5">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Mood History</h3>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-[#FAF8FF] border border-[#E9E2FF]/40 rounded-xl px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-[#7C5CFF] focus:outline-none cursor-pointer"
                  >
                    <option value="week">This Week</option>
                  </select>
                </div>

                <div className="h-44 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#FAF9FF" vertical={false} />
                        <XAxis dataKey="name" stroke="#A98CFF" style={{ fontSize: '8px', fontWeight: 'bold' }} tickLine={false} />
                        <YAxis stroke="#A98CFF" domain={[1, 10]} ticks={[0, 2.5, 5, 7.5, 10]} style={{ fontSize: '8px', fontWeight: 'bold' }} tickLine={false} />
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
                          formatter={(value) => [`${value}/10`, 'Mood']}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#7C5CFF"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#7C5CFF', strokeWidth: 2, stroke: '#FFFFFF' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400 italic">No mood logs saved yet.</div>
                  )}
                </div>

                {/* Score threshold scale legend */}
                <div className="flex justify-between items-center text-[8px] font-black uppercase text-[#73768F] border-t border-gray-50 pt-4 px-1 tracking-wider">
                  <div className="flex items-center gap-1"><span>😡</span> <span>Terrible <span className="font-medium text-gray-400">1-2</span></span></div>
                  <span className="text-gray-300 font-medium font-serif">&gt;</span>
                  <div className="flex items-center gap-1"><span>☹️</span> <span>Bad <span className="font-medium text-gray-400">3-4</span></span></div>
                  <span className="text-gray-300 font-medium font-serif">&gt;</span>
                  <div className="flex items-center gap-1"><span>😐</span> <span>Okay <span className="font-medium text-gray-400">5-6</span></span></div>
                  <span className="text-gray-300 font-medium font-serif">&gt;</span>
                  <div className="flex items-center gap-1"><span>😊</span> <span>Good <span className="font-medium text-gray-400">7-8</span></span></div>
                  <span className="text-gray-300 font-medium font-serif">&gt;</span>
                  <div className="flex items-center gap-1"><span>😄</span> <span>Great <span className="font-medium text-gray-400">9-10</span></span></div>
                </div>
              </div>

              {/* Bottom: Recent Logs List */}
              <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between flex-1">
                <div className="flex justify-between items-center pb-4 pl-0.5">
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Recent Logs</h3>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="text-[9px] text-[#7C5CFF] hover:underline font-extrabold uppercase tracking-wider"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                  {loadingLogs ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-9 w-32 rounded-xl" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                      </div>
                    ))
                  ) : logsList.length > 0 ? (
                    logsList.slice(0, 5).map((log, index) => {
                      const fMood = backendToFrontendMood[log.mood] || 'Okay';
                      const emObj = EMOJIS.find(e => e.label === fMood);
                      const displayDate = new Date(log.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });
                      const displayTime = new Date(log.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      // Format tags beautifully
                      const logTags = log.tags && log.tags.length > 0 ? log.tags : ['Health'];

                      return (
                        <div
                          key={log._id || index}
                          className="flex items-center justify-between p-2 rounded-2xl border border-[#E9E2FF]/20 bg-[#FAF9FF]/20"
                        >
                          {/* Emoji & Type */}
                          <div className="flex items-center gap-3 w-[26%] shrink-0">
                            <span className="text-xl select-none">{emObj?.emoji || '😐'}</span>
                            <span className="font-extrabold text-xs text-gray-900">{fMood}</span>
                          </div>

                          {/* Intensity score fraction */}
                          <div className="text-left w-[12%] shrink-0">
                            <span className="text-xs font-black text-gray-800">{log.intensity}/10</span>
                          </div>

                          {/* Chips */}
                          <div className="flex flex-wrap gap-1.5 w-[38%] overflow-hidden shrink-0">
                            {logTags.slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-[#7C5CFF]/6 border border-[#7C5CFF]/10 rounded-lg text-[8px] font-extrabold uppercase text-[#7C5CFF] tracking-wider"
                              >
                                {t}
                              </span>
                            ))}
                          </div>

                          {/* Timestamps */}
                          <div className="text-right w-[16%] shrink-0">
                            <span className="text-[9px] text-[#73768F] font-bold block">{displayDate}</span>
                            <span className="text-[7.5px] text-gray-400 font-semibold block mt-0.5 uppercase tracking-wider">{displayTime}</span>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-1.5 w-[8%] shrink-0 justify-end">
                            <button
                              onClick={() => handleEdit(log)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#7C5CFF] transition-all"
                              title="Edit Log"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(log._id)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-400 italic text-center py-8">No logged emotions found. Fill the form to begin tracking!</div>
                  )}
                </div>

              </div>

            </div>

          </div>

          {/* Bottom Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#FAF9FF] via-[#7C5CFF]/5 to-[#FAF9FF] border border-[#E9E2FF]/30 rounded-[24px] p-6.5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_4px_25px_rgba(124,92,255,0.01)] text-left">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] shrink-0 shadow-sm">
                <Flower2 className="w-5.5 h-5.5 fill-[#7C5CFF]/10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-[#1D1B3A] tracking-tight">Consistency is key!</h4>
                <p className="text-[11px] text-gray-500 font-semibold leading-relaxed max-w-2xl">
                  Tracking your mood daily helps you understand emotional patterns and build better mental wellness habits.
                </p>
              </div>
            </div>

            {/* Banner Illustration */}
            <div className="md:w-32 flex items-center justify-center shrink-0 select-none">
              <img
                src={meditatingWomanFacingImg}
                alt="Meditate outline"
                className="w-20 h-20 object-contain transform translate-y-1 pointer-events-none"
              />
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
