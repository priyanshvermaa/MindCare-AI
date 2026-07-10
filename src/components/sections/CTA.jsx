import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import teaWomanImg from '../../assets/tea_woman.png';

export const CTA = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email.trim()) {
      navigate('/register', {
        state: { email },
      });
    }
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative rounded-[32px] overflow-hidden border border-purple-100/50 p-8 md:p-12 lg:p-16 text-left shadow-xl shadow-purple-100/25 bg-gradient-to-r from-purple-50/50 via-[#7C5CFC]/8 to-purple-50/50 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#7C5CFC]/10 rounded-full blur-[80px] -z-10" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#A78BFA]/10 rounded-full blur-[80px] -z-10" />

          {/* Left Column */}
          <div className="lg:col-span-7 relative z-10 flex flex-col justify-center">
            <h2 className="text-3xl sm:text-4xl md:text-[40px] font-black text-gray-900 tracking-tight leading-[1.15] mb-4">
              Start Your Journey to<br />
              Better Mental Wellness Today
            </h2>

            <p className="text-[#64748B] text-sm md:text-base leading-relaxed mb-8 max-w-xl">
              Join thousands of people who are improving their mental health with AI-powered support.
            </p>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-stretch justify-start max-w-md gap-3 mb-3"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white border border-purple-100 rounded-full px-6 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC] shadow-sm transition-colors flex-1"
              />

              <button
                type="submit"
                className="bg-[#7C5CFC] hover:bg-[#6D4AE5] text-white font-semibold text-sm px-6 py-3.5 rounded-full shadow-md shadow-[#7C5CFC]/15 hover:shadow-lg hover:shadow-[#7C5CFC]/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0"
              >
                Get Started Free
              </button>
            </form>

            <span className="text-[11px] text-gray-400 font-semibold pl-2">
            </span>
          </div>

          {/* Right Column (Illustration) */}
          <div className="lg:col-span-5 relative z-10 flex justify-center items-center">
            <div className="relative w-full max-w-[280px] aspect-square flex justify-center items-center">
              <div className="absolute w-[90%] h-[90%] rounded-full bg-purple-100/50 blur-sm -z-10" />
              <img
                src={teaWomanImg}
                alt="Relaxed tea woman illustration"
                className="w-full h-full object-contain rounded-full mix-blend-multiply opacity-95"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};