import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import api from '../services/api';
import { ArrowLeft, Clock, BookOpen, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MeditationArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [article, setArticle] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const maxProgressRef = useRef(0);
  const lastSavedProgressRef = useRef(0);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get(`/meditation/article/${id}`);
        if (response.data?.success) {
          setArticle(response.data.article);
          setProgress(response.data.progress || 0);
          setCompleted(response.data.completed || false);
          maxProgressRef.current = response.data.progress || 0;
          lastSavedProgressRef.current = response.data.progress || 0;
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (!article) return;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const currentScroll = window.scrollY;
      const calculatedProgress = Math.min(100, Math.round((currentScroll / totalHeight) * 100));
      
      if (calculatedProgress > maxProgressRef.current) {
        maxProgressRef.current = calculatedProgress;
        setProgress(calculatedProgress);
        if (calculatedProgress >= 95) {
          setCompleted(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      if (maxProgressRef.current > lastSavedProgressRef.current) {
        try {
          await api.post('/meditation/reading-progress', {
            articleId: id,
            progress: maxProgressRef.current
          });
          lastSavedProgressRef.current = maxProgressRef.current;
        } catch (err) {
          console.warn('Failed to save reading progress:', err);
        }
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      if (maxProgressRef.current > lastSavedProgressRef.current) {
        api.post('/meditation/reading-progress', {
          articleId: id,
          progress: maxProgressRef.current
        }).catch(() => {});
      }
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B4B] flex font-poppins select-none relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Reading progress bar at top of layout */}
        <div className="w-full h-1.5 bg-slate-100 sticky top-[70px] z-30">
          <div 
            className="h-full bg-gradient-to-r from-[#7C5CFF] to-[#A78BFA] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-3xl mx-auto w-full space-y-6 text-left relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
              <div className="w-10 h-10 border-4 border-[#7C5CFF] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading article...</p>
            </div>
          ) : article ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Navigation Back */}
              <button
                onClick={() => navigate(`/meditation/${article.categorySlug}`)}
                className="text-[10px] font-black uppercase tracking-widest text-[#73768F] hover:text-[#7C5CFF] inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {article.categorySlug.replace('-', ' ')}</span>
              </button>

              {/* Title & Metadata */}
              <div className="space-y-3">
                <span className="text-[8px] font-black uppercase text-[#7C5CFF] tracking-wider bg-[#7C5CFF]/8 px-2.5 py-1.5 rounded-md inline-block">
                  Article
                </span>
                <h1 className="text-3xl font-black text-[#1C1C3A] tracking-tight leading-tight">
                  {article.title}
                </h1>
                
                <div className="flex items-center gap-4 text-[10px] text-[#73768F] font-extrabold uppercase pt-1.5">
                  <span className="text-[#1C1C3A]">By {article.author}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {article.readingTime}</span>
                  {completed && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Read Completed
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Hero Image */}
              <div className="w-full h-80 rounded-[28px] overflow-hidden shadow-sm relative">
                <img 
                  src={article.heroImage} 
                  alt={article.title} 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Complete Article Content */}
              <div className="prose prose-slate max-w-none text-[#475569] leading-relaxed space-y-6 pt-3">
                {renderContent(article.content)}
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-[#73768F]">
              <p className="text-sm font-bold">Article not found.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const parseBoldText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-extrabold text-[#1C1C3A]">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderContent = (content) => {
  if (!content) return null;
  
  // Split by line breaks to process each line individually
  const lines = content.split('\n');
  
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    
    // Headers
    if (trimmed.startsWith('###')) {
      return (
        <h3 key={i} className="text-base font-black text-[#1C1C3A] pt-4 pb-1.5 uppercase tracking-wide border-b border-slate-100 mt-2 block">
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      );
    }
    if (trimmed.startsWith('##')) {
      return (
        <h2 key={i} className="text-lg font-black text-[#1C1C3A] pt-5 pb-1.5 uppercase tracking-wide border-b border-slate-150 mt-3 block">
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
    }
    
    // Bullet/list items
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
      const cleaned = trimmed.replace(/^([•\-\*]|\d+\.)\s+/, '');
      return (
        <div key={i} className="flex items-start gap-2.5 my-2 pl-4 text-slate-650">
          <span className="text-[#7C5CFF] mt-1.5 shrink-0">•</span>
          <span className="leading-relaxed font-semibold text-sm text-slate-650">
            {parseBoldText(cleaned)}
          </span>
        </div>
      );
    }

    // Normal paragraph
    return (
      <p key={i} className="leading-relaxed font-medium text-sm text-slate-600 my-3 block">
        {parseBoldText(trimmed)}
      </p>
    );
  });
};
