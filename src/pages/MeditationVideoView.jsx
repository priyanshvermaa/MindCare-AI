import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import api from '../services/api';
import { ArrowLeft, Play, Eye, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MeditationVideoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchProgress, setWatchProgress] = useState(0);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const response = await api.get(`/meditation/video/${id}`);
        if (response.data?.success) {
          setVideo(response.data.video);
          setWatchProgress(response.data.progress || 0);

          // Load related videos in the same category
          const relatedRes = await api.get(`/meditation/videos/${response.data.video.categorySlug}`);
          if (relatedRes.data?.success) {
            setRelatedVideos(
              relatedRes.data.videos.filter(v => v._id !== id).slice(0, 3)
            );
          }
        }
      } catch (err) {
        console.error('Failed to load video views:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVideoData();
  }, [id]);

  const handleStartWatch = async () => {
    // Record mock watch completion status on video play trigger to update MERN progress stats
    try {
      await api.post('/meditation/watch-history', {
        videoId: id,
        progress: 95
      });
      setWatchProgress(95);
    } catch (err) {
      console.warn(err);
    }
  };

  const getEmbedUrl = (url) => {
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
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B4B] flex font-poppins select-none relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-6xl mx-auto w-full space-y-6 text-left relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
              <div className="w-10 h-10 border-4 border-[#7C5CFF] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading video details...</p>
            </div>
          ) : video ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Player & Metadata */}
              <div className="lg:col-span-2 space-y-5">
                {/* Back button */}
                <button
                  onClick={() => navigate(`/meditation/${video.categorySlug}`)}
                  className="text-[10px] font-black uppercase tracking-widest text-[#73768F] hover:text-[#7C5CFF] inline-flex items-center gap-1.5 transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to {video.categorySlug.replace('-', ' ')}</span>
                </button>

                {/* Video Player */}
                <div className="w-full aspect-video rounded-[28px] overflow-hidden bg-black shadow-lg relative">
                  <iframe
                    title={video.title}
                    src={getEmbedUrl(video.youtubeUrl)}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={handleStartWatch}
                  />
                </div>

                {/* Metadata */}
                <div className="space-y-3.5 bg-white border border-[#E9E2FF]/55 rounded-[24px] p-6 shadow-[0_4px_25px_rgba(124,92,255,0.01)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-2.5 py-1.5 rounded-md inline-block">
                      {video.channel}
                    </span>
                    <span className="text-[9px] text-[#73768F] font-extrabold uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Duration: {video.duration}
                    </span>
                  </div>

                  <h1 className="text-xl font-black text-[#1C1C3A] tracking-tight leading-snug">
                    {video.title}
                  </h1>

                  <div className="flex items-center gap-3.5 text-[9px] text-gray-400 font-extrabold uppercase border-b border-gray-50 pb-3">
                    <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> {video.views}</span>
                    <span>•</span>
                    <span>Published {video.publishedDate}</span>
                    {watchProgress >= 90 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">Watched</span>
                      </>
                    )}
                  </div>

                  <div className="pt-2">
                    <h3 className="text-[10px] font-black text-[#1C1C3A] uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Related Videos */}
              <div className="space-y-5">
                <h3 className="font-black text-xs text-[#1C1C3A] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#FAF9FF] pb-3.5 pl-0.5 mt-1">
                  <Sparkles className="w-4 h-4 text-[#7C5CFF]" /> Related Videos
                </h3>

                <div className="space-y-4">
                  {relatedVideos.length > 0 ? (
                    relatedVideos.map((rv) => (
                      <div
                        key={rv._id}
                        onClick={() => navigate(`/meditation/video/${rv._id}`)}
                        className="bg-white border border-[#E9E2FF]/55 rounded-2xl overflow-hidden p-3 flex gap-3.5 hover:border-[#7C5CFF]/30 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="w-24 h-16 rounded-xl overflow-hidden relative shrink-0">
                          <img src={rv.thumbnail} alt={rv.title} className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 right-1 px-1 bg-black/75 rounded text-[7px] font-black text-white">
                            {rv.duration}
                          </div>
                        </div>
                        <div className="min-w-0 flex flex-col justify-between">
                          <h4 className="font-black text-[11px] text-slate-800 leading-snug line-clamp-2 group-hover:text-[#7C5CFF] transition-colors">
                            {rv.title}
                          </h4>
                          <span className="text-[8px] text-emerald-600 font-black uppercase block tracking-wider mt-1">
                            {rv.channel}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-400 font-bold text-center py-6">No related videos available.</p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-[#73768F]">
              <p className="text-sm font-bold">Video detail record not found.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
