import React from 'react';
import { User, MessageCircle, Brain, Heart } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      num: 1,
      icon: User,
      title: 'Create Your Account',
      desc: 'Sign up in seconds and start your wellness journey.'
    },
    {
      num: 2,
      icon: MessageCircle,
      title: 'Share & Track',
      desc: 'Track your mood, write in your journal and share your thoughts.'
    },
    {
      num: 3,
      icon: Brain,
      title: 'AI Analysis',
      desc: 'Our AI analyzes your patterns and provides meaningful insights.'
    },
    {
      num: 4,
      icon: Heart,
      title: 'Feel Better',
      desc: 'Get personalized recommendations and improve your wellbeing.'
    }
  ];

  return (
    <section id="about" className="py-24 bg-[#FAF8FF]/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
            How <span className="text-[#7C5CFC]">MindCare AI</span> Works
          </h2>
          <p className="text-[#64748B] text-sm md:text-base font-semibold">
            Simple steps to better mental wellbeing
          </p>
        </div>

        {/* Steps Timeline Grid */}
        <div className="relative">
          {/* Connector Line for Desktop */}
          <div className="absolute top-[52px] left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-[#7C5CFC]/20 hidden lg:block -z-10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center group">
                  {/* Icon Card Wrapper */}
                  <div className="relative w-24 h-24 rounded-full bg-white border-2 border-purple-50 flex items-center justify-center text-[#7C5CFC] shadow-md shadow-purple-100/30 group-hover:scale-105 transition-transform duration-300 mb-6 shrink-0">
                    <Icon className="w-8 h-8" />
                    
                    {/* Number Badge */}
                    <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#7C5CFC] text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-md">
                      {step.num}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-[#7C5CFC] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#64748B] leading-relaxed max-w-[200px]">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
