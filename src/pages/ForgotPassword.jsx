import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { requestPasswordReset, resetPassword } = useAuth();

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const data = await requestPasswordReset(email);
      setSuccessMessage(data.message || 'Recovery email successfully sent.');
      setEmail('');
    } catch (err) {
      setLocalError(err.message || 'Failed to request recovery link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await resetPassword(token, password);
      setSuccessMessage(data.message || 'Password successfully updated.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setLocalError(err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 font-poppins text-[#1F2937] relative overflow-hidden select-none">
      
      {/* Illustrated Nature Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-gradient-to-br from-white via-[#7C5CFF]/3 to-purple-50/50">
        {/* Sunrise Glow in center */}
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square rounded-full bg-gradient-to-tr from-[#7C5CFF]/10 to-transparent blur-[120px]" />
        
        {/* Lavender Mountains & Lake SVG */}
        <svg className="absolute bottom-0 left-0 w-full h-[60%] text-purple-200/40 fill-current" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice">
          {/* Mountains */}
          <path d="M-100 600 L150 250 Q300 370 450 270 L700 460 L950 200 L1250 430 L1600 600 Z" opacity="0.5" />
          <path d="M-50 600 L250 290 L600 500 L850 240 L1200 520 L1500 600 Z" opacity="0.65" />
          
          {/* Lake water lines */}
          <line x1="0" y1="520" x2="1440" y2="520" stroke="#E9E9F5" strokeWidth="1.2" opacity="0.6" />
          <line x1="100" y1="540" x2="1340" y2="540" stroke="#E9E9F5" strokeWidth="1" opacity="0.4" />

          {/* Flying birds */}
          <g className="text-[#A88BFF]" opacity="0.8">
            <path d="M1120 180 Q1127 172 1134 180 Q1141 172 1148 180" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M1160 150 Q1165 144 1170 150 Q1175 144 1180 150" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M1090 200 Q1094 195 1098 200 Q1102 195 1106 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Corner Leaves Shoots */}
          {/* Bottom Left Leaves */}
          <g className="text-[#7C5CFF]/70">
            <path d="M30 600 Q100 450 180 320" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M90 470 Q120 440 110 465 Z" fill="currentColor" />
            <path d="M125 410 Q155 380 145 405 Z" fill="currentColor" />
            <path d="M160 350 Q190 320 180 345 Z" fill="currentColor" />
            <path d="M75 500 Q60 480 75 490 Z" fill="currentColor" />
            <path d="M105 440 Q90 420 105 430 Z" fill="currentColor" />
            <path d="M140 380 Q125 360 140 370 Z" fill="currentColor" />
          </g>

          {/* Bottom Right Leaves */}
          <g className="text-[#7C5CFF]/70">
            <path d="M1410 600 Q1340 450 1260 320" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M1350 470 Q1320 440 1330 465 Z" fill="currentColor" />
            <path d="M1315 410 Q1285 380 1295 405 Z" fill="currentColor" />
            <path d="M1280 350 Q1250 320 1260 345 Z" fill="currentColor" />
            <path d="M1365 500 Q1380 480 1365 490 Z" fill="currentColor" />
            <path d="M1335 440 Q1350 420 1335 430 Z" fill="currentColor" />
            <path d="M1300 380 Q1315 360 1300 370 Z" fill="currentColor" />
          </g>
        </svg>
      </div>

      {/* Header Container */}
      <div className="w-full max-w-lg text-center mb-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 justify-center">
          <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-[#6C63FF] to-[#A56EFF] flex items-center justify-center shadow-md shadow-[#6C63FF]/20">
            <Brain className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-gray-900">
            MindCare <span className="text-[#6C63FF]">AI</span>
          </span>
        </Link>
        <h2 className="mt-6 text-3xl font-black text-gray-900 tracking-tight">
          {token ? (
            <>
              Reset <span className="text-[#6C63FF]">your password</span>
            </>
          ) : (
            <>
              Recovery <span className="text-[#6C63FF]">your account</span>
            </>
          )}
        </h2>
        <p className="mt-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
          Or{' '}
          <Link
            to="/login"
            className="font-extrabold text-[#6C63FF] hover:text-[#564ee5] transition-all hover:underline relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#6C63FF] after:origin-bottom-right after:scale-x-0 hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform"
          >
            return to Login
          </Link>
        </p>
      </div>

      {/* Recovery Card (w-full max-w-[540px]) */}
      <div className="w-full max-w-[540px] bg-white/95 backdrop-blur-md rounded-[22px] border border-[#E9E9F5] shadow-xl shadow-purple-100/15 p-8 md:p-10 relative z-10">
        {successMessage ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Success</h3>
            <p className="text-gray-500 text-xs font-semibold leading-relaxed mb-6">
              {successMessage}
            </p>
            {token ? (
              <p className="text-xxs text-[#6C63FF] animate-pulse font-extrabold uppercase tracking-wider">
                Redirecting to login...
              </p>
            ) : (
              <div className="p-4 bg-[#FAFAFC] border border-[#E9E9F5] rounded-2xl text-[10px] text-gray-400 text-left font-medium">
                <span className="font-extrabold text-[#6C63FF] uppercase tracking-wider block mb-1">Development Notice</span>
                Since actual email transfers are simulated in development mode, the verification activation URL has been printed directly inside your server terminal logs. Copy-paste it to proceed!
              </div>
            )}
          </div>
        ) : (
          <>
            {localError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-semibold text-left flex gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{localError}</span>
              </div>
            )}

            {!token ? (
              /* Stage 1: Request Reset */
              <form onSubmit={handleForgotRequest} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-xs font-extrabold uppercase tracking-wider text-gray-400 text-left mb-2 pl-1">
                    YOUR REGISTERED EMAIL ADDRESS
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
                      placeholder="name@company.com"
                      className="bg-[#FAFAFC] border border-[#E9E9F5] rounded-2xl pl-12 pr-4 h-14 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] w-full shadow-sm transition-all duration-200 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#6C63FF] to-[#A56EFF] hover:opacity-95 text-white font-bold text-sm py-4.5 rounded-2xl shadow-lg shadow-[#6C63FF]/15 hover:shadow-xl hover:shadow-[#6C63FF]/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Sending Request...' : 'Send Reset Link'}
                  {!submitting && <span className="text-base font-black">&rarr;</span>}
                </button>
              </form>
            ) : (
              /* Stage 2: Reset Password Form */
              <form onSubmit={handleResetSubmit} className="space-y-5">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-extrabold uppercase tracking-wider text-gray-400 text-left mb-2 pl-1">
                    New Password
                  </label>
                  <div className="relative rounded-full shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="bg-[#FAFAFC] border border-[#E9E9F5] rounded-2xl pl-12 pr-4 h-14 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] w-full shadow-sm transition-all duration-200 font-semibold"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-extrabold uppercase tracking-wider text-gray-400 text-left mb-2 pl-1">
                    Confirm New Password
                  </label>
                  <div className="relative rounded-full shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="bg-[#FAFAFC] border border-[#E9E9F5] rounded-2xl pl-12 pr-4 h-14 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] w-full shadow-sm transition-all duration-200 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#6C63FF] to-[#A56EFF] hover:opacity-95 text-white font-bold text-sm py-4.5 rounded-2xl shadow-lg shadow-[#6C63FF]/15 hover:shadow-xl hover:shadow-[#6C63FF]/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 mt-2"
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                  {!submitting && <span className="text-base font-black">&rarr;</span>}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
