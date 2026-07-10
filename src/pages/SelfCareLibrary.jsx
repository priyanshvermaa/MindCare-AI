import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import api from '../services/api';
import { 
  Search, Library, FileText, Video, BookOpen, Clock, 
  ArrowRight, Heart, Share2, X, Play, Award, CheckCircle, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SelfCareLibrary() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isLightMode } = useTheme();
  
  // Data States
  const [resources, setResources] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all'); // all, article, video
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Detail Overlay States
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const categoriesList = [
    'Stress Relief',
    'Sleep',
    'Morning',
    'Focus',
    'Anxiety',
    'Self Love'
  ];

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeType !== 'all') params.type = activeType;
      const [resData, bookmarkData] = await Promise.all([
        api.get('/resources', { params }),
        api.get('/bookmarks').catch(() => ({ data: { bookmarks: [] } }))
      ]);
      setResources(resData.data.resources || []);
      setBookmarks(bookmarkData.data.bookmarks || []);
    } catch (err) {
      console.warn('Failed to load resource library: ', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [activeType]);

  const handleToggleBookmark = async (resItem) => {
    try {
      const payload = {
        itemType: resItem.type,
        itemId: resItem._id,
        title: resItem.title,
        description: resItem.description,
        url: resItem.url,
        thumbnail: resItem.thumbnail || resItem.coverImage,
        duration: resItem.duration,
        category: resItem.category,
        author: resItem.author || 'MindCare Expert',
        publishedDate: resItem.publishedDate || new Date()
      };
      await api.post('/bookmarks/toggle', payload);
      // Refresh local states
      const bookmarkData = await api.get('/bookmarks');
      setBookmarks(bookmarkData.data.bookmarks || []);
      
      // Update inline status
      setResources(prev => prev.map(item => {
        if (item._id === resItem._id) {
          return { ...item, bookmarked: !item.bookmarked };
        }
        return item;
      }));

      // Update detail overlay if open
      if (selectedArticle && selectedArticle._id === resItem._id) {
        setSelectedArticle(prev => ({ ...prev, bookmarked: !prev.bookmarked }));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleUpdateProgress = async (resourceId, progressVal) => {
    try {
      await api.post(`/resources/${resourceId}/progress`, {
        progress: progressVal,
        currentTime: 0
      });
      // Refresh list
      fetchResources();
    } catch (err) {
      console.error('Failed to save resource progress:', err);
    }
  };

  const handleShare = (resItem) => {
    navigator.clipboard.writeText(window.location.origin + `/library?id=${resItem._id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || 
                            res.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categoryGradients = {
    'hydration': 'from-sky-400 to-blue-500',
    'meditation': 'from-purple-400 to-indigo-500',
    'anxiety': 'from-rose-400 to-orange-500',
    'stress': 'from-amber-400 to-orange-500',
    'general': 'from-emerald-400 to-teal-500',
    'default': 'from-violet-400 to-fuchsia-500'
  };

  const getGradient = (cat) => {
    const cleanCat = cat?.toLowerCase() || '';
    for (const key of Object.keys(categoryGradients)) {
      if (cleanCat.includes(key)) return categoryGradients[key];
    }
    return categoryGradients.default;
  };

  return (
    <div className="min-h-screen bg-white text-[#1D1B3A] flex font-poppins select-none relative">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation header */}
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 px-8 lg:px-10 py-8 pb-10 max-w-7xl mx-auto w-full space-y-8 text-left relative z-10">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-1">
            <div className="flex items-end gap-3.5 text-left">
              <div className="w-12 h-12 rounded-xl bg-[#F8F5FF] border border-[#E9E2FF] flex items-center justify-center text-[#7C5CFF] shadow-sm shrink-0 mb-0.5">
                <Library className="w-5.5 h-5.5" />
              </div>
              <div className="pb-0.5">
                <h1 className="text-2.5xl font-black text-[#1D1B3A] tracking-tight leading-none mb-2">Self-Care Library</h1>
                <p className="text-xs text-[#6F7392] font-semibold leading-none">
                  Explore clinical coping strategies, breathing guides, and mindfulness videos.
                </p>
              </div>
            </div>
          </div>

          {/* Search, filters, view segments block */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full bg-white p-3 rounded-[24px] border border-[#E9E2FF] shadow-sm">
            {/* Left: Resource Type switchers */}
            <div className="flex bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100/60 justify-start items-center">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveType('all')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeType === 'all' ? 'bg-[#7C5CFF]/8 text-[#7C5CFF] font-black' : 'text-[#6F7392] hover:text-gray-700'
                  }`}
                >
                  All Resources
                </button>
                <button
                  onClick={() => setActiveType('article')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeType === 'article' ? 'bg-[#7C5CFF]/8 text-[#7C5CFF] font-black' : 'text-[#6F7392] hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Articles
                </button>
                <button
                  onClick={() => setActiveType('video')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeType === 'video' ? 'bg-[#7C5CFF]/8 text-[#7C5CFF] font-black' : 'text-[#6F7392] hover:text-gray-700'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> Videos
                </button>
              </div>
            </div>

            {/* Right: Search box */}
            <div className="relative w-full md:w-80 h-10">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search self-care library..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-full bg-[#FAFAFC] border border-[#ECE7FF] rounded-xl pl-9.5 pr-3.5 text-xs text-gray-900 placeholder-gray-450 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] font-semibold"
              />
            </div>
          </div>

          {/* Categories tags block */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-xxs font-extrabold uppercase tracking-wider transition-all border ${
                activeCategory === 'all'
                  ? 'bg-[#7C5CFF] text-white border-transparent shadow-sm'
                  : 'bg-white border-[#E9E2FF] text-[#6F7392] hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xxs font-extrabold uppercase tracking-wider transition-all border ${
                  activeCategory === cat
                    ? 'bg-[#7C5CFF] text-white border-transparent shadow-sm'
                    : 'bg-white border-[#E9E2FF] text-[#6F7392] hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards Grid layout */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-60 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-4">
              {filteredResources.map(res => {
                const isBookmarked = bookmarks.some(b => b.itemId === res._id);
                return (
                  <div
                    key={res._id}
                    onClick={() => {
                      if (res.type === 'video') {
                        setSelectedVideo(res);
                        handleUpdateProgress(res._id, 100); // Auto complete on watch open
                      } else {
                        setSelectedArticle(res);
                        handleUpdateProgress(res._id, 20); // Initial open progress
                      }
                    }}
                    className="bg-white rounded-[24px] border border-[#E9E2FF] overflow-hidden shadow-[0_8px_30px_rgba(124,92,255,0.04)] flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300 group cursor-pointer"
                  >
                    {/* Card Thumbnail / Header Visual */}
                    <div className={`h-36 bg-gradient-to-tr ${getGradient(res.category || res.type)} p-6 flex flex-col justify-between text-white relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_60%)] pointer-events-none" />
                      
                      <div className="flex justify-between items-start z-10">
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/10 text-white tracking-widest leading-none">
                          {res.category || 'General'}
                        </span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-black/10 text-white flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {res.duration}
                        </span>
                      </div>

                      <div className="z-10 flex items-center justify-between mt-auto">
                        {res.type === 'video' ? (
                          <div className="w-8.5 h-8.5 bg-white/25 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        ) : (
                          <BookOpen className="w-7 h-7 opacity-90 stroke-[1.5]" />
                        )}
                        {res.progress === 100 && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded">Completed</span>
                        )}
                      </div>
                    </div>

                    {/* Card Content body */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-4 text-left">
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-sm text-[#1D1B3A] line-clamp-1 leading-snug group-hover:text-[#7C5CFF] transition-colors">{res.title}</h3>
                        <p className="text-xs text-gray-555 leading-relaxed line-clamp-2 font-semibold">{res.description}</p>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] font-black text-[#7C5CFF] uppercase tracking-widest">
                          {res.type === 'video' ? 'Watch Video' : 'Read Article'} <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(res);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isBookmarked 
                              ? 'bg-rose-50 border-rose-100 text-rose-500' 
                              : 'bg-white border-gray-200 text-gray-400 hover:text-rose-500'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-gray-400 bg-white rounded-3xl border border-[#E9E2FF] shadow-sm">
              No matching resources found in the self-care library.
            </div>
          )}

        </main>
      </div>

      {/* ARTICLE READER OVERLAY */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-white border border-[#E9E2FF]/80 rounded-[32px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh] text-left"
            >
              {/* Cover Image Header */}
              <div className="relative h-48 md:h-56 bg-gray-150 shrink-0">
                <img 
                  src={selectedArticle.coverImage || 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800'} 
                  alt={selectedArticle.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute right-4 top-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-[#7C5CFF] text-white tracking-widest">
                    {selectedArticle.category}
                  </span>
                  <h2 className="text-xl md:text-2xl font-black mt-2 leading-tight drop-shadow-sm">{selectedArticle.title}</h2>
                </div>
              </div>

              {/* Meta details bar */}
              <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between text-xxs text-gray-500 font-extrabold uppercase tracking-wider bg-gray-50/50">
                <div className="flex gap-4">
                  <span>By {selectedArticle.author || 'MindCare Expert'}</span>
                  <span>•</span>
                  <span>{selectedArticle.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookmark(selectedArticle)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      bookmarks.some(b => b.itemId === selectedArticle._id)
                        ? 'bg-rose-50 border-rose-100 text-rose-500'
                        : 'bg-white border-gray-250 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${bookmarks.some(b => b.itemId === selectedArticle._id) ? 'fill-current' : ''}`} />
                    <span>Save</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare(selectedArticle)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-250 hover:bg-gray-50 rounded-lg text-gray-600 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>

              {/* Article Content body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-4 flex-1 select-text scrollbar-thin">
                <div className="prose prose-sm max-w-none text-xs text-gray-700 leading-relaxed font-semibold">
                  {selectedArticle.fullContent ? (
                    selectedArticle.fullContent.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('###')) {
                        return <h3 key={idx} className="text-sm font-black text-gray-900 mt-4 mb-2 uppercase tracking-wide">{paragraph.replace('###', '').trim()}</h3>;
                      }
                      return <p key={idx} className="mb-3.5">{paragraph.trim()}</p>;
                    })
                  ) : (
                    <p>{selectedArticle.description}</p>
                  )}
                </div>
              </div>

              {/* Progress Tracking Bottom Bar */}
              <div className="p-5 border-t border-gray-150 bg-gray-50/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#7C5CFF]" />
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">
                    Reading Strategy Progress
                  </span>
                </div>
                
                {selectedArticle.progress === 100 ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                    <CheckCircle className="w-4.5 h-4.5 fill-emerald-50 text-emerald-600" /> Completed
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleUpdateProgress(selectedArticle._id, 100);
                      setSelectedArticle(prev => ({ ...prev, progress: 100 }));
                    }}
                    className="px-5 py-2.5 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* YOUTUBE EMBED VIDEO PLAYER OVERLAY */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-black rounded-[24px] overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              {/* Overlay Close Button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute right-4 top-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* YouTube IFrame Embed Player */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <iframe
                  src={selectedVideo.url}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Video metadata information */}
              <div className="p-6 bg-[#121214] text-white flex flex-col gap-3 text-left">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#7C5CFF] px-2 py-0.5 rounded bg-white/10">
                      {selectedVideo.category}
                    </span>
                    <h3 className="text-sm font-black mt-2 leading-tight">{selectedVideo.title}</h3>
                  </div>
                  
                  <button
                    onClick={() => handleToggleBookmark(selectedVideo)}
                    className={`p-2 rounded-xl border transition-colors shrink-0 ${
                      bookmarks.some(b => b.itemId === selectedVideo._id)
                        ? 'bg-rose-50/10 border-rose-500/30 text-rose-500'
                        : 'border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4.5 h-4.5 ${bookmarks.some(b => b.itemId === selectedVideo._id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xxs text-gray-400 font-bold">
                  <span>Channel: {selectedVideo.channel || 'MindCare Channel'}</span>
                  <span>•</span>
                  <span>{selectedVideo.views || '1K views'}</span>
                  <span>•</span>
                  <span>{selectedVideo.duration}</span>
                </div>

                <p className="text-[11px] text-gray-450 leading-relaxed font-medium">
                  {selectedVideo.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
