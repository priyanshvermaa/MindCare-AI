import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, User, Mail, Lock, Eye, EyeOff, Sparkles, Smile, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { registerUser } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (!agreeToTerms) {
      setLocalError('You must agree to the Terms & Privacy Policy.');
      return;
    }

    setSubmitting(true);
    try {
      await registerUser(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleOAuth = () => {
    setSubmitting(true);
    setLocalError('');
    window.location.href = 'http://127.0.0.1:5000/api/auth/google';
  };

  const handleGithubOAuth = () => {
    setSubmitting(true);
    setLocalError('');
    window.location.href = 'http://127.0.0.1:5000/api/auth/github';
  };

  return (
    <div className="min-h-screen bg-[#FAF8FF] flex items-center justify-center p-4 md:p-6 lg:p-8 font-poppins text-[#111827]">
      <div className="w-full max-w-6xl bg-white rounded-[32px] overflow-hidden shadow-xl shadow-purple-100/25 border border-[#E5E7EB] grid grid-cols-1 lg:grid-cols-11 min-h-[640px] md:min-h-[700px]">
        
        {/* Left Side: Illustration & Floating Cards (≈45%) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#7C4DFF]/5 via-[#9F7AEA]/10 to-[#B794F4]/5 p-8 flex flex-col justify-between relative overflow-hidden border-r border-[#E5E7EB]">
          
          {/* Subtle birds floating background decoration */}
          <div className="absolute top-[22%] right-[25%] opacity-40 -z-10 pointer-events-none flex gap-6">
            <svg className="w-5 h-3 text-[#9F7AEA] fill-none stroke-current" viewBox="0 0 24 12" strokeWidth="2" strokeLinecap="round">
              <path d="M2 10 Q12 2 22 10 M2 10 Q12 6 22 10" />
            </svg>
            <svg className="w-4 h-2.5 text-[#9F7AEA] fill-none stroke-current mt-2" viewBox="0 0 24 12" strokeWidth="2" strokeLinecap="round">
              <path d="M2 10 Q12 2 22 10 M2 10 Q12 6 22 10" opacity="0.8" />
            </svg>
          </div>

          {/* Clouds in layout */}
          <div className="absolute top-[15%] right-[10%] w-24 h-12 opacity-30 pointer-events-none -z-10">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-300 w-full h-full fill-current">
              <path d="M46 36.5C46 33.46 43.54 31 40.5 31C39.78 31 39.09 31.14 38.47 31.39C36.93 28.16 33.63 26 29.83 26C24.95 26 21 29.95 21 34.83C21 35.15 21.02 35.46 21.05 35.77C18.23 36.43 16 38.96 16 42C16 45.59 18.91 48.5 22.5 48.5H45.5C49.09 48.5 52 45.59 52 42C52 38.96 49.33 36.5 46 36.5Z" />
            </svg>
          </div>

          <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#7C4DFF]/5 rounded-full blur-[80px] -z-10" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#9F7AEA]/10 rounded-full blur-[80px] -z-10" />

          {/* Logo on Left Side */}
          <Link to="/" className="flex items-center gap-2 group relative z-10 w-fit">
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-[#7C4DFF] to-[#9F7AEA] flex items-center justify-center shadow-md shadow-[#7C4DFF]/20">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-gray-900">
              MindCare <span className="text-[#7C4DFF]">AI</span>
            </span>
          </Link>

          {/* Heading, Description, and floating cards stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-auto relative z-10">
            <div className="flex flex-col gap-6 text-left">
              <div>
                <h1 className="text-3xl sm:text-[38px] font-black text-gray-900 tracking-tight leading-[1.1] mb-3">
                  Your Journey to<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C4DFF] to-[#9F7AEA]">
                    Wellness Starts Here
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-[#6B7280] leading-relaxed max-w-[260px]">
                  Create your account and take the first step towards a better, calmer you.
                </p>
              </div>

              {/* Floating Feature Cards */}
              <div className="flex flex-col gap-3">
                {/* Card 1 */}
                <div className="bg-white/95 border border-purple-100/50 shadow-sm shadow-purple-100/10 rounded-2xl p-3 flex gap-3 items-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="w-8 h-8 rounded-xl bg-[#7C4DFF]/10 flex items-center justify-center text-[#7C4DFF] shrink-0">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-[11px] text-gray-900 leading-tight">AI Insights</h4>
                    <p className="text-[10px] text-[#6B7280] mt-0.5 leading-normal">Get personalized insights about your mind.</p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white/95 border border-purple-100/50 shadow-sm shadow-purple-100/10 rounded-2xl p-3 flex gap-3 items-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="w-8 h-8 rounded-xl bg-[#7C4DFF]/10 flex items-center justify-center text-[#7C4DFF] shrink-0">
                    <Smile className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-[11px] text-gray-900 leading-tight">Mood Tracking</h4>
                    <p className="text-[10px] text-[#6B7280] mt-0.5 leading-normal">Track your mood patterns and emotions.</p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white/95 border border-purple-100/50 shadow-sm shadow-purple-100/10 rounded-2xl p-3 flex gap-3 items-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="w-8 h-8 rounded-xl bg-[#7C4DFF]/10 flex items-center justify-center text-[#7C4DFF] shrink-0">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-[11px] text-gray-900 leading-tight">Daily Journal</h4>
                    <p className="text-[10px] text-[#6B7280] mt-0.5 leading-normal">Reflect your thoughts and emotions in a safe space.</p>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white/95 border border-purple-100/50 shadow-sm shadow-purple-100/10 rounded-2xl p-3 flex gap-3 items-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="w-8 h-8 rounded-xl bg-[#7C4DFF]/10 flex items-center justify-center text-[#7C4DFF] shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-[11px] text-gray-900 leading-tight">Private & Secure</h4>
                    <p className="text-[10px] text-[#6B7280] mt-0.5 leading-normal">Your data is 100% encrypted and protected.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing neural brain SVG & mountains/zen stones layout */}
            <div className="relative w-full aspect-square flex items-center justify-center">
              {/* Soft purple glow circle */}
              <div className="absolute w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-[#7C4DFF]/10 to-[#9F7AEA]/10 blur-xl" />
              
              {/* Glowing Brain SVG */}
              <svg viewBox="0 0 200 200" className="w-48 h-48 text-[#7C4DFF] opacity-90 drop-shadow-[0_0_20px_rgba(124,77,255,0.4)] relative z-10">
                <path d="M100 30 C60 30 30 60 30 100 C30 140 60 170 100 170 C100 170 100 140 100 100 C100 60 100 30 100 30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M100 30 C140 30 170 60 170 100 C170 140 140 170 100 170 C100 170 100 140 100 100 C100 60 100 30 100 30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M50 70 Q70 80 100 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M40 100 Q70 110 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M50 130 Q70 140 100 130" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M150 70 Q130 80 100 70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M160 100 Q130 110 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M150 130 Q130 140 100 130" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx="50" cy="70" r="3" fill="#7C4DFF" className="animate-pulse" />
                <circle cx="70" cy="80" r="3.5" fill="#9F7AEA" className="animate-pulse" />
                <circle cx="150" cy="70" r="3" fill="#7C4DFF" className="animate-pulse" />
                <circle cx="130" cy="80" r="3.5" fill="#9F7AEA" className="animate-pulse" />
                <circle cx="40" cy="100" r="4" fill="#B794F4" className="animate-pulse" />
                <circle cx="160" cy="100" r="4" fill="#B794F4" className="animate-pulse" />
                <circle cx="100" cy="70" r="3" fill="#7C4DFF" />
                <circle cx="100" cy="100" r="3" fill="#7C4DFF" />
                <circle cx="100" cy="130" r="3" fill="#7C4DFF" />
              </svg>

              {/* Mountains, Calm Lake, Zen Stones & Lavender shoots at bottom */}
              <div className="absolute bottom-[-10%] right-[-10%] w-36 h-36 z-10 pointer-events-none">
                <svg viewBox="0 0 120 120" className="w-full h-full text-[#7C4DFF] select-none">
                  {/* Bottom Stone */}
                  <ellipse cx="60" cy="98" rx="28" ry="10" fill="currentColor" opacity="0.8" />
                  <ellipse cx="60" cy="95" rx="26" ry="9" fill="#9F7AEA" opacity="0.2" />
                  <ellipse cx="60" cy="94" rx="24" ry="8" fill="#F3EFFF" />
                  
                  {/* Middle Stone */}
                  <ellipse cx="59" cy="81" rx="22" ry="8" fill="currentColor" opacity="0.8" />
                  <ellipse cx="59" cy="79" rx="20" ry="7" fill="#9F7AEA" opacity="0.2" />
                  <ellipse cx="59" cy="78" rx="18" ry="6.5" fill="#ECE5FF" />
                  
                  {/* Top Middle Stone */}
                  <ellipse cx="61" cy="67" rx="16" ry="6.5" fill="currentColor" opacity="0.8" />
                  <ellipse cx="61" cy="65" rx="14" ry="5.5" fill="#9F7AEA" opacity="0.2" />
                  <ellipse cx="61" cy="64" rx="12" ry="5" fill="#E4D6FF" />
                  
                  {/* Top Smallest Stone */}
                  <ellipse cx="60" cy="55" rx="11" ry="5" fill="currentColor" opacity="0.8" />
                  <ellipse cx="60" cy="53" rx="9" ry="4" fill="#9F7AEA" opacity="0.2" />
                  <ellipse cx="60" cy="52" rx="7.5" ry="3.5" fill="#D6BEFF" />

                  {/* Lavender/Plant shoots */}
                  <path d="M88 98 Q93 72 103 52" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.75" />
                  <path d="M94 80 Q98 75 103 78" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75" />
                  <path d="M97 66 Q102 61 106 65" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75" />

                  <path d="M32 98 Q27 75 15 58" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.75" />
                  <path d="M26 82 Q22 77 17 80" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75" />
                  <path d="M22 68 Q18 63 13 66" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75" />
                </svg>
              </div>

              {/* Background Mountains & Calm Lake Ripples SVG behind stones */}
              <div className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none -z-10">
                <svg viewBox="0 0 400 200" className="absolute bottom-0 left-0 w-full h-full text-purple-200/40 fill-current opacity-70">
                  <path d="M0 200 L120 70 L240 160 L320 90 L400 200 Z" />
                  <path d="M80 200 L200 100 L280 170 L350 110 L400 200 Z" opacity="0.6" />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-gradient-to-t from-white/40 to-transparent border-t border-purple-100/30" />
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="text-[10px] text-gray-400 font-semibold relative z-10 text-left">
            &copy; 2025 MindCare AI. All rights reserved.
          </div>
        </div>

        {/* Right Section (≈55%) */}
        <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-center items-center">
          
          {/* Main White Auth Card with 30px radius */}
          <div className="w-full max-w-lg bg-white rounded-[30px] shadow-xl shadow-purple-100/10 border border-[#E5E7EB] p-8 md:p-12 text-left relative z-10">
            
            {successMessage ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Verify Your Email</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed mb-6 font-semibold">
                  {successMessage}
                </p>
                <div className="p-4 bg-purple-50/50 border border-purple-100/50 rounded-2xl text-[11px] text-gray-500 text-left mb-6 leading-relaxed">
                  <span className="font-extrabold text-[#7C4DFF] uppercase tracking-wider block mb-1">Testing Notice</span>
                  Since SMTP email delivery is simulated in development, the activation link has been printed directly to your server console logs. Click it there to verify!
                </div>
                <Link to="/login">
                  <button className="w-full bg-[#7C4DFF] hover:bg-[#6D3FEA] text-white font-bold text-sm py-3.5 rounded-full shadow-md shadow-[#7C4DFF]/15 hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                    Proceed to Login
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Top Center Logo */}
                <div className="flex flex-col items-center mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C4DFF] to-[#9F7AEA] flex items-center justify-center shadow-md shadow-[#7C4DFF]/20 mb-2">
                    <Brain className="w-5.5 h-5.5 text-white" />
                  </div>
                  <span className="font-extrabold text-base tracking-tight text-gray-900">
                    MindCare <span className="text-[#7C4DFF]">AI</span>
                  </span>
                </div>

                {/* Headings */}
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1.5">
                    Create Your Account
                  </h2>
                  <p className="text-sm text-[#6B7280] font-semibold">
                    Start your wellness journey with AI.
                  </p>
                </div>

                {/* Error banner */}
                {localError && (
                  <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-semibold text-left">
                    ⚠️ {localError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Grid fields for spacing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="name" className="block text-xs font-extrabold text-[#6B7280] uppercase tracking-wider text-left mb-1.5 pl-1">
                        Full Name
                      </label>
                      <div className="relative rounded-full shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                          <User className="w-5 h-5" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="bg-white border border-[#E5E7EB] rounded-full pl-12 pr-4 h-14 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF] w-full shadow-sm transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Email address */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-extrabold text-[#6B7280] uppercase tracking-wider text-left mb-1.5 pl-1">
                        Email Address
                      </label>
                      <div className="relative rounded-full shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="bg-white border border-[#E5E7EB] rounded-full pl-12 pr-4 h-14 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF] w-full shadow-sm transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-xs font-extrabold text-[#6B7280] uppercase tracking-wider text-left mb-1.5 pl-1">
                        Password
                      </label>
                      <div className="relative rounded-full shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                          className="bg-white border border-[#E5E7EB] rounded-full pl-12 pr-12 h-14 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF] w-full shadow-sm transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4.5 flex items-center text-gray-400 hover:text-[#7C4DFF]"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs font-extrabold text-[#6B7280] uppercase tracking-wider text-left mb-1.5 pl-1">
                        Confirm Password
                      </label>
                      <div className="relative rounded-full shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          className="bg-white border border-[#E5E7EB] rounded-full pl-12 pr-12 h-14 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF] w-full shadow-sm transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4.5 flex items-center text-gray-400 hover:text-[#7C4DFF]"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label htmlFor="role" className="block text-xs font-extrabold text-[#6B7280] uppercase tracking-wider text-left mb-1.5 pl-1">
                      I am registering as
                    </label>
                    <div className="relative rounded-full shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <select
                        id="role"
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="bg-white border border-[#E5E7EB] rounded-full pl-12 pr-10 h-14 text-sm text-gray-900 focus:outline-none focus:border-[#7C4DFF] focus:ring-1 focus:ring-[#7C4DFF] w-full shadow-sm transition-colors appearance-none font-semibold cursor-pointer"
                      >
                        <option value="user">• User</option>
                        <option value="admin">• Administrator</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4.5 flex items-center pointer-events-none text-gray-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Agree to terms Checkbox */}
                  <div className="pt-2 select-none">
                    <label className="flex items-start gap-2 text-xs font-semibold text-[#6B7280] cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="w-4 h-4 rounded text-[#7C4DFF] focus:ring-[#7C4DFF] border-[#E5E7EB] mt-0.5"
                      />
                      <span className="text-[11px]">
                        I agree to the{' '}
                        <a href="#" className="text-[#7C4DFF] font-extrabold hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-[#7C4DFF] font-extrabold hover:underline">Privacy Policy</a>
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-[#7C4DFF] to-[#9F7AEA] hover:from-[#6D3FEA] hover:to-[#8E69DB] text-white font-bold text-sm py-4 rounded-full shadow-md shadow-[#7C4DFF]/15 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] mt-6 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {submitting ? 'Registering...' : 'Create Account'}
                  </button>
                </form>

                {/* Divider */}
                <div className="mt-6 relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#E5E7EB]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="px-3 bg-white text-gray-400">
                      OR CONTINUE WITH
                    </span>
                  </div>
                </div>

                {/* OAuth buttons */}
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <button
                    onClick={handleGoogleOAuth}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2.5 py-3 px-4 border border-[#E5E7EB] rounded-full text-xs font-bold text-gray-700 bg-white hover:bg-gray-50/50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 fill-current text-red-400" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Google
                  </button>
                  <button
                    onClick={handleGithubOAuth}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2.5 py-3 px-4 border border-[#E5E7EB] rounded-full text-xs font-bold text-gray-700 bg-white hover:bg-gray-50/50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 fill-current text-gray-800" viewBox="0 0 24 24">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    GitHub
                  </button>
                </div>
                
                {/* Bottom Redirect */}
                <div className="mt-6 text-center text-xs font-semibold text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-[#7C4DFF] hover:text-[#9F7AEA] transition-colors ml-1">
                    Sign In
                  </Link>
                </div>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
