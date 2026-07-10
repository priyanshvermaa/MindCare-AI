import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Activity, Lock, Leaf, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Features = () => {
  const navigate = useNavigate();

  const featuresList = [
    {
      icon: Brain,
      title: 'AI Insights',
      description: 'Get deep, personalized insights about your emotions, habits and mental wellbeing.',
    },
    {
      icon: Activity,
      title: 'Mood Tracking',
      description: 'Track your daily mood, visualize patterns and understand your emotional highs and lows.',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: "Your data is 100% encrypted and confidential. We don't compromise on your privacy.",
    },
    {
      icon: Leaf,
      title: 'Personalized Wellness',
      description: 'Get tailored recommendations, guided exercises and tools that work for you.',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#7C5CFC]/3 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {featuresList.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div key={idx} variants={cardVariants}>
                <div 
                  className="h-full bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-purple-100/30 hover:-translate-y-2 transition-all duration-300 flex flex-col items-start text-left group"
                >
                  {/* Icon */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#7C5CFC]/10 to-[#A78BFA]/10 text-[#7C5CFC] mb-6 flex items-center justify-center shrink-0 w-12 h-12 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2.5">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-[#64748B] text-sm leading-relaxed mb-6 flex-1">
                    {feature.description}
                  </p>

                  {/* Explore Link */}
                  <button 
                    onClick={() => navigate('/register')}
                    className="text-sm font-bold text-[#7C5CFC] hover:text-[#6D4AE5] flex items-center gap-1 mt-auto transition-colors"
                  >
                    Explore <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
