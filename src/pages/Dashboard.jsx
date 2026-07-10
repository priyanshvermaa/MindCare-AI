import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWater } from '../context/WaterContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { SkeletonCard } from '../components/ui/Skeleton';
import {
  MoodModal,
  JournalModal,
  WellnessModal,
} from '../components/dashboard/DashboardModals';
import WaterModal from '../components/WaterModal/WaterModal';
import SleepModal from '../components/SleepModal/SleepModal';
import { AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

// Redesigned Subcomponents
import Greeting from './Dashboard/Greeting';
import StatsCards from './Dashboard/StatsCards';
import RecommendationCard from './Dashboard/RecommendationCard';
import QuickActions from './Dashboard/QuickActions';
import AIInsight from './Dashboard/AIInsight';
import MoodChart from './Dashboard/MoodChart';
import WeeklyProgress from './Dashboard/WeeklyProgress';
import Checklist from './Dashboard/Checklist';
import ContinueJourney from './Dashboard/ContinueJourney';
import ReminderPanel from './Dashboard/ReminderPanel';

export default function Dashboard() {
  const { user, updateUserAge } = useAuth();
  const { waterSummary, fetchWaterTelemetry } = useWater();

  // Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'mood', 'journal', 'wellness'

  // Onboarding Age States
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [ageInput, setAgeInput] = useState('');
  const [ageError, setAgeError] = useState('');
  const [ageSubmitting, setAgeSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.onboardingRequired) {
      setShowAgeModal(true);
    } else {
      setShowAgeModal(false);
    }
  }, [user]);

  // Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [goals, setGoals] = useState([]);
  const [featuredMeditation, setFeaturedMeditation] = useState(null);
  const [latestJournal, setLatestJournal] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, chartsRes, aiRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/ai-wellness'),
        fetchWaterTelemetry(new Date(), false)
      ]);

      setStats(statsRes.data.stats);
      setCharts(chartsRes.data.charts);
      setAiAnalysis(aiRes.data.hasInsights === false ? { hasInsights: false } : aiRes.data.wellnessAnalysis);

      // Fetch Goals and Habits metadata
      try {
        const goalsRes = await api.get('/goals');
        setGoals(goalsRes.data.goals || []);
      } catch (wellErr) {
        console.warn('Could not load wellness/goals metadata:', wellErr.message);
      }

      // Fetch Featured Meditation
      try {
        const featuredRes = await api.get('/meditations/featured');
        if (featuredRes.data.success) {
          setFeaturedMeditation(featuredRes.data.meditation);
        }
      } catch (featErr) {
        console.warn('Could not load featured meditation:', featErr.message);
      }

      // Fetch Latest Journal entry for checklist checked logic
      try {
        const journalsRes = await api.get('/journals');
        if (journalsRes.data && journalsRes.data.journals && journalsRes.data.journals.length > 0) {
          setLatestJournal(journalsRes.data.journals[0]);
        } else if (journalsRes.data && journalsRes.data.entries && journalsRes.data.entries.length > 0) {
          setLatestJournal(journalsRes.data.entries[0]);
        }
      } catch (journErr) {
        console.warn('Could not load journals for checklist:', journErr.message);
      }

    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    window.addEventListener('focus', fetchDashboardData);
    return () => window.removeEventListener('focus', fetchDashboardData);
  }, [fetchDashboardData]);

  const overriddenStats = stats ? {
    ...stats,
    waterIntake: waterSummary ? waterSummary.totalIntake : stats.waterIntake,
    waterGoal: waterSummary ? waterSummary.goal : (stats.waterGoal || 2500),
  } : null;

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] relative font-poppins select-none">

      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Top Navbar Header */}
        <TopNav onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isDashboard={true} />

        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 text-left relative z-10">

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                <div className="lg:col-span-5"><SkeletonCard /></div>
                <div className="lg:col-span-3"><SkeletonCard /></div>
                <div className="lg:col-span-4"><SkeletonCard /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              
              {/* Row 1: Large Welcome Title Greeting */}
              <Greeting user={user} />

              {/* Row 2: 5 Statistics Indicator Cards */}
              <StatsCards stats={overriddenStats} onOpenWater={() => setActiveModal('water')} onOpenSleep={() => setActiveModal('sleep')} />

              {/* Row 3: Today's Recommendation, Quick Actions, and AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
                <div className="lg:col-span-5">
                  <RecommendationCard featuredMeditation={featuredMeditation} />
                </div>
                <div className="lg:col-span-3">
                  <QuickActions 
                    onOpenMood={() => setActiveModal('mood')}
                    onOpenJournal={() => setActiveModal('journal')}
                    onOpenWellness={() => setActiveModal('wellness')}
                  />
                </div>
                <div className="lg:col-span-4">
                  <AIInsight aiWellness={aiAnalysis} />
                </div>
              </div>

              {/* Row 4: Mood Overview Spline chart, Weekly progress percentages, Checklist checks */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
                <div className="lg:col-span-5">
                  <MoodChart weeklyData={charts?.weeklyMoodTrend} />
                </div>
                <div className="lg:col-span-3">
                  <WeeklyProgress stats={overriddenStats} />
                </div>
                <div className="lg:col-span-4">
                  <Checklist 
                    stats={overriddenStats}
                    latestJournal={latestJournal}
                    onOpenMood={() => setActiveModal('mood')}
                    onOpenJournal={() => setActiveModal('journal')}
                    onOpenWellness={() => setActiveModal('wellness')}
                    onOpenWater={() => setActiveModal('water')}
                    onOpenSleep={() => setActiveModal('sleep')}
                    onRefresh={fetchDashboardData}
                  />
                </div>
              </div>

              {/* Row 5: Continuation cards list & Upcoming timeline calendars */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
                <div className="lg:col-span-8">
                  <ContinueJourney />
                </div>
                <div className="lg:col-span-4">
                  <ReminderPanel goals={goals} />
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Modal overlays mounting */}
      <MoodModal
        isOpen={activeModal === 'mood'}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDashboardData}
      />
      <JournalModal
        isOpen={activeModal === 'journal'}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDashboardData}
      />
      <WellnessModal
        isOpen={activeModal === 'wellness'}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDashboardData}
        initialStats={overriddenStats ? {
          sleepHours: overriddenStats.sleepHours,
          waterIntake: overriddenStats.waterIntake,
          meditationMinutes: overriddenStats.meditationMinutes
        } : null}
      />
      <WaterModal
        isOpen={activeModal === 'water'}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDashboardData}
      />
      <SleepModal
        isOpen={activeModal === 'sleep'}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDashboardData}
      />

      {/* Mandatory Onboarding Age Modal */}
      {showAgeModal && (
        <div className="fixed inset-0 bg-[#0c0a1c]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white border border-[#E9E2FF]/60 rounded-[32px] p-8 shadow-2xl text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-3xl bg-[#7C5CFF]/10 text-[#7C5CFF] flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8 fill-[#7C5CFF]/10 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Welcome to MindCare AI</h2>
              <p className="text-xs text-gray-550 font-semibold leading-relaxed">
                To customize your sleep targets, cognitive stress evaluations, and coaching plans, please tell us your age.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const parsed = parseInt(ageInput, 10);
                if (isNaN(parsed) || parsed < 1 || parsed > 120) {
                  setAgeError('Please enter a valid age between 1 and 120.');
                  return;
                }
                setAgeSubmitting(true);
                setAgeError('');
                try {
                  await updateUserAge(parsed);
                  setShowAgeModal(false);
                  // Refresh dashboard data to generate insights using correct age
                  fetchDashboardData();
                } catch (err) {
                  setAgeError(err.message || 'Failed to save your age. Please try again.');
                } finally {
                  setAgeSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <input
                  type="number"
                  placeholder="Your Age (e.g. 28)"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  className="w-full h-12 bg-[#FAFAFC] border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold text-center text-gray-900 focus:outline-none focus:border-[#7C5CFF] focus:ring-2 focus:ring-[#7C5CFF]/20 transition-all placeholder-gray-400"
                  required
                  min="1"
                  max="120"
                />
                {ageError && <p className="text-xxs text-rose-500 font-extrabold">{ageError}</p>}
              </div>

              <button
                type="submit"
                disabled={ageSubmitting}
                className="w-full h-12 bg-gradient-to-r from-[#7C5CFF] to-[#6D4AE5] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                {ageSubmitting ? 'Personalizing...' : 'Start My Journey'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
