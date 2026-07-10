import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Play, Smile, TrendingUp, BookOpen, Lock, ArrowRight } from 'lucide-react';
import meditatingWomanFacingImg from '../../assets/meditating_woman_facing.png';

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen pt-36 pb-20 flex items-center justify-center overflow-hidden bg-white">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-[5%] w-72 h-72 rounded-full bg-[#7C5CFC]/5 blur-3xl -z-10" />
      <div className="absolute bottom-10 right-[5%] w-96 h-96 rounded-full bg-[#A78BFA]/5 blur-3xl -z-10" />

      {/* Decorative Cloud */}
      <motion.div
        animate={{ x: [0, 15, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[12%] left-[10%] w-32 h-16 opacity-30 pointer-events-none -z-10 hidden md:block"
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-200/60 w-full h-full fill-current">
          <path d="M46 36.5C46 33.46 43.54 31 40.5 31C39.78 31 39.09 31.14 38.47 31.39C36.93 28.16 33.63 26 29.83 26C24.95 26 21 29.95 21 34.83C21 35.15 21.02 35.46 21.05 35.77C18.23 36.43 16 38.96 16 42C16 45.59 18.91 48.5 22.5 48.5H45.5C49.09 48.5 52 45.59 52 42C52 38.96 49.33 36.5 46 36.5Z" />
        </svg>
      </motion.div>

      {/* Decorative Leaves */}
      <motion.div
        animate={{ y: [0, 8, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[20%] right-[8%] w-16 h-16 opacity-20 pointer-events-none -z-10"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#A78BFA] w-full h-full fill-current">
          <path d="M17 8C8 10 9 21 9 21C9 21 3 13 7 6C11 -1 17 8 17 8Z" />
        </svg>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[15%] left-[8%] w-16 h-16 opacity-15 pointer-events-none -z-10"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#7C5CFC] w-full h-full fill-current">
          <path d="M17 8C8 10 9 21 9 21C9 21 3 13 7 6C11 -1 17 8 17 8Z" />
        </svg>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
        {/* Left Column - Content */}
        <div className="lg:col-span-6 text-left flex flex-col justify-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#7C5CFC]/8 text-[#7C5CFC] text-xs font-bold tracking-wide w-fit mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#7C5CFC]" />
            <span>AI-Powered Mental Wellness</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-tight text-gray-900 leading-[1.12] mb-6"
          >
            Your Mental<br />
            Wellness,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA]">
              Our Priority
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#64748B] text-base md:text-lg font-normal leading-relaxed max-w-xl mb-8"
          >
            AI-powered insights, mood tracking, journaling and personalized support designed to improve emotional wellbeing every day.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10"
          >
            <button
              onClick={() => navigate('/register')}
              className="bg-[#7C5CFC] hover:bg-[#6D4AE5] text-white font-bold text-base px-8 py-4 rounded-full shadow-lg shadow-[#7C5CFC]/15 hover:shadow-xl hover:shadow-[#7C5CFC]/25 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-transparent border-2 border-gray-100 hover:border-gray-200 text-gray-800 font-bold text-base px-8 py-4 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC]">
                <Play className="w-3 h-3 fill-[#7C5CFC] text-[#7C5CFC]" />
              </div>
              Learn More
            </button>
          </motion.div>

        </div>

        {/* Right Column - Illustration & Floating Cards */}
        <div className="lg:col-span-6 relative mt-12 lg:mt-0 flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
            className="w-full relative z-10 flex items-center justify-center max-w-[500px]"
          >
            {/* Soft Purple Circle Background */}
            <div className="absolute w-[82%] h-[82%] rounded-full bg-gradient-to-tr from-[#7C5CFC]/8 via-[#A78BFA]/10 to-[#8B5CF6]/5 blur-sm" />

            {/* Premium Meditating Woman Illustration */}
            <img
              src={meditatingWomanFacingImg}
              alt="Serene meditating woman facing forward illustration"
              className="w-full object-contain rounded-full mix-blend-multiply opacity-95 relative z-10 p-4"
            />

            {/* Floating Card 1: AI Insights (Top Left) */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute left-[-10%] top-[12%] z-20 bg-white/95 backdrop-blur-md border border-purple-100/50 shadow-md shadow-purple-100/30 rounded-2xl p-3 flex flex-col items-start w-[180px] text-left"
            >
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-gray-900">AI Insights</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-normal font-medium">
                Get personalized insights powered by advanced AI.
              </p>
            </motion.div>

            {/* Floating Card 2: Mood Tracking (Mid Left) */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-[-8%] bottom-[18%] z-20 bg-white/95 backdrop-blur-md border border-purple-100/50 shadow-md shadow-purple-100/30 rounded-2xl p-3 flex flex-col items-start w-[180px] text-left"
            >
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC]">
                  <Smile className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-gray-900">Mood Tracking</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-normal font-medium">
                Track your daily mood patterns and identify what affects you.
              </p>
            </motion.div>

            {/* Floating Card 3: Daily Journal (Top Right) */}
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute right-[-10%] top-[15%] z-20 bg-white/95 backdrop-blur-md border border-purple-100/50 shadow-md shadow-purple-100/30 rounded-2xl p-3 flex flex-col items-start w-[180px] text-left"
            >
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-gray-900">Daily Journal</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-normal font-medium">
                Reflect your thoughts and emotions in a safe space.
              </p>
            </motion.div>

            {/* Floating Card 4: Secure & Private (Mid Right) */}
            <motion.div
              animate={{ y: [0, -11, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              className="absolute right-[-6%] bottom-[22%] z-20 bg-white/95 backdrop-blur-md border border-purple-100/50 shadow-md shadow-purple-100/30 rounded-2xl p-3 flex flex-col items-start w-[180px] text-left"
            >
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-lg bg-[#7C5CFC]/10 flex items-center justify-center text-[#7C5CFC]">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-gray-900">Secure & Private</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-normal font-medium">
                Your data is encrypted and your privacy is our priority.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
