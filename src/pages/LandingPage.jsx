import React from 'react';
import { Navbar } from '../components/sections/Navbar';
import { Hero } from '../components/sections/Hero';
import { Features } from '../components/sections/Features';
import { HowItWorks } from '../components/sections/HowItWorks';
import { WhyChooseUs } from '../components/sections/WhyChooseUs';
import { CTA } from '../components/sections/CTA';
import { Footer } from '../components/sections/Footer';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white text-gray-900 selection:bg-[#7C5CFC]/20 selection:text-[#7C5CFC] overflow-hidden font-sans">
      {/* Background glow blobs */}
      <div className="absolute top-0 right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#7C5CFC]/6 to-[#A78BFA]/6 blur-[130px] -z-20 pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-[#A78BFA]/4 to-[#8B5CF6]/3 blur-[150px] -z-20 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[900px] h-[900px] rounded-full bg-gradient-to-tl from-[#7C5CFC]/4 to-transparent blur-[130px] -z-20 pointer-events-none" />

      {/* Floating modern navbar */}
      <Navbar />

      {/* Main sections */}
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <WhyChooseUs />
        <CTA />
      </main>

      {/* Corporate footer */}
      <Footer />
    </div>
  );
}
