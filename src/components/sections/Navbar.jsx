import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Brain } from 'lucide-react';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'AI Benefits', href: '#benefits' },
    { name: 'About', href: '#about' },
    { name: 'Blog', href: '#' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
            ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 py-3'
            : 'bg-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center w-full">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C5CFC] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-[#7C5CFC]/20 group-hover:scale-105 transition-transform duration-300">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-gray-900">
              MindCare <span className="text-[#7C5CFC]">AI</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`font-semibold text-sm transition-colors relative py-1.5 ${link.name === 'Home'
                    ? 'text-[#7C5CFC] after:absolute after:bottom-[-2px] after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-[2px] after:bg-[#7C5CFC] after:rounded-full'
                    : 'text-gray-600 hover:text-[#7C5CFC]'
                  }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-[#7C5CFC] font-semibold text-sm transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-[#7C5CFC] hover:bg-[#6D4AE5] text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-md shadow-[#7C5CFC]/15 hover:shadow-lg hover:shadow-[#7C5CFC]/25 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-[#7C5CFC] transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-4 right-4 z-40 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-xl md:hidden overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-semibold transition-colors ${link.name === 'Home' ? 'text-[#7C5CFC]' : 'text-gray-700 hover:text-[#7C5CFC]'
                    }`}
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-gray-100 my-1"></div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full text-gray-700 hover:text-[#7C5CFC] font-semibold text-sm py-3 transition-colors text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full bg-[#7C5CFC] hover:bg-[#6D4AE5] text-white font-semibold text-sm py-3 rounded-full shadow-md transition-all text-center"
                >
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
