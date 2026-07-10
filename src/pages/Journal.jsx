import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Search, Heart, Pin, Trash2, Edit3, Eye,
  Sparkles, Brain, MessageCircle, Lightbulb, Calendar, Clock, Type, FileText,
  ChevronLeft, ChevronRight, X, Save, Loader2, Check,
  TrendingUp, BarChart3, Zap, ArrowUpDown, SlidersHorizontal, MoreHorizontal, Award,
  LayoutGrid, RefreshCw, Feather, HelpCircle, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { Skeleton } from '../components/ui/Skeleton';

const API = '/journals';

const MOODS = [
  { emoji: '😭', label: 'Very Sad', score: 1 },
  { emoji: '😢', label: 'Sad', score: 2 },
  { emoji: '😔', label: 'Low', score: 3 },
  { emoji: '😐', label: 'Neutral', score: 4 },
  { emoji: '🙂', label: 'Okay', score: 5 },
  { emoji: '😊', label: 'Happy', score: 6 },
  { emoji: '😄', label: 'Very Happy', score: 7 },
  { emoji: '🤩', label: 'Excited', score: 8 },
  { emoji: '😌', label: 'Calm', score: 9 },
  { emoji: '😍', label: 'Amazing', score: 10 },
];

const CATEGORIES = [
  { value: 'free-writing', label: 'Free Writing', icon: '✍️', color: 'from-[#7C5CFF] to-[#A78BFA]' },
  { value: 'gratitude', label: 'Gratitude', icon: '🙏', color: 'from-amber-400 to-orange-500' },
  { value: 'daily-reflection', label: 'Daily Reflection', icon: '🪞', color: 'from-sky-400 to-blue-500' },
  { value: 'cbt', label: 'CBT Journal', icon: '🧠', color: 'from-emerald-400 to-teal-500' },
];

const TEMPLATES = {
  'free-writing': { title: '', content: '' },
  'gratitude': {
    title: 'Gratitude Journal',
    content: `**3 things I'm grateful for today:**\n\n1. \n2. \n3. \n\n**Why these matter to me:**\n\n\n**One person I appreciate today:**\n\n`,
  },
  'daily-reflection': {
    title: 'Daily Reflection',
    content: `**How am I feeling right now?**\n\n\n**What went well today?**\n\n\n**What challenged me?**\n\n\n**What did I learn?**\n\n\n**What will I do differently tomorrow?**\n\n`,
  },
  'cbt': {
    title: 'CBT Thought Record',
    content: `**Situation:** What happened?\n\n\n**Automatic Thought:** What went through my mind?\n\n\n**Emotions:** What did I feel? (Rate intensity 0-100)\n\n\n**Evidence For:** What supports this thought?\n\n\n**Evidence Against:** What contradicts this thought?\n\n\n**Balanced Thought:** A more realistic perspective:\n\n\n**Outcome:** How do I feel now? (Rate 0-100)\n\n`,
  },
};

// Markdown Preview helper
function MarkdownPreview({ content }) {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) {
          return <h1 key={idx} className="text-lg font-black text-gray-900 mt-3">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={idx} className="text-base font-extrabold text-gray-900 mt-2">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={idx} className="font-bold text-gray-800 text-xs mt-1">{line.replace(/\*\*/g, '')}</p>;
        }
        return <p key={idx} className="text-gray-650 text-xs leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export default function Journal() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // States
  const [entries, setEntries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('All Entries'); // 'All Entries', 'Drafts', 'Favorites'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  
  // Date filter from calendar widget click
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Editor states
  const [editorMode, setEditorMode] = useState('list'); // 'list', 'create', 'edit', 'view'
  const [viewEntry, setViewEntry] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('free-writing');
  const [selectedMood, setSelectedMood] = useState(null);
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('private');
  
  // UI states
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // AI reflection tool states
  const [aiLoading, setAiLoading] = useState({});
  const [aiResults, setAiResults] = useState({});

  // Character counter
  const charCount = content ? content.length : 0;
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await api.get(`${API}/analytics`);
      if (response.data && response.data.analytics) {
        setAnalytics(response.data.analytics);
      }
    } catch (err) {
      console.warn('Analytics loading failed:', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchEntries = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setPage(1);
    }
    try {
      const queryParams = {
        search: searchTerm,
        page: isLoadMore ? page + 1 : 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: selectedSort === 'oldest' ? 'asc' : 'desc'
      };

      if (selectedTab === 'Favorites') {
        queryParams.favorite = true;
      }
      if (selectedCategory) {
        queryParams.category = selectedCategory;
      }

      const response = await api.get(API, { params: queryParams });
      
      const list = response.data?.entries || response.data?.journals || [];
      const pagination = response.data?.pagination || {};
      const pages = pagination.pages || response.data?.totalPages || 1;
      const currentPage = pagination.page || response.data?.page || 1;

      if (isLoadMore) {
        setEntries(prev => [...prev, ...list]);
        setPage(prev => prev + 1);
      } else {
        setEntries(list);
      }
      setHasMore(currentPage < pages);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load journal logs.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedTab, selectedCategory, selectedSort, page]);

  useEffect(() => {
    fetchEntries(false);
  }, [selectedTab, selectedCategory, selectedSort]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchEntries(false);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchAnalytics();
  }, [editorMode]);

  // CRUD actions
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please write a title and content.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
      mood: selectedMood,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      visibility
    };

    try {
      if (editorMode === 'edit') {
        await api.put(`${API}/${viewEntry._id}`, payload);
        setSuccessMsg('Journal entry successfully updated!');
      } else {
        await api.post(API, payload);
        setSuccessMsg('New journal entry created!');
      }
      resetForm();
      setEditorMode('list');
      fetchEntries(false);
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await api.delete(`${API}/${id}`);
      setSuccessMsg('Entry successfully deleted.');
      fetchEntries(false);
      fetchAnalytics();
      if (editorMode === 'view' && viewEntry?._id === id) {
        setEditorMode('list');
        setViewEntry(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleFavorite = async (id) => {
    try {
      const response = await api.patch(`${API}/${id}/favorite`);
      if (response.data.success) {
        setSuccessMsg(response.data.favorite ? 'Added to favorites!' : 'Removed from favorites.');
        fetchEntries(false);
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  // Prompts triggers creation helper
  const handlePromptClick = (promptText) => {
    setTitle(promptText);
    setContent('');
    setCategory('free-writing');
    setSelectedMood(null);
    setTags('');
    setEditorMode('create');
  };

  // Form toggle states
  const startCreate = () => {
    resetForm();
    setEditorMode('create');
  };

  const startEdit = (entry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category || 'free-writing');
    setSelectedMood(entry.mood);
    setTags(entry.tags ? entry.tags.join(', ') : '');
    setVisibility(entry.visibility || 'private');
    setViewEntry(entry);
    setEditorMode('edit');
  };

  const startView = (entry) => {
    setViewEntry(entry);
    setEditorMode('view');
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('free-writing');
    setSelectedMood(null);
    setTags('');
    setVisibility('private');
    setViewEntry(null);
    setPreview(false);
  };

  const resetEditor = () => {
    setEditorMode('list');
    resetForm();
  };

  const applyTemplate = (catVal) => {
    setCategory(catVal);
    const templ = TEMPLATES[catVal];
    if (templ && !content) {
      setTitle(templ.title);
      setContent(templ.content);
    }
  };

  // Calendar logic
  const getDaysInMonth = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();

    const blankCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align Mon as first col
    const blanks = Array(blankCount).fill(null);
    const numbers = Array.from({ length: daysCount }, (_, i) => i + 1);

    return [...blanks, ...numbers];
  };

  // Check if journal exists on day
  const getDayMarker = (day) => {
    if (!day) return null;
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // We mock check against entries or fallback list
    const hasLog = entries.some(e => new Date(e.createdAt).toDateString() === new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).toDateString());
    return hasLog;
  };

  // AI copilot reflections calls
  const handleAI = async (id, type) => {
    const key = `${id}_${type}`;
    setAiLoading(prev => ({ ...prev, [key]: true }));
    try {
      const response = await api.post(`${API}/${id}/ai/${type}`);
      setAiResults(prev => ({
        ...prev,
        [key]: response.data
      }));
    } catch (err) {
      setAiResults(prev => ({
        ...prev,
        [key]: { error: err.response?.data?.message || 'Reflective tool analysis failed.' }
      }));
    } finally {
      setAiLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex font-poppins relative select-none">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation Top bar */}
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 text-left relative z-10">

          {/* Feedback alerts */}
          <AnimatePresence>
            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> {successMsg}
                </div>
              </motion.div>
            )}
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> {errorMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 1. JOURNAL TIMELINE LISTING MODE ──────────────── */}
          {editorMode === 'list' && (
            <div className="space-y-6 md:space-y-8">
              
              {/* Header Title block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-50 pb-2">
                <div className="text-left select-none">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">Your Journal ✨</h1>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">Reflect, express, and grow. Your thoughts matter.</p>
                </div>

                <button
                  onClick={startCreate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#7C5CFF]/15 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" /> New Entry
                </button>
              </div>

              {/* Stats row cards */}
              {(() => {
                const statsObj = analytics || {
                  totalEntries: 0,
                  currentStreak: 0,
                  avgWords: 0,
                  weeklyCount: 0,
                  favoritesCount: 0
                };
                const reflectionScore = statsObj.totalEntries > 0 ? Math.min(100, Math.round((statsObj.weeklyCount / 3) * 100)) : 0;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-5">
                    
                    {/* Total Entries */}
                    <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[125px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-xl bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] shrink-0">
                          <BookOpen className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Total Entries</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <span className="text-2.5xl font-black text-gray-900 leading-none block">{statsObj.totalEntries}</span>
                        <span className="text-[9px] text-gray-400 font-extrabold block">This Month</span>
                      </div>
                    </div>

                    {/* Streak */}
                    <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[125px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                          <Feather className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Writing Streak</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <span className="text-2.5xl font-black text-gray-900 leading-none block flex items-center gap-1">
                          {statsObj.currentStreak} Days <span className="text-xs text-emerald-500">🔥</span>
                        </span>
                        <span className="text-[9px] text-emerald-500 font-extrabold block">Keep it going!</span>
                      </div>
                    </div>

                    {/* Average Words */}
                    <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[125px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                          <Type className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Average Words</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <span className="text-2.5xl font-black text-gray-900 leading-none block">{statsObj.avgWords}</span>
                        <span className="text-[9px] text-gray-400 font-extrabold block">Per Entry</span>
                      </div>
                    </div>

                    {/* Reflection Score */}
                    <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[125px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                          <Heart className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Reflection Score</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <span className="text-2.5xl font-black text-gray-900 leading-none block">{reflectionScore}%</span>
                        <span className="text-[9px] text-emerald-500 font-extrabold flex items-center gap-1">
                          {statsObj.weeklyCount} entries <span className="text-gray-400 font-semibold">This Week</span>
                        </span>
                      </div>
                    </div>

                    {/* Favorite Entries */}
                    <div className="bg-white border border-[#E9E2FF]/60 p-5 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col justify-between min-h-[125px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                          <Award className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[9px] font-extrabold text-[#73768F] uppercase tracking-wider">Favorite Entries</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <span className="text-2.5xl font-black text-gray-900 leading-none block">{statsObj.favoritesCount}</span>
                        <span className="text-[9px] text-gray-400 font-extrabold block">This Month</span>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full bg-[#FAFAFC] p-2.5 rounded-[24px] border border-[#E9E2FF]/55 select-none overflow-hidden">
                <div className="flex items-center gap-2 bg-[#F1EEFF]/40 p-1.5 rounded-2xl border border-[#E9E2FF]/30 w-full sm:w-auto shrink-0">
                  {['All Entries', 'Favorites'].map(tab => {
                    const isActive = selectedTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-6 py-2 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap min-w-[120px] text-center select-none ${
                          isActive
                            ? 'bg-white text-[#7C5CFF] font-extrabold shadow-sm border border-[#E9E2FF]/20'
                            : 'text-gray-500 hover:text-[#7C5CFF]'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56 select-text">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search journals..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full h-10 bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all font-semibold shadow-sm"
                    />
                  </div>

                  <select
                    value={selectedSort}
                    onChange={e => setSelectedSort(e.target.value)}
                    className="h-10 bg-white border border-[#E5E7EB] text-xs text-gray-500 font-extrabold rounded-xl px-4 focus:outline-none cursor-pointer shadow-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
              </div>

              {/* 2-column list row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Timeline */}
                <div className="lg:col-span-8 space-y-6">
                  {loading && entries.length === 0 ? (
                    <div className="space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                          <Skeleton className="h-32 w-full rounded-[24px]" />
                        </div>
                      ))}
                    </div>
                  ) : entries.length > 0 ? (
                    <div className="relative pl-8 border-l border-[#E9E2FF] space-y-6 text-left">
                      {entries.map((entry, idx) => {
                        const dateObj = new Date(entry.createdAt);
                        const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                        const day = dateObj.getDate();
                        const isToday = new Date().toDateString() === dateObj.toDateString();

                        return (
                          <div key={entry._id || idx} className="relative group select-none">
                            {/* Marker line point */}
                            <div className="absolute -left-[37px] top-6 w-4.5 h-4.5 rounded-full bg-white border-[3px] border-[#7C5CFF] flex items-center justify-center shadow-sm" />
                            
                            {/* Date stack on the left */}
                            <div className="absolute -left-20 top-2 text-right w-14 pr-1">
                              <span className="text-[9px] font-black text-gray-400 block tracking-widest leading-none">{month}</span>
                              <span className="text-[17px] font-black text-gray-800 block mt-1 tracking-tight leading-none">{day}</span>
                              {isToday && <span className="text-[8px] font-bold text-[#7C5CFF] uppercase block mt-1">Today</span>}
                            </div>

                            {/* Timeline card */}
                            <div className="bg-white border border-[#E9E2FF]/60 hover:border-[#7C5CFF]/30 p-6 rounded-[24px] shadow-[0_4px_20px_rgba(124,92,255,0.015)] hover:shadow-md transition-all flex flex-col justify-between gap-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1.5 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 
                                      onClick={() => startView(entry)}
                                      className="font-black text-base text-gray-900 cursor-pointer hover:text-[#7C5CFF] transition-colors truncate max-w-sm"
                                    >
                                      {entry.title}
                                    </h4>
                                    
                                    <span className="px-2 py-0.5 rounded-md bg-[#7C5CFF]/8 text-[#7C5CFF] text-[8.5px] font-black uppercase tracking-wider shrink-0 mt-0.5">
                                      {entry.category === 'gratitude' ? 'Gratitude' :
                                       entry.category === 'daily-reflection' ? 'Reflection' :
                                       entry.category === 'cbt' ? 'CBT Thought' : 'Personal Growth'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-[11px] text-gray-500 font-semibold leading-relaxed line-clamp-2">
                                    {entry.content.replace(/[*#]/g, '').substring(0, 180)}...
                                  </p>
                                </div>

                                {/* Header tags & toggle favorites */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleFavorite(entry._id)}
                                    className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                                      entry.favorite
                                        ? 'bg-rose-50 border-rose-100 text-rose-500'
                                        : 'bg-white border-gray-150 text-gray-400 hover:text-[#7C5CFF]'
                                    }`}
                                  >
                                    <Heart className={`w-3.5 h-3.5 ${entry.favorite ? 'fill-rose-500' : ''}`} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(entry._id)}
                                    className="w-8 h-8 rounded-xl border border-gray-150 hover:border-rose-200 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-500 flex items-center justify-center transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-gray-50 pt-3.5 mt-1 select-none">
                                <div className="flex items-center gap-4 text-[9px] text-[#73768F] font-extrabold uppercase tracking-wider">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-gray-300" /> {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span>•</span>
                                  <span>{entry.wordCount} words</span>
                                  {entry.mood && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-500 flex items-center gap-1">{entry.mood}</span>
                                    </>
                                  )}
                                </div>

                                <button
                                  onClick={() => startView(entry)}
                                  className="px-4.5 py-1.5 rounded-xl bg-[#7C5CFF]/8 hover:bg-[#7C5CFF] text-[#7C5CFF] hover:text-white font-extrabold text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-10 text-center space-y-4">
                      <BookOpen className="w-12 h-12 text-gray-350 mx-auto" />
                      <h4 className="font-extrabold text-sm text-gray-900">No journal entries found</h4>
                      <button
                        onClick={startCreate}
                        className="px-5 py-2.5 rounded-xl bg-[#7C5CFF] text-white font-extrabold text-xs uppercase tracking-wider shadow"
                      >
                        Create Your First Journal
                      </button>
                    </div>
                  )}

                  {/* Paginator */}
                  {hasMore && (
                    <div className="flex justify-center pt-2 select-none">
                      <button
                        onClick={() => fetchEntries(true)}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[#E9E2FF] bg-white hover:bg-gray-50 text-[#7C5CFF] font-extrabold text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Load More Entries
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4">
                  
                  {/* Calendar Widget */}
                  <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(124,92,255,0.02)] text-left flex flex-col justify-between w-full">
                    <div>
                      <div className="flex justify-between items-center pb-4 select-none">
                        <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">Journal Calendar</h4>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                            className="p-1.5 rounded-lg border border-gray-150 hover:bg-gray-50 text-gray-400"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                            {calendarMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                          <button 
                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                            className="p-1.5 rounded-lg border border-gray-150 hover:bg-gray-50 text-gray-400"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Weeks label */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[8.5px] font-black text-gray-400 uppercase tracking-widest mb-3.5 select-none">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                           <span key={i}>{d}</span>
                        ))}
                      </div>

                      {/* Days grid */}
                      <div className="grid grid-cols-7 gap-1.5 text-center justify-items-center">
                        {getDaysInMonth().map((day, idx) => {
                          if (day === null) return <div key={`blank-${idx}`} className="w-7 h-7" />;
                          
                          const hasLog = getDayMarker(day);
                          const isToday = new Date().getDate() === day && new Date().getMonth() === calendarMonth.getMonth() && new Date().getFullYear() === calendarMonth.getFullYear();

                          return (
                            <button
                              key={day}
                              disabled={!hasLog}
                              onClick={() => {
                                const selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                                const match = entries.find(e => new Date(e.createdAt).toDateString() === selectedDate.toDateString());
                                if (match) startView(match);
                              }}
                              className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10.5px] font-black tracking-tight transition-all relative ${
                                isToday
                                  ? 'bg-[#7C5CFF] text-white shadow-sm'
                                  : hasLog
                                    ? 'bg-[#7C5CFF]/10 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 font-black'
                                    : 'text-gray-400 font-bold hover:bg-gray-50 cursor-default'
                              }`}
                            >
                              {day}
                              
                              {/* Colored indicator dot */}
                              {hasLog && !isToday && (
                                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#7C5CFF]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[8px] font-black text-gray-400 uppercase tracking-wider border-t border-gray-50 pt-4 mt-4 select-none">
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF]" /> Written</div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Favorite</div>
                      <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Streak</div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ── 2. JOURNAL EDITOR WRITE FORM (Create/Edit) ────── */}
          {(editorMode === 'create' || editorMode === 'edit') && (
            <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 md:p-8 shadow-sm space-y-6 text-left">
              
              {/* Category tag selector options */}
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => applyTemplate(cat.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      category === cat.value
                        ? `bg-[#7C5CFF] text-white shadow-md border-transparent`
                        : 'bg-[#FAFAFC] border-[#E9E2FF]/60 text-gray-500 hover:bg-white'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Title Input */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Give your entry a title..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-transparent text-xl font-black text-gray-900 placeholder-gray-300 outline-none border-none pl-1"
                  maxLength={200}
                />

                {/* Body Text Editor */}
                <div className="border border-[#E9E2FF]/80 rounded-2xl overflow-hidden bg-[#FAFAFC] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreview(false)}
                        className={`px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition-all ${!preview ? 'bg-[#7C5CFF]/8 text-[#7C5CFF]' : 'text-gray-400'}`}
                      >
                        <Edit3 className="w-3 h-3 inline mr-1" /> Write
                      </button>
                      <button
                        onClick={() => setPreview(true)}
                        className={`px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition-all ${preview ? 'bg-[#7C5CFF]/8 text-[#7C5CFF]' : 'text-gray-400'}`}
                      >
                        <Eye className="w-3 h-3 inline mr-1" /> Preview
                      </button>
                    </div>
                  </div>

                  {preview ? (
                    <div className="min-h-[260px] p-4 bg-white rounded-xl border border-gray-100">
                      <MarkdownPreview content={content} />
                    </div>
                  ) : (
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Start writing your thoughts... (Markdown supported)"
                      className="w-full min-h-[260px] bg-white rounded-xl border border-gray-150 p-4 text-xs md:text-sm text-gray-900 placeholder-gray-300 outline-none resize-y leading-relaxed focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all font-medium"
                    />
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap items-center gap-4 text-[9px] font-extrabold uppercase text-[#73768F] pl-1 select-none">
                <span className="flex items-center gap-1"><Type className="w-3.5 h-3.5" /> {wordCount} words</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {readingTime} min read</span>
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {charCount} characters</span>
              </div>

              {/* Mood indicators linkage */}
              <div className="pt-5 border-t border-gray-100 text-left select-none">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3.5 block pl-1">Link a Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.score}
                      onClick={() => setSelectedMood(selectedMood === `${m.emoji} ${m.label}` ? null : `${m.emoji} ${m.label}`)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs transition-all border ${
                        selectedMood === `${m.emoji} ${m.label}`
                          ? 'bg-[#7C5CFF] text-white shadow-sm border-transparent'
                          : 'bg-[#FAFAFC] border border-[#E9E2FF]/70 text-gray-500 hover:text-[#7C5CFF] hover:border-[#7C5CFF]/30 font-semibold'
                      }`}
                    >
                      <span className="text-sm">{m.emoji}</span>
                      <span className="text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags comma tags selector */}
              <div className="pt-5 border-t border-gray-100 text-left select-none">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block pl-1">Tags (comma separated)</label>
                <div className="flex items-center gap-2 pl-1 select-text">
                  <input
                    type="text"
                    placeholder="reflection, anxiety, success"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="flex-1 bg-[#FAFAFC] border border-gray-250 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] font-semibold shadow-sm"
                  />
                </div>
              </div>

              {/* Save & Cancel footer action panel */}
              <div className="pt-5 border-t border-gray-100 flex items-center justify-between select-none">
                <button 
                  onClick={resetEditor} 
                  className="h-11 px-5 flex items-center justify-center rounded-xl text-xs font-bold text-gray-400 hover:text-gray-700 uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 h-11 rounded-xl bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-bold text-xs shadow-md shadow-[#7C5CFF]/15 uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 shrink-0"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editorMode === 'edit' ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>

            </div>
          )}

          {/* ── 3. JOURNAL VIEW DETAIL READING VIEW ───────────── */}
          {editorMode === 'view' && viewEntry && (
            <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] overflow-hidden p-6 md:p-8 shadow-sm space-y-6 text-left">
              
              <div className="border-b border-gray-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {viewEntry.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                    {viewEntry.favorite && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-[#7C5CFF]/8 text-[#7C5CFF] uppercase tracking-wider">
                      {CATEGORIES.find(c => c.value === viewEntry.category)?.icon} {CATEGORIES.find(c => c.value === viewEntry.category)?.label || 'Free Writing'}
                    </span>
                    {viewEntry.mood && <span className="text-xs bg-gray-55 border border-gray-100 px-2 py-0.5 rounded-full font-medium">{viewEntry.mood}</span>}
                  </div>

                  <h2 className="text-xl font-black text-gray-900 tracking-tight">{viewEntry.title}</h2>
                  
                  <div className="flex items-center gap-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <span>{new Date(viewEntry.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>{viewEntry.wordCount} words</span>
                    <span>{viewEntry.readingTime} min read</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(viewEntry)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-[#E9E2FF]/40 text-gray-500 hover:text-[#7C5CFF] hover:bg-gray-100 transition-all shrink-0">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(viewEntry._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-55 border border-rose-100 text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={resetEditor} className="h-10 px-4 flex items-center justify-center rounded-xl border border-gray-150 hover:bg-gray-50 text-gray-500 font-extrabold text-xs uppercase tracking-wider transition-all">
                    Back to List
                  </button>
                </div>
              </div>

              {/* Narrative Content */}
              <div className="py-2.5 font-medium leading-relaxed text-gray-700 text-sm pl-1 select-text">
                <MarkdownPreview content={viewEntry.content} />
              </div>

              {/* Tags list */}
              {viewEntry.tags && viewEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {viewEntry.tags.map((t, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-lg bg-[#7C5CFF]/6 border border-[#7C5CFF]/10 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* AI reflections Copilot reflective tools */}
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7C5CFF] fill-[#7C5CFF]/15 animate-pulse" /> AI Reflection Insights
                </h3>

                <div className="flex flex-wrap gap-2.5">
                  {[
                    { key: 'summary', label: 'Summarize', icon: Brain },
                    { key: 'tone', label: 'Detect Tone', icon: MessageCircle },
                    { key: 'reflect', label: 'Reflect', icon: Lightbulb },
                    { key: 'insights', label: 'Insights', icon: Sparkles },
                  ].map(ai => (
                    <button
                      key={ai.key}
                      onClick={() => handleAI(viewEntry._id, ai.key)}
                      disabled={aiLoading[`${viewEntry._id}_${ai.key}`]}
                      className="flex items-center gap-2 px-4.5 h-10 rounded-xl border border-[#E9E2FF]/60 bg-[#FAFAFC] hover:bg-white text-gray-650 font-bold text-xs transition-all disabled:opacity-50 shrink-0"
                    >
                      {aiLoading[`${viewEntry._id}_${ai.key}`] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ai.icon className="w-3.5 h-3.5 text-[#7C5CFF]" />
                      )}
                      {ai.label}
                    </button>
                  ))}
                </div>

                {/* AI Reflections results list */}
                <AnimatePresence>
                  {Object.entries(aiResults).filter(([k]) => k.startsWith(viewEntry._id)).map(([key, result]) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-5 rounded-2xl bg-[#7C5CFF]/3 border border-[#7C5CFF]/10 text-left space-y-3"
                    >
                      <h4 className="text-[10px] font-black text-[#7C5CFF] uppercase tracking-widest">
                        {key.split('_').pop()} analysis
                      </h4>
                      {result.error ? (
                        <p className="text-xs text-rose-500 font-semibold">{result.error}</p>
                      ) : result.summary ? (
                        <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-semibold">{result.summary}</p>
                      ) : result.tone ? (
                        <div className="space-y-1.5 text-xs md:text-sm text-gray-700 font-semibold">
                          <p><span className="text-[#7C5CFF]">Primary:</span> {result.tone.primaryTone}</p>
                          <p><span className="text-[#7C5CFF]">Secondary:</span> {result.tone.secondaryTone}</p>
                          <p><span className="text-[#7C5CFF]">Intensity:</span> {result.tone.intensity}</p>
                          <p className="text-gray-550 font-medium italic mt-1.5">"{result.tone.explanation}"</p>
                        </div>
                      ) : result.questions ? (
                        <ul className="space-y-2 text-xs md:text-sm text-gray-700 font-semibold">
                          {result.questions.map((q, i) => (
                            <li key={i} className="flex gap-2"><span className="text-[#7C5CFF]">{i + 1}.</span> {q}</li>
                          ))}
                        </ul>
                      ) : result.insights ? (
                        <div className="space-y-2 text-xs md:text-sm text-gray-700 font-semibold">
                          <p><span className="text-emerald-500 font-black mr-1">💪 Strength:</span> {result.insights.strength}</p>
                          <p><span className="text-sky-500 font-black mr-1">🔄 Reframe:</span> {result.insights.reframe}</p>
                          <p><span className="text-amber-500 font-black mr-1">✨ Affirmation:</span> {result.insights.affirmation}</p>
                        </div>
                      ) : (
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
