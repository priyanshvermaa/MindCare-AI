import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Play, Pause, Clock, Award, Compass, Sparkles, Volume2, 
  VolumeX, Maximize2, FastForward, Minimize2, ChevronRight, Search, 
  BookOpen, Info, Smile, RefreshCw, Sun, Moon, Target, ShieldAlert,
  ArrowLeft, CheckCircle, Share2, X, PlayCircle, Star, Sparkle, Heart, Flame
} from 'lucide-react';

const CATEGORIES = [
  { label: 'Stress Relief', count: '15 Sessions', icon: Smile, bgClass: 'bg-purple-50 text-purple-600 border border-purple-100' },
  { label: 'Sleep', count: '15 Sessions', icon: Moon, bgClass: 'bg-indigo-50 text-indigo-650 border border-indigo-100' },
  { label: 'Anxiety', count: '15 Sessions', icon: Heart, bgClass: 'bg-rose-50 text-rose-500 border border-rose-100' },
  { label: 'Focus', count: '15 Sessions', icon: Target, bgClass: 'bg-sky-50 text-sky-600 border border-sky-100' },
  { label: 'Self Love', count: '15 Sessions', icon: Award, bgClass: 'bg-pink-50 text-pink-500 border border-pink-100' },
  { label: 'Morning', count: '15 Sessions', icon: Sun, bgClass: 'bg-amber-50 text-amber-500 border border-amber-100' }
];

const PREDEFINED_QUOTES = [
  { quote: 'You are one breath away from a better feeling.', author: 'Unknown' },
  { quote: 'Quiet the mind and the soul will speak.', author: 'Ma Jaya Sati Bhagavati' },
  { quote: 'Mindfulness isn\'t difficult, we just need to remember to do it.', author: 'Sharon Salzberg' }
];

const CATEGORY_META = {
  'Stress Relief': {
    overview: 'Calm your nervous system and find emotional stability through guided breathing and deep mindfulness patterns.',
    benefits: ['Lowers cortisol levels', 'Relieves physical body tension', 'Improves daily emotional regulation'],
    aiTip: 'Stress levels are highly dependent on nervous system recovery. Try scheduling 5 minutes of Box Breathing during lunch breaks.'
  },
  'Sleep': {
    overview: 'Prepare your mind and body for deep, restorative sleep by letting go of daytime cognitive stress.',
    benefits: ['Quiets racing thoughts', 'Stimulates melatonin production', 'Stabilizes circadian recovery'],
    aiTip: 'Melatonin release is suppressed by late-night screens. Wind down 45 minutes before sleep with a relaxing melody.'
  },
  'Anxiety': {
    overview: 'Ground yourself during acute moments of worry, panic, or overwhelming cognitive scatter.',
    benefits: ['Soothes acute panic responses', 'Returns cognitive control to present', 'Slows physical heart rate'],
    aiTip: 'When anxiety rises, immediate sensory grounding (5-4-3-2-1) is the fastest way to signal safety to your brain.'
  },
  'Focus': {
    overview: 'Train your attention muscle to resist distractions and sustain cognitive concentration.',
    benefits: ['Reduces mental scatter', 'Enhances workspace clarity', 'Fosters high execution performance'],
    aiTip: 'A single block of deep focus meditation can increase concentration span by up to 25% for subsequent tasks.'
  },
  'Self Love': {
    overview: 'Nurture self-compassion, silence self-criticism, and celebrate your personal resilience.',
    benefits: ['Reduces self-judgment', 'Promotes positive self-talk', 'Strengthens emotional resilience'],
    aiTip: 'Treating yourself with standard kindness during setbacks accelerates recoverability from stress.'
  },
  'Morning': {
    overview: 'Awaken your attention and set positive, focused intentions for your upcoming workday.',
    benefits: ['Boosts morning alertness', 'Fosters gratitude mindset', 'Anchores focus for deep work'],
    aiTip: 'Morning light combined with a 5-minute breathing reset helps establish baseline cognitive energy.'
  }
};

export default function MeditationMindfulness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Global Page Data
  const [meditations, setMeditations] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [quote, setQuote] = useState(PREDEFINED_QUOTES[0]);
  const [loading, setLoading] = useState(true);

  // Aggregated Personalized AI Recommendation
  const [aiRecommendation, setAiRecommendation] = useState({
    summary: 'We recommend starting your day with a morning breathing reset to balance cognitive focus and emotional wellness.',
    stressReduction: 15,
    wellnessTips: [
      'Hydrate immediately after waking up.',
      'Avoid screens for the first 30 minutes of your day.',
      'Log your mood daily to help track resilience triggers.'
    ]
  });

  const [stats, setStats] = useState({
    minutesMeditated: 0,
    completedSessions: 0,
    longestMeditation: 0,
    currentStreak: 0,
    weeklyMinutes: 0,
    monthlyMinutes: 0,
    completionRate: 0
  });

  // Selected Category Detail View
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryMeds, setCategoryMeds] = useState([]);
  const [categoryArticles, setCategoryArticles] = useState([]);
  const [categoryVideos, setCategoryVideos] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const { categorySlug } = useParams();

  const slugToCategory = {
    'stress-relief': 'Stress Relief',
    'sleep': 'Sleep',
    'anxiety': 'Anxiety',
    'focus': 'Focus',
    'self-love': 'Self Love',
    'morning': 'Morning'
  };

  const categoryToSlug = {
    'Stress Relief': 'stress-relief',
    'Sleep': 'sleep',
    'Anxiety': 'anxiety',
    'Focus': 'focus',
    'Self Love': 'self-love',
    'Morning': 'morning'
  };

  useEffect(() => {
    if (categorySlug) {
      const mapped = slugToCategory[categorySlug.toLowerCase()];
      if (mapped) {
        setSelectedCategory(mapped);
      } else {
        setSelectedCategory('');
      }
    } else {
      setSelectedCategory('');
    }
  }, [categorySlug]);

  // Custom Player Overlay Modal
  const [selectedMeditation, setSelectedMeditation] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const progressSaveIntervalRef = useRef(null);

  // Articles & Videos overlay drawers
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [articleProgressSubmitting, setArticleProgressSubmitting] = useState(false);

  // Load baseline statistics and recommendations
  const loadPageData = async () => {
    setLoading(true);
    try {
      const [
        medsRes, 
        featuredRes, 
        recommendRes, 
        quoteRes, 
        statsRes
      ] = await Promise.all([
        api.get('/meditations').catch(() => ({ data: { meditations: [] } })),
        api.get('/meditations/featured').catch(() => ({ data: { meditation: null } })),
        api.get('/meditations/recommendations').catch(() => ({ data: { recommendations: [] } })),
        api.get('/meditations/motivation').catch(() => ({ data: { quote: null } })),
        api.get('/meditations/stats').catch(() => ({ data: { stats: null } }))
      ]);

      if (medsRes.data?.meditations) {
        setMeditations(medsRes.data.meditations);
      }

      if (featuredRes.data?.meditation) {
        setFeatured(featuredRes.data.meditation);
      } else if (medsRes.data?.meditations?.length > 0) {
        setFeatured(medsRes.data.meditations[0]);
      }

      setRecommendations(recommendRes.data?.recommendations || []);
      
      if (recommendRes.data?.success) {
        setAiRecommendation({
          summary: recommendRes.data.reason || aiRecommendation.summary,
          stressReduction: recommendRes.data.estimatedStressReduction || aiRecommendation.stressReduction,
          wellnessTips: recommendRes.data.suggestedWellnessTips || aiRecommendation.wellnessTips
        });
      }

      if (quoteRes.data?.quote) {
        setQuote(quoteRes.data.quote);
      }

      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }

    } catch (err) {
      console.warn('Failed to load meditation modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  // Fetch Category Details on Select
  const loadCategoryData = useCallback(async (catName) => {
    setCategoryLoading(true);
    try {
      const [medsRes, resourcesRes] = await Promise.all([
        api.get(`/meditations?category=${encodeURIComponent(catName)}`),
        api.get(`/resources?category=${encodeURIComponent(catName)}`)
      ]);

      setCategoryMeds(medsRes.data?.meditations || []);
      
      const allResources = resourcesRes.data?.resources || [];
      setCategoryArticles(allResources.filter(r => r.type === 'article'));
      setCategoryVideos(allResources.filter(r => r.type === 'video'));

    } catch (err) {
      console.error('Failed to load category assets:', err);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryData(selectedCategory);
    }
  }, [selectedCategory, loadCategoryData]);

  // Play meditation session trigger
  const handlePlayMeditation = async (meditation) => {
    try {
      await api.post(`/meditations/${meditation._id}/play`);
      setSelectedMeditation(meditation);
      setCurrentTime(meditation.currentTime || 0);
      setPlayerOpen(true);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to initiate playback:', err);
    }
  };

  // Progress Save loops
  useEffect(() => {
    if (playerOpen && selectedMeditation && isPlaying) {
      progressSaveIntervalRef.current = setInterval(async () => {
        if (videoRef.current) {
          const cTime = videoRef.current.currentTime;
          const dur = videoRef.current.duration || selectedMeditation.duration || 300;
          const prog = (cTime / dur) * 100;
          
          try {
            await api.post(`/meditations/${selectedMeditation._id}/progress`, {
              currentTime: cTime,
              progress: prog
            });
          } catch (err) {
            console.warn('Failed to save progress update:', err);
          }
        }
      }, 5000);
    } else {
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
    }

    return () => {
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
    };
  }, [playerOpen, selectedMeditation, isPlaying]);

  const handleClosePlayer = async () => {
    if (videoRef.current && selectedMeditation) {
      const cTime = videoRef.current.currentTime;
      const dur = videoRef.current.duration || selectedMeditation.duration || 300;
      const prog = (cTime / dur) * 100;
      
      try {
        await api.post(`/meditations/${selectedMeditation._id}/progress`, {
          currentTime: cTime,
          progress: prog
        });
      } catch (err) {
        console.error(err);
      }
    }
    setPlayerOpen(false);
    setSelectedMeditation(null);
    setIsPlaying(false);
    loadPageData();
    if (selectedCategory) {
      loadCategoryData(selectedCategory);
    }
  };

  // Article reading progress trigger
  const handleMarkArticleRead = async (article) => {
    setArticleProgressSubmitting(true);
    try {
      await api.post(`/resources/${article._id}/progress`, {
        progress: 100,
        currentTime: 0
      });
      setSelectedArticle(null);
      if (selectedCategory) {
        loadCategoryData(selectedCategory);
      }
    } catch (err) {
      console.error('Failed to log article reading progress:', err);
    } finally {
      setArticleProgressSubmitting(false);
    }
  };

  // Video watch logging trigger
  const handleWatchVideo = async (video) => {
    setSelectedVideo(video);
    try {
      await api.post(`/resources/${video._id}/progress`, {
        progress: 100,
        currentTime: 0
      });
    } catch (err) {
      console.warn('Failed to log video watch progress:', err);
    }
  };

  // Extract Youtube ID and generate embed
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E1B4B] flex font-poppins select-none relative">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation bar */}
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full space-y-8 text-left relative z-10">
          
          <AnimatePresence mode="wait">
            {!selectedCategory ? (
              // MAIN OVERVIEW PAGE
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* 1. Hero Banner */}
                <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#7C5CFF] to-[#9A7DFF] text-white p-8 md:p-12 shadow-xl shadow-[#7C5CFF]/15">
                  <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800')] bg-cover bg-center opacity-10 mix-blend-overlay hidden md:block" />
                  <div className="max-w-xl space-y-4 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Tranquility Space</span>
                    <h1 className="text-3xl md:text-4.5xl font-black tracking-tight leading-tight">Find Your Inner Calm, {user?.name || 'Friend'}</h1>
                    <p className="text-xs md:text-sm text-purple-100 font-semibold leading-relaxed">
                      Immerse yourself in premium mindfulness practices. Calm your nervous system, clarify your thoughts, and track your resilience progress.
                    </p>
                  </div>
                </div>

                {/* 2. Statistics Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
                    <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Minutes Meditated</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-slate-800 leading-none">{stats.minutesMeditated}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">mins</span>
                    </div>
                    <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                      <Flame className="w-3 h-3" /> {stats.weeklyMinutes}m logged this week
                    </span>
                  </div>

                  <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
                    <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Completed Sessions</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-slate-800 leading-none">{stats.completedSessions}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">runs</span>
                    </div>
                    <span className="text-[9px] text-purple-500 font-bold mt-1">
                      {stats.completionRate}% completion rate
                    </span>
                  </div>

                  <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
                    <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Longest Session</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-slate-800 leading-none">{stats.longestMeditation}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">mins</span>
                    </div>
                    <span className="text-[9px] text-[#7C5CFF] font-bold mt-1">
                      Max focus threshold
                    </span>
                  </div>

                  <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
                    <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Current Streak</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black text-slate-800 leading-none">{stats.currentStreak}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">days</span>
                    </div>
                    <span className="text-[9px] text-orange-500 font-bold mt-1">
                      Keep the momentum alive!
                    </span>
                  </div>
                </div>

                {/* 3. AI Personalization Recommendation */}
                <div className="bg-gradient-to-r from-purple-50/70 to-indigo-50/50 border border-[#E9E2FF] p-6 rounded-[24px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-[#7C5CFF]">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Grok Wellness Suggestion</span>
                    </div>
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">
                      "{aiRecommendation.summary}"
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {aiRecommendation.wellnessTips.map((tip, idx) => (
                        <span key={idx} className="bg-white/80 border border-slate-150 px-2.5 py-1 rounded-lg text-[9px] text-slate-600 font-bold">
                          💡 {tip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-[#E9E2FF] p-4 rounded-2xl shrink-0 text-center w-full md:w-36 shadow-sm">
                    <span className="text-[9px] text-gray-450 font-black uppercase block tracking-wider">Est. Stress reduction</span>
                    <span className="text-3xl font-black text-[#7C5CFF] block mt-1">-{aiRecommendation.stressReduction}%</span>
                    <span className="text-[8px] text-emerald-600 font-bold uppercase mt-1 block">In 10 mins session</span>
                  </div>
                </div>

                {/* 4. Browse Categories */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-900 text-base">Browse Meditation categories</h3>
                    <span className="text-xxs text-gray-400 font-bold uppercase">Select one to explore details</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {CATEGORIES.map((cat, idx) => {
                      const Icon = cat.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => navigate('/meditation/' + categoryToSlug[cat.label])}
                          className="bg-white border border-slate-100 rounded-2xl p-4 text-center cursor-pointer shadow-sm hover:shadow-md hover:scale-102 transition-all flex flex-col justify-between items-center h-28 group relative overflow-hidden"
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.bgClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="mt-2">
                            <span className="font-black text-xs text-slate-800 block">{cat.label}</span>
                            <span className="text-[9px] text-gray-400 font-bold block mt-0.5">{cat.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* 7. Recommended Sessions */}
                {recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-base">Recommended Sessions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {recommendations.map((med) => (
                        <div
                          key={med._id}
                          className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-sm flex flex-col justify-between h-64 hover:shadow-md transition-shadow relative text-left group"
                        >
                          <div className="relative h-28 bg-slate-100 shrink-0">
                            <img src={med.thumbnail} alt={med.title} className="w-full h-full object-cover" />
                            <button
                              onClick={() => handlePlayMeditation(med)}
                              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[8px] font-black uppercase text-[#7C5CFF] tracking-wider">{med.category}</span>
                              <h4 className="font-extrabold text-xs text-slate-800 block mt-0.5 line-clamp-1">{med.title}</h4>
                              <p className="text-[10px] text-gray-400 font-semibold line-clamp-2 mt-1 leading-relaxed">{med.description}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-gray-400 font-extrabold uppercase mt-2 pt-2 border-t border-slate-50">
                              <Clock className="w-3 h-3 text-slate-400" /> {Math.round(med.duration / 60)} mins
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 11. Daily Motivation */}
                <div className="p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E9E2FF] text-center max-w-2xl mx-auto space-y-3">
                  <Compass className="w-6 h-6 text-[#7C5CFF] mx-auto opacity-70" />
                  <p className="font-extrabold text-sm text-[#1E1B4B] leading-relaxed">
                    "{quote.quote}"
                  </p>
                  <span className="text-[10px] font-black uppercase text-gray-400 block">— {quote.author || 'Unknown'}</span>
                </div>

                {/* 12. Achievements */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base">Mindfulness Achievements</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-800 block">First Inhale</span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Completed 1 session</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-800 block">Consistency Pro</span>
                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5">3-Day Streak unlocked</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm opacity-50">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-800 block">100 Mins Club</span>
                        <span className="text-[9px] text-gray-450 font-bold block mt-0.5">Unlocks at 100 mins</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm opacity-50">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-800 block">Mindfulness Sage</span>
                        <span className="text-[9px] text-gray-450 font-bold block mt-0.5">Unlocks at 30 days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 13. Footer */}
                <div className="text-center text-xxs text-gray-400 uppercase font-black py-4 border-t border-slate-100">
                  © 2026 MindCare AI. Premium Mindfulness Systems.
                </div>
              </motion.div>
            ) : (
              // CATEGORY DETAIL PAGE
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Back button header */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/meditation')}
                    className="p-2 bg-white border border-slate-150 rounded-xl text-slate-500 hover:text-slate-800 shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none">{selectedCategory}</h2>
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase">Category Space overview</p>
                  </div>
                </div>

                {categoryLoading ? (
                  <div className="py-24 text-center text-xs text-gray-400 animate-pulse">
                    Aggregating category assets...
                  </div>
                ) : (
                  <>
                    {/* Category Hero & Description */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm space-y-4 text-left">
                        <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-50 pb-2">Overview</h3>
                        <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                          {CATEGORY_META[selectedCategory]?.overview}
                        </p>
                        
                        <div className="space-y-2 pt-2">
                          <span className="text-[9px] font-black uppercase text-[#7C5CFF] tracking-wider">Clinically Supported Benefits</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {CATEGORY_META[selectedCategory]?.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xxs font-bold text-slate-700">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Category stats / details progress */}
                      <div className="bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm flex flex-col justify-between text-left">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 mb-1.5">Personalized AI recommendation</h3>
                          <p className="text-xxs text-[#7C5CFF] font-bold leading-relaxed">
                            "{CATEGORY_META[selectedCategory]?.aiTip}"
                          </p>
                        </div>
                        
                        <div className="space-y-2 border-t border-slate-50 pt-4 mt-4">
                          <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Completion progress</span>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: '45%' }} />
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-gray-400 font-extrabold uppercase">
                            <span>45% Completed</span>
                            <span>{categoryMeds.length} sessions available</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PART 4 — FEATURED SECTION */}
                    {categoryMeds.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-extrabold text-slate-900 text-base">Featured session</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm p-6">
                          
                          {/* Left: session metadata */}
                          <div className="flex flex-col justify-between space-y-4 text-left">
                            <div className="space-y-2">
                              <span className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-purple-50 text-[#7C5CFF]">
                                {categoryMeds[0].difficulty}
                              </span>
                              <h4 className="font-black text-lg text-slate-800 leading-tight pt-1">
                                {categoryMeds[0].title}
                              </h4>
                              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                {categoryMeds[0].description}
                              </p>
                            </div>
                            
                            <div className="space-y-2 pt-2">
                              <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Session Instructor</span>
                              <span className="font-bold text-xs text-slate-700 block">🎙️ {categoryMeds[0].instructor || 'MindCare Trainer'}</span>
                            </div>

                            <button
                              onClick={() => handlePlayMeditation(categoryMeds[0])}
                              className="py-3 px-6 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-sm transition-all self-start flex items-center gap-2 active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Start Session
                            </button>
                          </div>

                          {/* Center: large visual preview */}
                          <div className="relative h-56 lg:h-auto bg-slate-100 rounded-2xl overflow-hidden shadow-inner group">
                            <img src={categoryMeds[0].thumbnail} alt={categoryMeds[0].title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <button
                                onClick={() => handlePlayMeditation(categoryMeds[0])}
                                className="w-14 h-14 rounded-full bg-white text-[#7C5CFF] flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95"
                              >
                                <Play className="w-6 h-6 fill-current ml-1 text-[#7C5CFF]" />
                              </button>
                            </div>
                          </div>

                          {/* Right: AI recommendation metrics */}
                          <div className="p-5 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 border border-[#E9E2FF]/60 rounded-2xl flex flex-col justify-between text-left space-y-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-[#7C5CFF]">
                                <Sparkle className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-wider">Personalized Grok summary</span>
                              </div>
                              <p className="text-xxs text-slate-700 leading-relaxed font-semibold">
                                "This {Math.round(categoryMeds[0].duration / 60)}-minute breathing pacing reduces muscle tension. Suggested for regular interval rest."
                              </p>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 pt-3">
                              <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wider">Est. Stress reduction</span>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-[#7C5CFF]">-22%</span>
                                <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Calculated response rate</span>
                              </div>
                            </div>

                            <div className="space-y-1 pt-2">
                              <span className="text-[8px] font-black uppercase text-gray-400 block">Quick wellness tips</span>
                              <p className="text-[10px] text-slate-600 font-bold leading-normal">
                                • Sit with feet flat on the floor.<br />
                                • Keep spine aligned but relaxed.
                              </p>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* Related Sessions Grid */}
                    <div className="space-y-4 pt-4">
                      <h3 className="font-extrabold text-slate-900 text-base">Meditation sessions</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categoryMeds.slice(1).map((med) => (
                          <div
                            key={med._id}
                            className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-sm flex flex-col justify-between h-64 hover:shadow-md transition-shadow relative text-left group"
                          >
                            <div className="relative h-28 bg-slate-100 shrink-0">
                              <img src={med.thumbnail} alt={med.title} className="w-full h-full object-cover" />
                              <button
                                onClick={() => handlePlayMeditation(med)}
                                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <span className="text-[8px] font-black uppercase text-[#7C5CFF] tracking-wider">{med.category}</span>
                                <h4 className="font-extrabold text-xs text-slate-800 block mt-0.5 line-clamp-1">{med.title}</h4>
                                <p className="text-[10px] text-gray-400 font-semibold line-clamp-2 mt-1 leading-relaxed">{med.description}</p>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-[9px] text-gray-400 font-extrabold uppercase">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" /> {Math.round(med.duration / 60)} mins
                                </span>
                                {med.completed && (
                                  <span className="text-emerald-500 font-black">Completed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Educational Articles */}
                    <div className="space-y-4 pt-4">
                      <h3 className="font-extrabold text-slate-900 text-base">Educational articles</h3>
                      {categoryArticles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryArticles.map((art) => (
                            <div
                              key={art._id}
                              onClick={() => setSelectedArticle(art)}
                              className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-sm flex flex-col justify-between h-72 hover:shadow-md cursor-pointer transition-shadow text-left"
                            >
                              <div className="h-32 bg-slate-100 overflow-hidden shrink-0">
                                <img src={art.coverImage || art.thumbnail} alt={art.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-[#7C5CFF] tracking-wider">{art.category}</span>
                                  <h4 className="font-extrabold text-xs text-slate-800 block mt-0.5 line-clamp-1">{art.title}</h4>
                                  <p className="text-[10px] text-gray-400 font-semibold line-clamp-2 mt-1 leading-relaxed">{art.description}</p>
                                </div>
                                
                                <div className="flex justify-between items-center text-[9px] text-gray-400 font-extrabold uppercase mt-2 pt-2 border-t border-slate-50">
                                  <span>By {art.author || 'Wellness Coach'}</span>
                                  <span>{art.duration || '5 mins read'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-400 border border-slate-100 rounded-2xl">
                          No educational articles seeded in this category yet.
                        </div>
                      )}
                    </div>

                    {/* YouTube Videos */}
                    <div className="space-y-4 pt-4">
                      <h3 className="font-extrabold text-slate-900 text-base">YouTube videos</h3>
                      {categoryVideos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryVideos.map((vid) => (
                            <div
                              key={vid._id}
                              onClick={() => handleWatchVideo(vid)}
                              className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-sm flex flex-col justify-between h-72 hover:shadow-md cursor-pointer transition-shadow text-left group"
                            >
                              <div className="relative h-32 bg-slate-100 overflow-hidden shrink-0">
                                <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                  <PlayCircle className="w-10 h-10 text-white opacity-90 transition-transform group-hover:scale-105" />
                                </div>
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-sky-600 tracking-wider">{vid.channel}</span>
                                  <h4 className="font-extrabold text-xs text-slate-800 block mt-0.5 line-clamp-2">{vid.title}</h4>
                                  <p className="text-[10px] text-gray-450 font-semibold line-clamp-1 mt-1 leading-relaxed">{vid.description}</p>
                                </div>
                                
                                <div className="flex justify-between items-center text-[9px] text-gray-400 font-extrabold uppercase mt-2 pt-2 border-t border-slate-50">
                                  <span>{vid.duration || '10 mins'}</span>
                                  <span className="text-rose-500 font-black">{vid.views || 'YouTube'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-400 border border-slate-100 rounded-2xl">
                          No YouTube videos linked in this category yet.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>

      {/* CUSTOM MEDITATION VIDEO PLAYER OVERLAY MODAL */}
      <AnimatePresence>
        {playerOpen && selectedMeditation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePlayer}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[28px] overflow-hidden shadow-2xl z-10 flex flex-col text-white h-[450px]"
            >
              {/* Media viewer container */}
              <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={selectedMeditation.videoUrl}
                  autoPlay
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration || selectedMeditation.duration);
                  }}
                  className="w-full h-full object-cover"
                />
                
                {/* Visual ambient gradient if video link isn't loaded */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 flex flex-col items-center justify-center p-8 space-y-3 pointer-events-none">
                  <Smile className="w-12 h-12 text-[#7C5CFF] animate-pulse" />
                  <h4 className="font-extrabold text-sm text-center tracking-wide">{selectedMeditation.title}</h4>
                  <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">Breathing focus play console</span>
                </div>
              </div>

              {/* Media player controls footer */}
              <div className="p-6 bg-slate-950 border-t border-slate-850 flex flex-col justify-between shrink-0 space-y-4">
                
                {/* Progress bar slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={e => {
                      const time = parseFloat(e.target.value);
                      if (videoRef.current) videoRef.current.currentTime = time;
                      setCurrentTime(time);
                    }}
                    className="w-full accent-[#7C5CFF] h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-[10px] text-gray-450 font-extrabold uppercase">
                    <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60) + '').padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60) + '').padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Control buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (isPlaying) {
                          videoRef.current?.pause();
                        } else {
                          videoRef.current?.play();
                        }
                        setIsPlaying(!isPlaying);
                      }}
                      className="w-10 h-10 rounded-full bg-[#7C5CFF] text-white flex items-center justify-center hover:bg-[#6D4AE5] transition-all"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const muted = !isMuted;
                          if (videoRef.current) videoRef.current.muted = muted;
                          setIsMuted(muted);
                        }}
                        className="text-gray-450 hover:text-white p-1"
                      >
                        {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={isMuted ? 0 : volume}
                        onChange={e => {
                          const vol = parseFloat(e.target.value);
                          if (videoRef.current) {
                            videoRef.current.volume = vol;
                            videoRef.current.muted = false;
                          }
                          setVolume(vol);
                          setIsMuted(false);
                        }}
                        className="w-16 h-1 accent-[#7C5CFF] bg-slate-800 rounded-lg cursor-pointer hidden sm:block"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleClosePlayer}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xxs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Finish Session
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDUCATIONAL ARTICLE DRAWER */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%', opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white rounded-[32px] h-full shadow-2xl z-10 flex flex-col overflow-hidden text-left"
            >
              {/* Cover Image & Header */}
              <div className="relative h-44 bg-slate-100 shrink-0">
                <img src={selectedArticle.coverImage || selectedArticle.thumbnail} alt={selectedArticle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end">
                  <span className="text-[8px] font-black uppercase tracking-wider text-[#7C5CFF] bg-purple-50/90 px-2 py-0.5 rounded self-start">
                    {selectedArticle.category}
                  </span>
                  <h4 className="text-white font-black text-sm md:text-base mt-2 leading-snug line-clamp-2">
                    {selectedArticle.title}
                  </h4>
                </div>
                
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content text */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs select-text leading-relaxed font-semibold text-slate-700 scrollbar-thin">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-extrabold uppercase border-b border-slate-50 pb-2">
                  <span>Author: {selectedArticle.author || 'MindCare Coach'}</span>
                  <span>Duration: {selectedArticle.duration || '5 mins'}</span>
                </div>
                
                {/* Body Content */}
                <div className="prose prose-sm max-w-none text-slate-600 text-xxs font-medium space-y-3">
                  <p>
                    Mindfulness is more than just sitting quietly. When we examine {selectedArticle.category.toLowerCase()} from a psychological perspective, we find direct correlations between intentional focused breathing and diminished cortisol secretion in the adrenal glands.
                  </p>
                  <h4 className="font-bold text-slate-800 text-xs">Step 1: Diaphragmatic Regulation</h4>
                  <p>
                    Slow down the inhalation to 4 seconds, and lengthen the exhalation to 6 seconds. This simple ratio adjustments shifts the heart rate variability towards safety mode.
                  </p>
                  <h4 className="font-bold text-slate-800 text-xs">Step 2: Cognitive De-shackle</h4>
                  <p>
                    Notice critical self-talk and label it as "passing weather" rather than objective fact. This reduces secondary distress trigger loops.
                  </p>
                  <p>
                    Daily repetition of this simple sequence has been shown to decrease baseline workplace stress markers by up to 30% over a 4-week validation period. Focus on small sessions first.
                  </p>
                </div>
              </div>

              {/* Progress save buttons */}
              <div className="p-4 border-t border-slate-150 bg-slate-50 flex gap-3 shrink-0">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-colors"
                >
                  Close Reader
                </button>
                <button
                  onClick={() => handleMarkArticleRead(selectedArticle)}
                  disabled={articleProgressSubmitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95"
                >
                  {articleProgressSubmitting ? 'Saving...' : 'Mark as Read'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* YOUTUBE EMBED PLAYER MODAL */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-black border border-slate-800 rounded-[28px] overflow-hidden shadow-2xl z-10 flex flex-col text-white h-[450px]"
            >
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-900 flex justify-between items-center shrink-0">
                <div className="text-left min-w-0">
                  <span className="text-[8px] font-black uppercase text-sky-400 tracking-wider block">{selectedVideo.channel}</span>
                  <h4 className="font-extrabold text-xs text-white block truncate">{selectedVideo.title}</h4>
                </div>
                
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-1.5 rounded-full bg-slate-850 hover:bg-slate-750 text-slate-400 shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* YouTube Iframe element */}
              <div className="flex-1 w-full bg-black relative">
                {getYoutubeEmbedUrl(selectedVideo.url) ? (
                  <iframe
                    src={getYoutubeEmbedUrl(selectedVideo.url)}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-xs text-gray-400">Failed to render embedded YouTube player.</span>
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 font-bold hover:underline mt-2 text-xxs uppercase tracking-wider"
                    >
                      Open official YouTube URL in New Tab
                    </a>
                  </div>
                )}
              </div>

              {/* Footer details */}
              <div className="p-4 bg-slate-950 border-t border-[#1C1C3A] flex justify-between items-center shrink-0">
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-750 text-white font-extrabold text-xxs uppercase tracking-wider rounded-xl transition-all"
                >
                  Open in YouTube Website
                </a>

                <button
                  onClick={() => setSelectedVideo(null)}
                  className="px-4 py-2 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-extrabold text-xxs uppercase tracking-wider rounded-xl transition-all"
                >
                  Mark Watched
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
