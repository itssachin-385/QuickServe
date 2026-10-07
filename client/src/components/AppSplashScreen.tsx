import React, { useEffect, useState } from 'react';
import { ShieldCheck, Zap, Sparkles, Clock } from 'lucide-react';

interface AppSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

const QUOTES = [
  '“Every Home Chore, Done in 15 Minutes”',
  '“India’s Fastest Domestic Help at Your Doorstep”',
  '“Aadhaar-Verified House Helpers in Under 15 Minutes”',
  '“Plumber, Electrician, Cook & Cleaning — Just One Tap Away”'
];

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  onFinish,
  minDurationMs = 1600
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Pick random inspiring quote on mount
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 350);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-gradient-to-b from-[#064e3b] via-[#022c22] to-[#0f172a] text-white px-6 py-12 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top micro pill */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold tracking-wide animate-pulse">
        <Zap className="w-3.5 h-3.5 text-emerald-400" />
        <span>15-Minute Doorstep Network</span>
      </div>

      {/* Center Branding & Logo */}
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Animated Logo Container */}
        <div className="relative mb-5">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 p-4 transition-transform hover:scale-105">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-md">
              <path d="M24 4L4 20V42C4 43.1 4.9 44 6 44H42C43.1 44 44 43.1 44 42V20L24 4Z" fill="white"/>
              <path d="M24 12L34 22H28V36H20V22H14L24 12Z" fill="#F59E0B"/>
              <path d="M19 44V29H29V44" fill="#047857"/>
            </svg>
          </div>
          {/* Subtle pulse ring behind */}
          <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 -z-10 animate-ping"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
          <span>Quick</span>
          <span className="text-emerald-400">Serve</span>
        </h1>

        {/* Main Catchy Quote */}
        <p className="mt-4 text-base sm:text-lg font-extrabold text-emerald-100 leading-snug px-2">
          {QUOTES[quoteIndex]}
        </p>

        {/* Sub-quote description */}
        <p className="mt-2 text-xs sm:text-sm text-slate-300 font-medium">
          Instant Domestic Help • Verified Professionals • Zero Hassle
        </p>

        {/* Highlights */}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[11px] font-semibold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>15 Min ETA</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[11px] font-semibold text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Aadhaar Verified</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[11px] font-semibold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pay After Service</span>
          </div>
        </div>
      </div>

      {/* Bottom Loading Progress Bar & Tag */}
      <div className="w-full max-w-xs flex flex-col items-center gap-3">
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-emerald-500/20">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full animate-[progress_1.6s_ease-in-out_infinite]"></div>
        </div>
        <span className="text-[11px] text-slate-400 font-medium tracking-wide">
          Connecting to Greater Noida Hub...
        </span>
      </div>
    </div>
  );
};
