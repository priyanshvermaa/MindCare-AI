import React, { useState, useEffect } from 'react';
import { Play, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import meditatingWomanFacingImg from '../../assets/meditating_woman_facing.png';

export default function RecommendationCard({ featuredMeditation }) {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Setup defaults if featured is not seeded
  const id = featuredMeditation?._id || '6a4fe572c2ae81aa04899e51';
  const title = featuredMeditation?.title || 'Calm the Racing Mind';
  const description = featuredMeditation?.description || 'A guided breathing meditation to reduce stress and bring inner peace.';
  const duration = featuredMeditation?.duration ? `${Math.round(featuredMeditation.duration / 60)} min` : '10 min';
  const difficulty = featuredMeditation?.difficulty || 'Beginner';

  // Fetch favorite status on load
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const response = await api.get('/meditations/favorites');
        if (response.data.success) {
          const list = response.data.favorites || [];
          setIsFavorited(list.some(f => f._id === id));
        }
      } catch (err) {
        console.warn('Could not fetch favorites status:', err.message);
      }
    };
    if (id) checkFavorite();
  }, [id]);

  const handleFavoriteToggle = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await api.post(`/meditations/${id}/favorite`);
      if (response.data.success) {
        setIsFavorited(!isFavorited);
      }
    } catch (err) {
      console.error('Failed to toggle meditation bookmark:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSession = () => {
    navigate('/meditation');
  };

  return (
    <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left flex flex-col justify-between h-full relative overflow-hidden">
      {/* Title */}
      <h3 className="font-extrabold text-xs text-[#1C1C3A] uppercase tracking-wider flex items-center gap-1.5 pl-0.5 border-b border-[#FAF9FF] pb-3 mb-4">
        <span className="text-[#7C5CFF]">★</span> Today's Recommendation
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-2">
        {/* Illustration */}
        <div className="flex items-center justify-center relative select-none">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#7C5CFF]/8 to-indigo-100/10 blur-xl absolute" />
          <img
            src={meditatingWomanFacingImg}
            alt="Meditating illustration"
            className="w-28 h-28 object-contain relative z-10 pointer-events-none"
          />
        </div>

        {/* Session Title */}
        <h4 className="text-base font-black text-gray-900 tracking-tight leading-snug">
          {title}
        </h4>

        {/* Description */}
        <p className="text-[11px] text-gray-500 font-semibold leading-relaxed max-w-xs text-center">
          {description}
        </p>

        {/* Duration + Difficulty */}
        <span className="inline-block px-2.5 py-1 rounded-full bg-[#7C5CFF]/8 text-[#7C5CFF] text-[9px] font-black uppercase tracking-wider">
          {duration} • {difficulty}
        </span>

        {/* Start Session Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleStartSession}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-bold text-xxs uppercase tracking-wider rounded-xl shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Start Session
          </button>
          
          <button
            onClick={handleFavoriteToggle}
            disabled={submitting}
            className={`w-9.5 h-9.5 rounded-xl border flex items-center justify-center transition-all ${
              isFavorited
                ? 'bg-rose-50 border-rose-100 text-rose-500'
                : 'bg-white border-[#E9E2FF] hover:bg-gray-50 text-gray-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
