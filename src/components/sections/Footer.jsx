import React from 'react';
import { Brain } from 'lucide-react';

export const Footer = () => {
  const productLinks = [
    { name: 'Features', href: '#features' },
    { name: 'AI Benefits', href: '#benefits' },
    { name: 'Mood Tracking', href: '#features' },
    { name: 'Daily Journal', href: '#features' },
  ];

  const companyLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Blog', href: '#' },
    { name: 'Contact Us', href: '#' },
  ];

  const resourceLinks = [
    { name: 'Help Center', href: '#' },
    { name: 'Guides', href: '#' },
  ];

  const supportLinks = [
    { name: 'Report an Issue', href: '#' },
    { name: 'Contact Support', href: '#' }
  ];

  return (
    <footer className="border-t border-purple-50 bg-white py-16 text-left">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Logo & Info column */}
          <div className="lg:col-span-4 flex flex-col items-start gap-6">
            <a href="#home" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C5CFC] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-[#7C5CFC]/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-gray-900">
                MindCare <span className="text-[#7C5CFC]">AI</span>
              </span>
            </a>
            <p className="text-[#64748B] text-sm max-w-sm leading-relaxed">
              AI-powered mental wellness platform for a better you.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-purple-50 hover:bg-[#7C5CFC]/10 text-gray-400 hover:text-[#7C5CFC] transition-colors" aria-label="Facebook">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H7v3h2v9h3v-9h3.6L15 8h-3V6.5c0-.8.2-1 1-1h2V2h-3C9.8 2 9 3.2 9 5.3V8z" />
                </svg>
              </a>
              <a href="#" className="p-2 rounded-lg bg-purple-50 hover:bg-[#7C5CFC]/10 text-gray-400 hover:text-[#7C5CFC] transition-colors" aria-label="Twitter">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="p-2 rounded-lg bg-purple-50 hover:bg-[#7C5CFC]/10 text-gray-400 hover:text-[#7C5CFC] transition-colors" aria-label="Instagram">
                <svg className="w-4.5 h-4.5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="p-2 rounded-lg bg-purple-50 hover:bg-[#7C5CFC]/10 text-gray-400 hover:text-[#7C5CFC] transition-colors" aria-label="LinkedIn">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Column 2: Product */}
            <div className="flex flex-col items-start gap-4">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                Product
              </span>
              {productLinks.map((link, idx) => (
                <a key={idx} href={link.href} className="text-[#64748B] hover:text-[#7C5CFC] text-sm font-semibold transition-colors">
                  {link.name}
                </a>
              ))}
            </div>

            {/* Column 3: Company */}
            <div className="flex flex-col items-start gap-4">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                Company
              </span>
              {companyLinks.map((link, idx) => (
                <a key={idx} href={link.href} className="text-[#64748B] hover:text-[#7C5CFC] text-sm font-semibold transition-colors">
                  {link.name}
                </a>
              ))}
            </div>

            {/* Column 4: Resources */}
            <div className="flex flex-col items-start gap-4">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                Resources
              </span>
              {resourceLinks.map((link, idx) => (
                <a key={idx} href={link.href} className="text-[#64748B] hover:text-[#7C5CFC] text-sm font-semibold transition-colors">
                  {link.name}
                </a>
              ))}
            </div>

            {/* Column 5: Support */}
            <div className="flex flex-col items-start gap-4">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                Support
              </span>
              {supportLinks.map((link, idx) => (
                <a key={idx} href={link.href} className="text-[#64748B] hover:text-[#7C5CFC] text-sm font-semibold transition-colors">
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div className="h-px bg-purple-50 mb-8"></div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-semibold">
          <span>&copy; 2025 MindCare AI. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with <span className="text-red-500 text-sm">♥</span> for better mental health
          </span>
        </div>
      </div>
    </footer>
  );
};
