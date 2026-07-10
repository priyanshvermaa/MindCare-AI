import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export const WhyChooseUs = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      title: 'AI-Powered Support',
      desc: 'Advanced AI understands you better.'
    },
    {
      title: 'Expert Designed',
      desc: 'Created with mental health experts.'
    },
    {
      title: 'Evidence-Based Methods',
      desc: 'Built on proven therapeutic techniques.'
    },
    {
      title: 'Progress Tracking',
      desc: 'Track your growth and achievements.'
    },
    {
      title: '24/7 Availability',
      desc: 'Support whenever you need it.'
    },
    {
      title: 'Community Support',
      desc: "You're not alone. We're here together."
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 text-left">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#7C5CFC]/8 text-[#7C5CFC] text-xs font-bold tracking-wide w-fit mb-6">
            <span>✨ Why Choose MindCare AI</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
            More Than Just<br />
            Mental Wellness
          </h2>

          <p className="text-[#64748B] text-base md:text-lg leading-relaxed mb-8">
            We combine advanced AI technology with evidence-based therapeutic practices to deliver a truly transformative wellness experience.
          </p>

          <button
            onClick={() => navigate('/register')}
            className="bg-[#7C5CFC] hover:bg-[#6D4AE5] text-white font-semibold text-sm px-8 py-3.5 rounded-full shadow-md shadow-[#7C5CFC]/15 hover:shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Learn More
          </button>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-5 h-5 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center shrink-0 mt-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1">{b.title}</h3>
                <p className="text-xs md:text-sm text-[#64748B] leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
