import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Phone, MessageSquare, ShieldAlert, Heart, 
  CheckCircle, Play, ChevronRight, Activity, Wind, Eye, X 
} from 'lucide-react';

const CRISIS_LINES_DEFAULTS = [
  {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    description: 'Free and confidential support for anyone in suicidal crisis or emotional distress.',
    badge: '24/7',
    actionText: 'CALL 988',
    actionType: 'tel',
    bgClass: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 text-white',
    iconColor: 'text-rose-500 bg-rose-50'
  },
  {
    name: 'Crisis Text Line',
    phone: '741741',
    description: 'Text HOME to 741741 to connect with a trained crisis counselor.',
    badge: '24/7',
    actionText: 'TEXT HOME TO 741741',
    actionType: 'sms',
    bgClass: 'bg-[#7C5CFF] hover:bg-[#6D4AE5] shadow-[#7C5CFF]/15 text-white',
    iconColor: 'text-[#7C5CFF] bg-[#7C5CFF]/8'
  },
  {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    description: 'Information service for individuals and families facing mental health or substance use challenges.',
    badge: '24/7',
    actionText: 'CALL 1-800-662-HELP (4357)',
    actionType: 'tel',
    bgClass: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white',
    iconColor: 'text-blue-500 bg-blue-50'
  }
];

export default function EmergencyHelp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Data States
  const [crisisResources, setCrisisResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal / Detail States
  const [activeGuide, setActiveGuide] = useState(null); // 'panic', 'grounding'

  // Detect local emergency number based on browser settings/auth fallback
  const getEmergencyNumber = () => {
    if (user?.settings?.emergencyNumber) return user.settings.emergencyNumber;
    return '911'; // Safe default
  };

  const fetchCrisisData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/emergency');
      if (response.data && response.data.crisisResources && response.data.crisisResources.length > 0) {
        // Map backend items and filter out Trevor Project
        const filteredFromBackend = response.data.crisisResources.filter(item => 
          !item.name.toLowerCase().includes('trevor')
        );
        const items = filteredFromBackend.map((item, idx) => {
          const defaults = CRISIS_LINES_DEFAULTS[idx % CRISIS_LINES_DEFAULTS.length];
          return {
            ...defaults,
            name: item.name || defaults.name,
            phone: item.phone || defaults.phone,
            description: item.description || defaults.description
          };
        });
        setCrisisResources(items);
      } else {
        setCrisisResources(CRISIS_LINES_DEFAULTS);
      }
    } catch (err) {
      console.warn('Failed to load emergency data: ', err);
      setCrisisResources(CRISIS_LINES_DEFAULTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrisisData();
  }, []);

  const handleAction = (item) => {
    if (item.actionType === 'tel') {
      window.location.href = `tel:${item.phone.replace(/[^0-9]/g, '')}`;
    } else if (item.actionType === 'sms') {
      window.location.href = `sms:${item.phone}&body=HOME`;
    }
  };



  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex font-poppins select-none relative">
      
      {/* Sidebar navigation */}
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
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 block mb-2">Crisis Care</span>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Emergency Help & Support</h1>
              <p className="text-xs text-gray-500 font-semibold mt-2.5">You are not alone. Help is available 24/7.</p>
            </div>
          </div>



          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (Danger Alert Card & Crisis Responders) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Danger Warning Alert Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FFF5F5] border border-[#FFE3E3] rounded-[24px] p-6.5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex gap-4 items-start text-left">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#F43F5E] shrink-0 shadow-sm mt-0.5">
                    <ShieldAlert className="w-5.5 h-5.5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-[#1D1B3A] tracking-tight">If you are in immediate danger</h3>
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed max-w-lg">
                      If you are having thoughts of self-harm, experiencing a medical emergency, or are in immediate danger, call your local emergency services immediately.
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${getEmergencyNumber()}`}
                  className="flex items-center gap-2 px-6 py-3 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-200 transition-all shrink-0 self-stretch md:self-auto justify-center"
                >
                  <Phone className="w-3.5 h-3.5 fill-white" /> CALL {getEmergencyNumber()}
                </a>
              </motion.div>

              {/* Crisis Support Lines Grid */}
              <div className="space-y-4">
                <div className="text-left pl-0.5">
                  <h2 className="font-extrabold text-base text-gray-900">Crisis Support Lines</h2>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase mt-1 tracking-wider">Free, confidential, and available 24/7.</p>
                </div>

                <div className="space-y-4 pt-1">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-50 rounded-[24px] border border-gray-100 animate-pulse" />
                    ))
                  ) : crisisResources.length > 0 ? (
                    crisisResources.map((item, idx) => {
                      const isSms = item.actionType === 'sms';
                      const Icon = isSms ? MessageSquare : Phone;

                      return (
                        <div
                          key={idx}
                          className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-5.5 shadow-[0_4px_20px_rgba(124,92,255,0.01)] flex flex-col md:flex-row justify-between items-start md:items-center gap-5 text-left transition-all hover:border-[#7C5CFF]/30"
                        >
                          <div className="flex gap-4 items-start min-w-0">
                            <div className={`w-10 h-10 rounded-2xl ${item.iconColor} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-xs text-gray-900">{item.name}</h4>
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-[7.5px] font-black text-[#F43F5E] uppercase tracking-widest leading-none">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 font-semibold leading-relaxed max-w-md">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAction(item)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xxs tracking-wider uppercase transition-all shadow-sm shrink-0 self-stretch md:self-auto justify-center ${item.bgClass}`}
                          >
                            <Icon className="w-3.5 h-3.5 fill-current" /> {item.actionText}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 rounded-[24px] border border-gray-100 text-center text-xs text-gray-400 font-semibold italic">
                      No emergency crisis support resources available.
                    </div>
                  )}
                </div>

                <p className="text-[9px] text-gray-450 font-semibold pl-1.5 pt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" /> Your safety matters. These services are independent and not affiliated with MindCare AI.
                </p>
              </div>

            </div>

            {/* Right Column (Self Help Tools & Reminder) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Self Help Tools Deck */}
              <div className="bg-white border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider pl-0.5">Self-Help Tools</h3>
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase mt-1 tracking-wider pl-0.5 mb-5">Use these tools to calm your mind and body.</p>

                  <div className="space-y-3.5">
                    {[
                      { 
                        title: 'Panic Attack First Aid', 
                        desc: 'Step-by-step guide', 
                        icon: Activity, 
                        color: 'text-rose-500 bg-rose-50 border-rose-100', 
                        action: () => setActiveGuide('panic') 
                      },
                      { 
                        title: 'Grounding Exercises', 
                        desc: '5-4-3-2-1 technique', 
                        icon: Eye, 
                        color: 'text-emerald-500 bg-emerald-50 border-emerald-100', 
                        action: () => setActiveGuide('grounding') 
                      },
                      { 
                        title: 'Breathing Exercises', 
                        desc: 'Calm your mind in minutes', 
                        icon: Wind, 
                        color: 'text-sky-500 bg-sky-50 border-sky-100', 
                        action: () => navigate('/meditation') 
                      }
                    ].map((tool, i) => {
                      const Icon = tool.icon;
                      return (
                        <div
                          key={i}
                          onClick={tool.action}
                          className="flex items-center justify-between p-2 rounded-2xl border border-transparent hover:border-[#E9E2FF]/40 hover:bg-[#FAF9FF]/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8.5 h-8.5 rounded-xl ${tool.color} flex items-center justify-center shrink-0`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <span className="font-extrabold text-xs text-gray-900 block leading-tight">{tool.title}</span>
                              <span className="text-[9px] text-[#73768F] font-bold block mt-0.5">{tool.desc}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7C5CFF] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Guides popup overlay view */}
              <AnimatePresence>
                {activeGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 rounded-[24px] bg-[#7C5CFF]/3 border border-[#7C5CFF]/15 text-left space-y-4"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-[#7C5CFF]/10">
                      <span className="text-[10px] font-black text-[#7C5CFF] uppercase tracking-wider">
                        {activeGuide === 'panic' ? 'Panic Relief Guide' : '5-4-3-2-1 Grounding Sequence'}
                      </span>
                      <button onClick={() => setActiveGuide(null)} className="text-gray-400 hover:text-gray-700">
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {activeGuide === 'panic' ? (
                      <div className="space-y-3 text-xs leading-relaxed text-gray-650">
                        <p><strong>1. Regulate Breathing:</strong> Inhale slowly through your nose for 4 seconds, hold for 4, exhale for 4. Repeat this box pattern 5 times.</p>
                        <p><strong>2. Temperature Shock:</strong> Splash freezing cold water on your face. This stimulates the vagus nerve and triggers the mammalian dive reflex to drop heart rates instantly.</p>
                        <p><strong>3. Relinquish Control:</strong> Accept the sensation. Adrenaline peaks in 10 minutes and decays. Keep repeating: <i>"I am safe, this feeling will pass."</i></p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-[11px] leading-relaxed text-gray-650">
                        <p><strong>5 See:</strong> Look around for 5 unique objects (e.g. clock, picture, pen).</p>
                        <p><strong>4 Feel:</strong> Feel 4 textures (e.g. feet on cold ground, shirt on skin, key ring).</p>
                        <p><strong>3 Hear:</strong> Hear 3 distant sounds (e.g. traffic hum, air vent, wind).</p>
                        <p><strong>2 Smell:</strong> Smell 2 aromas (e.g. coffee, book cover, soap).</p>
                        <p><strong>1 Taste:</strong> Focus on 1 taste (e.g. mint candy, toothpaste flavor).</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Important Medical Disclaimer Card */}
              <div className="bg-[#FAF9FF]/40 border border-[#E9E2FF]/60 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(124,92,255,0.01)] text-left space-y-5">
                <div className="flex items-center gap-2 text-rose-500">
                  <Heart className="w-5.5 h-5.5 fill-rose-500/10" />
                  <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider pl-0.5">Important Reminder</h3>
                </div>

                <p className="text-[11px] text-gray-500 font-semibold leading-relaxed pl-0.5">
                  MindCare AI is here to support your wellness journey, but it is not a substitute for professional medical or psychological care.
                </p>

                <div className="space-y-3 pl-0.5">
                  {[
                    'Do not ignore serious medical conditions',
                    'Seek professional help for ongoing concerns',
                    'In case of emergency, contact local services'
                  ].map((disclaimer, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-xs font-bold text-gray-700 leading-none">{disclaimer}</span>
                    </div>
                  ))}
                </div>

                {/* Hands SVG shape */}
                <div className="flex justify-center pt-3 select-none pointer-events-none text-[#7C5CFF]/15">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
