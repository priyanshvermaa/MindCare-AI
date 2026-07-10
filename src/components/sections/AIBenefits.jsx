import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw, BarChart2, ShieldCheck, Heart } from 'lucide-react';

export const AIBenefits = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      title: 'Cognitive Reframing',
      icon: RefreshCw,
      desc: 'Automatic detection of anxiety triggers and cognitive traps (like personalization or catastrophizing). MindCare guides users to reformulate stressful beliefs in real time.',
      badge: 'CBT Engine'
    },
    {
      title: 'Workforce Stress Trends',
      icon: BarChart2,
      desc: 'Aggregated analytics track macro levels of workplace anxiety and workload stress. Leaders receive notifications of burnout spikes without breaching individual privacy.',
      badge: 'Systemic Health'
    },
    {
      title: 'Confidential Safety Safeguard',
      icon: ShieldCheck,
      desc: 'Dual-layered encryption ensures clinical conversations remain strictly confidential. If safety flags trip, automatic warm routing triggers immediately.',
      badge: 'Clinically Safe'
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-white relative">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#7C5CFC]/5 blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Header */}
        <div className="text-left mb-16 max-w-3xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C5CFC] mb-3">
            Deep Capabilities
          </h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            How MindCare AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA]">transforms</span> employee mental health.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column - Tabs list */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-start text-left p-6 rounded-2xl transition-all duration-300 border ${
                    isActive
                      ? 'bg-white border-purple-100 shadow-md shadow-purple-100/25'
                      : 'bg-transparent border-transparent hover:bg-purple-50/20 hover:border-purple-100/30'
                  }`}
                >
                  <div className={`p-3 rounded-xl border mr-4 mt-0.5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#7C5CFC] bg-[#7C5CFC]/10 border-[#7C5CFC]/20'
                      : 'text-gray-400 bg-gray-50 border-gray-100'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className={`font-bold text-lg ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{tab.title}</span>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC] font-semibold uppercase tracking-wider border border-[#7C5CFC]/20">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[#6B7280] text-sm md:text-base leading-relaxed">
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column - Dynamic visual dashboard simulation */}
          <div className="lg:col-span-7 h-[420px] relative">
            <div className="h-full flex flex-col overflow-hidden border border-purple-100 rounded-3xl bg-white shadow-xl shadow-purple-100/20">
              {/* Card Header bar */}
              <div className="bg-purple-50/30 px-6 py-4 flex items-center justify-between border-b border-purple-100/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#7C5CFC] animate-pulse" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Interactive Demonstration — {tabs[activeTab].title}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#7C5CFC]"></span>
              </div>

              {/* Card content display */}
              <div className="flex-1 p-6 md:p-8 flex items-center justify-center bg-white relative">
                <AnimatePresence mode="wait">
                  {activeTab === 0 && (
                    <motion.div
                      key="cbt"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className="w-full flex flex-col gap-4 max-w-md"
                    >
                      {/* Thought Record Simulation */}
                      <div className="bg-red-50/60 border border-red-100 rounded-xl p-4 text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block mb-1">
                          Automatic Core Belief (Distorted)
                        </span>
                        <p className="text-gray-800 text-sm italic">
                          "I missed one deadline. The project is ruined, and my teammates will think I'm a failure."
                        </p>
                      </div>

                      <div className="flex justify-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <div className="w-0.5 h-6 bg-purple-100"></div>
                          <span className="text-[10px] uppercase font-bold text-[#7C5CFC] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                            Distortion Identified: Catastrophizing
                          </span>
                          <div className="w-0.5 h-6 bg-purple-100"></div>
                        </div>
                      </div>

                      <div className="bg-purple-50/40 border border-purple-100/50 rounded-xl p-4 text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C5CFC] block mb-1">
                          Reframed Perspective (Realistic)
                        </span>
                        <p className="text-gray-800 text-sm">
                          "While missing a deadline isn't ideal, my team values my work. We can recalibrate tomorrow, and it doesn't define my worth."
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 1 && (
                    <motion.div
                      key="chart"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full flex flex-col justify-between max-w-lg"
                    >
                      <div className="flex justify-between items-center mb-4 shrink-0">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 text-left">
                            Weekly Stress Indices (Aggregate)
                          </h4>
                          <p className="text-xs text-gray-500 text-left">
                            Filtered for Product & Engineering, anonymized.
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC] font-semibold">
                          Avg: Stable
                        </span>
                      </div>

                      {/* Mock Chart using SVG */}
                      <div className="flex-1 min-h-[160px] relative mt-2">
                        <svg className="w-full h-full" viewBox="0 0 400 160">
                          {/* Grid Lines */}
                          <line x1="0" y1="40" x2="400" y2="40" stroke="#f3f4f6" strokeDasharray="4 4" />
                          <line x1="0" y1="80" x2="400" y2="80" stroke="#f3f4f6" strokeDasharray="4 4" />
                          <line x1="0" y1="120" x2="400" y2="120" stroke="#f3f4f6" strokeDasharray="4 4" />
                          
                          {/* Chart Lines */}
                          <path
                            d="M0,120 Q50,70 100,110 T200,60 T300,90 T400,30"
                            fill="none"
                            stroke="url(#gradient-indigo-lavender)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          
                          {/* Area under Chart */}
                          <path
                            d="M0,120 Q50,70 100,110 T200,60 T300,90 T400,30 L400,160 L0,160 Z"
                            fill="url(#area-gradient)"
                            opacity="0.15"
                          />

                          {/* Gradient Definitions */}
                          <defs>
                            <linearGradient id="gradient-indigo-lavender" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#7C5CFC" />
                              <stop offset="100%" stopColor="#A78BFA" />
                            </linearGradient>
                            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7C5CFC" />
                              <stop offset="100%" stopColor="#ffffff" />
                            </linearGradient>
                          </defs>

                          {/* Interactive Dot */}
                          <circle cx="200" cy="60" r="5" fill="#7C5CFC" />
                          <circle cx="200" cy="60" r="10" fill="none" stroke="#7C5CFC" strokeWidth="2" className="animate-ping" />
                        </svg>
                      </div>

                      {/* X-axis legends */}
                      <div className="flex justify-between text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-4 shrink-0">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed (Sprint Dev)</span>
                        <span>Thu</span>
                        <span>Fri</span>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 2 && (
                    <motion.div
                      key="safety"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-sm"
                    >
                      <div className="bg-white border border-purple-50 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                        {/* Glow accent */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-xl"></div>
                        
                        <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C5CFC] mb-4">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-gray-900 mb-2 text-left">
                          Confidential Routing Sandbox
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed text-left mb-6">
                          Double-key encryption masks user IDs. In the event of severe emotional escalation, the system triggers real-time support bridges automatically.
                        </p>
                        <div className="flex items-center justify-between border-t border-purple-50 pt-4">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Privacy Rating
                          </span>
                          <span className="text-xs text-[#7C5CFC] font-semibold flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-current" /> Zero-Leak Guarantee
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
