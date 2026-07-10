import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Play, Clock, Award, Compass, Sparkles, X, Heart, Smile, Moon, Target, Sun, ArrowLeft, RefreshCw, Flame, BookOpen, Eye
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Smile': Smile,
  'Moon': Moon,
  'Heart': Heart,
  'Target': Target,
  'Award': Award,
  'Sun': Sun
};

const CATEGORY_COLORS = {
  'stress-relief': { bg: 'bg-purple-50/50', border: 'border-purple-100/50', text: 'text-purple-650', iconBg: 'bg-purple-100/40 text-purple-600' },
  'sleep': { bg: 'bg-indigo-50/50', border: 'border-indigo-100/50', text: 'text-indigo-650', iconBg: 'bg-indigo-100/40 text-indigo-600' },
  'anxiety': { bg: 'bg-rose-50/50', border: 'border-rose-100/50', text: 'text-rose-650', iconBg: 'bg-rose-100/40 text-rose-500' },
  'focus': { bg: 'bg-sky-50/50', border: 'border-sky-100/50', text: 'text-sky-650', iconBg: 'bg-sky-100/40 text-sky-600' },
  'self-love': { bg: 'bg-pink-50/50', border: 'border-pink-100/50', text: 'text-pink-650', iconBg: 'bg-pink-100/40 text-pink-500' },
  'morning': { bg: 'bg-amber-50/50', border: 'border-amber-100/50', text: 'text-amber-650', iconBg: 'bg-amber-100/40 text-amber-500' }
};

const PREDEFINED_QUOTES = [
  { quote: 'You are one breath away from a better feeling.', author: 'Unknown' },
  { quote: 'Quiet the mind and the soul will speak.', author: 'Ma Jaya Sati Bhagavati' },
  { quote: 'Mindfulness isn\'t difficult, we just need to remember to do it.', author: 'Sharon Salzberg' },
  { quote: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.', author: 'Thich Nhat Hanh' },
  { quote: 'The smallest daily habit creates the biggest long-term change.', author: 'Unknown' },
  { quote: 'You are stronger than your anxious thoughts.', author: 'Unknown' },
  { quote: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { quote: 'Breathe in calm, breathe out worry.', author: 'Unknown' },
  { quote: 'Self-care is how you take your power back.', author: 'Lalah Delia' },
  { quote: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { quote: 'One day at a time. One breath at a time.', author: 'Unknown' },
  { quote: 'Your power is in the present moment.', author: 'Eckhart Tolle' },
  { quote: 'You are worthy of the same kindness you give to others.', author: 'Unknown' },
  { quote: 'Tough times never last, but tough people do.', author: 'Robert H. Schuller' }
];

export default function MeditationMindfulness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Global Page Data
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Category Detail Page Data
  const [currentCategory, setCurrentCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);

  // Recommended Card Saved State
  const [isRecommendedSaved, setIsRecommendedSaved] = useState(false);

  // Load baseline statistics and categories
  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, statsRes] = await Promise.all([
        api.get('/meditation/categories'),
        api.get('/meditation/stats')
      ]);

      if (catRes.data?.success) {
        setCategories(catRes.data.categories);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.warn('Failed to load meditation modules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Category Details on Select
  const loadCategoryData = useCallback(async (slug) => {
    setLoading(true);
    try {
      const [categoryRes, articlesRes, videosRes] = await Promise.all([
        api.get(`/meditation/category/${slug}`),
        api.get(`/meditation/articles/${slug}`),
        api.get(`/meditation/videos/${slug}`)
      ]);

      if (categoryRes.data?.success) {
        setCurrentCategory(categoryRes.data.category);
      }
      if (articlesRes.data?.success) {
        setArticles(articlesRes.data.articles || []);
      }
      if (videosRes.data?.success) {
        setVideos(videosRes.data.videos || []);
      }
    } catch (err) {
      console.error('Failed to load category assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (categorySlug) {
      loadCategoryData(categorySlug);
    } else {
      loadPageData();
    }
  }, [categorySlug, loadPageData, loadCategoryData]);

  const handleNextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % PREDEFINED_QUOTES.length);
  };

  const getIconComponent = (iconName) => {
    return CATEGORY_ICONS[iconName] || Smile;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B4B] flex font-poppins select-none relative">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation bar */}
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full space-y-8 text-left relative z-10">
          
          <AnimatePresence mode="wait">
            {!categorySlug ? (
              // MAIN OVERVIEW PAGE
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* 1. Hero Heading */}
                <div className="space-y-1 mt-2">
                  <h1 className="text-2.5xl font-black text-[#1C1C3A] tracking-tight">Take a moment for yourself</h1>
                  <p className="text-xs text-[#73768F] font-bold">
                    Reduce stress, improve focus and bring more calm to your day.
                  </p>
                </div>

                {/* 2. Statistics Cards Grid */}
                {stats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white border border-[#E9E2FF]/65 p-5 rounded-[24px] shadow-[0_4px_25px_rgba(124,92,255,0.015)] flex items-center gap-4 hover:border-[#7C5CFF]/20 transition-all h-26">
                      <div className="w-11 h-11 rounded-full bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] shrink-0">
                        <Clock className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Minutes Meditated</span>
                        <span className="text-lg font-black text-slate-800 leading-none mt-1 block">
                          {stats.minutesMeditated >= 60 
                            ? `${Math.floor(stats.minutesMeditated / 60)}h ${stats.minutesMeditated % 60}m` 
                            : `${stats.minutesMeditated}m`}
                        </span>
                        <span className="text-[9px] text-[#73768F] font-bold mt-1 block">This week</span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E9E2FF]/65 p-5 rounded-[24px] shadow-[0_4px_25px_rgba(124,92,255,0.015)] flex items-center gap-4 hover:border-[#7C5CFF]/20 transition-all h-26">
                      <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                        <Award className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Sessions Completed</span>
                        <span className="text-lg font-black text-slate-800 leading-none mt-1 block">{stats.sessionsCompleted}</span>
                        <span className="text-[9px] text-[#73768F] font-bold mt-1 block">This week</span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E9E2FF]/65 p-5 rounded-[24px] shadow-[0_4px_25px_rgba(124,92,255,0.015)] flex items-center gap-4 hover:border-[#7C5CFF]/20 transition-all h-26">
                      <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                        <Flame className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Current Streak</span>
                        <span className="text-lg font-black text-slate-800 leading-none mt-1 block">{stats.streak} Days</span>
                        <span className="text-[8px] text-orange-600 font-extrabold block mt-1 uppercase tracking-wider">Keep it up! 🔥</span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E9E2FF]/65 p-5 rounded-[24px] shadow-[0_4px_25px_rgba(124,92,255,0.015)] flex items-center gap-4 hover:border-[#7C5CFF]/20 transition-all h-26">
                      <div className="w-11 h-11 rounded-full bg-[#7C5CFF]/8 flex items-center justify-center text-[#7C5CFF] shrink-0">
                        <Compass className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Longest Session</span>
                        <span className="text-lg font-black text-slate-800 leading-none mt-1 block">{stats.longestSession} min</span>
                        <span className="text-[9px] text-[#73768F] font-bold mt-1 block">Deep Relaxation</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Recommended & Daily Motivation Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recommended Meditation Card */}
                  <div className="lg:col-span-2 bg-white border border-[#E9E2FF]/60 rounded-[28px] p-6 shadow-[0_10px_35px_rgba(124,92,255,0.015)] flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden text-left min-h-[220px]">
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#7C5CFF] bg-[#7C5CFF]/8 px-3 py-1.5 rounded-full inline-block">Recommended For You</span>
                        <h2 className="text-xl font-black text-[#1C1C3A] tracking-tight mt-3 block">Calm the Racing Mind</h2>
                        <div className="flex items-center gap-2 text-[10px] text-[#73768F] font-extrabold uppercase mt-2">
                          <Clock className="w-3.5 h-3.5" /> 10 min • Beginner • Stress Relief
                        </div>
                        <p className="text-xs text-[#73768F] font-semibold leading-relaxed mt-2.5 max-w-[280px]">
                          A relaxing guided meditation to reduce stress and help you find inner peace.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button 
                          onClick={() => navigate('/meditation/video/668edd27364b4bb8bcd40001')} // Open Stress Relief Video 1
                          className="px-5 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6846FF] text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#7C5CFF]/15"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Start Session</span>
                        </button>
                        <button
                          onClick={() => setIsRecommendedSaved(!isRecommendedSaved)}
                          className={`px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                            isRecommendedSaved
                              ? 'bg-rose-50 border-rose-100 text-rose-500'
                              : 'bg-white border-gray-150 text-gray-450 hover:bg-gray-50'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isRecommendedSaved ? 'fill-rose-500' : ''}`} />
                          <span>{isRecommendedSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-full md:w-60 h-44 md:h-full rounded-2xl overflow-hidden relative shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800" 
                        alt="Meditation practitioner at sunrise" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-[#1C1C3A]/10 flex items-center justify-center">
                        <button 
                          onClick={() => navigate('/meditation/video/668edd27364b4bb8bcd40001')}
                          className="w-12 h-12 rounded-full bg-white text-[#7C5CFF] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                          <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Daily Motivation Card */}
                  <div className="bg-white border border-[#E9E2FF]/60 rounded-[28px] p-6 shadow-[0_10px_35px_rgba(124,92,255,0.015)] flex flex-col justify-between text-center relative overflow-hidden h-full min-h-[220px]">
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider flex items-center justify-center gap-1.5 border-b border-[#FAF9FF] pb-3.5 pl-0.5">
                        <Sparkles className="w-4 h-4 text-[#7C5CFF]" /> Daily Motivation
                      </h3>
                      <p className="font-extrabold text-sm text-[#1E1B4B] leading-relaxed max-w-[220px] mx-auto pt-2">
                        "{PREDEFINED_QUOTES[quoteIdx].quote}"
                      </p>
                      <span className="text-[10px] font-black uppercase text-gray-400 block">— {PREDEFINED_QUOTES[quoteIdx].author}</span>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-center">
                      <button
                        onClick={handleNextQuote}
                        className="px-4 py-2 rounded-xl border border-[#E9E2FF] hover:bg-gray-50 text-[10px] font-black uppercase tracking-wider text-[#7C5CFF] transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>New Quote</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Browse by Category Grid */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pl-0.5">
                    <h3 className="font-black text-xs text-[#1C1C3A] uppercase tracking-wider">Browse by Category</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((cat) => {
                      const Icon = getIconComponent(cat.icon);
                      const color = CATEGORY_COLORS[cat.slug] || CATEGORY_COLORS['stress-relief'];
                      return (
                        <div
                          key={cat.slug}
                          onClick={() => navigate(`/meditation/${cat.slug}`)}
                          className={`p-4 bg-white border border-[#E9E2FF]/50 hover:border-[#7C5CFF]/30 rounded-2xl flex flex-col items-center text-center justify-center gap-2.5 transition-all cursor-pointer group shadow-sm`}
                        >
                          <div className={`w-10 h-10 rounded-xl ${color.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-all`}>
                            <Icon className="w-5.5 h-5.5" />
                          </div>
                          <div>
                            <span className="font-black text-xs text-[#1C1C3A] block">{cat.name}</span>
                            <span className="text-[9px] text-gray-400 font-bold block mt-0.5">{cat.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              // CATEGORY DETAIL PAGE
              <motion.div
                key="category"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* 1. Category Hero */}
                {currentCategory && (
                  <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-r from-[#7C5CFF] to-[#9A7DFF] text-white p-8 md:p-10 shadow-xl shadow-[#7C5CFF]/10 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="max-w-xl space-y-3.5 relative z-10">
                      <button
                        onClick={() => navigate('/meditation')}
                        className="text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/35 px-4 py-2 rounded-full inline-flex items-center gap-1.5 transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Meditation</span>
                      </button>
                      <h1 className="text-3xl font-black tracking-tight leading-tight pt-1">{currentCategory.name}</h1>
                      <p className="text-xs text-purple-100 font-semibold leading-relaxed">
                        {currentCategory.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Educational Articles */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pl-0.5">
                    <h3 className="font-black text-xs text-[#1C1C3A] uppercase tracking-wider">Educational Articles</h3>
                    <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider">Exactly 5 Articles</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                    {articles.slice(0, 5).map((article) => (
                      <div
                        key={article._id}
                        onClick={() => navigate(`/meditation/article/${article._id}`)}
                        className="bg-white border border-[#E9E2FF]/55 rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(124,92,255,0.01)] hover:shadow-md transition-shadow relative text-left flex flex-col h-[320px] cursor-pointer group"
                      >
                        <div className="relative h-32 bg-slate-100 shrink-0 overflow-hidden">
                          <img 
                            src={article.coverImage} 
                            alt={article.title} 
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" 
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black uppercase text-[#7C5CFF] tracking-wider bg-[#7C5CFF]/8 px-2 py-1 rounded-md inline-block">Article</span>
                            <h4 className="font-black text-xs text-slate-800 leading-snug line-clamp-2 group-hover:text-[#7C5CFF] transition-colors">{article.title}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed line-clamp-3">{article.summary}</p>
                          </div>
                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[8px] text-gray-400 font-extrabold uppercase">
                            <span className="truncate max-w-[90px]">By {article.author}</span>
                            <span className="flex items-center gap-0.5 shrink-0"><Clock className="w-2.5 h-2.5" /> {article.readingTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. YouTube Videos */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pl-0.5">
                    <h3 className="font-black text-xs text-[#1C1C3A] uppercase tracking-wider">YouTube Videos</h3>
                    <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider">Exactly 5 Videos</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                    {videos.slice(0, 5).map((vid) => (
                      <div
                        key={vid._id}
                        onClick={() => navigate(`/meditation/video/${vid._id}`)}
                        className="bg-white border border-[#E9E2FF]/55 rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(124,92,255,0.01)] hover:shadow-md transition-shadow relative text-left flex flex-col h-[340px] cursor-pointer group"
                      >
                        <div className="relative h-28 bg-slate-100 shrink-0 overflow-hidden">
                          <img 
                            src={vid.thumbnail} 
                            alt={vid.title} 
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" 
                          />
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/75 rounded text-[8px] font-black text-white tracking-wide">
                            {vid.duration}
                          </div>
                          <div className="absolute inset-0 bg-[#1C1C3A]/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white text-[#7C5CFF] flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                          <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md inline-block">{vid.channel}</span>
                            <h4 className="font-black text-xs text-slate-800 leading-snug line-clamp-2 mt-1.5 group-hover:text-[#7C5CFF] transition-colors">{vid.title}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed line-clamp-3">{vid.description}</p>
                          </div>
                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[8px] text-gray-400 font-extrabold uppercase">
                            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {vid.views}</span>
                            <span>{vid.publishedDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
