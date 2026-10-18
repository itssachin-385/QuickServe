import React, { useEffect, useState } from 'react';
import { ShieldCheck, Zap, Sparkles, Clock } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

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
      className={`fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-white text-slate-900 px-6 py-10 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top micro pill */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[11px] font-bold tracking-wide">
        <Zap className="w-3.5 h-3.5 text-pink-600" />
        <span>15-Minute Doorstep Network</span>
      </div>

      {/* Center Branding & Logo */}
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Animated Logo Container with Pink House Emblem */}
        <div className="relative mb-4 flex flex-col items-center">
          <BrandLogo size="xl" showText={false} className="drop-shadow-lg" />
          {/* Subtle pulse ring behind */}
          <div className="absolute inset-0 rounded-3xl bg-pink-100 -z-10 animate-ping pointer-events-none"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1 font-heading">
          <span className="text-pink-600">Quick</span>
          <span className="text-[#1F2937]">Serve</span>
        </h1>

        {/* Subtitle / Tagline */}
        <p className="mt-1 text-sm sm:text-base font-bold text-slate-600">
          15-Minute Domestic Help
        </p>

        {/* Main Catchy Quote */}
        <p className="mt-4 text-xs sm:text-sm font-semibold text-slate-500 leading-snug px-2">
          {QUOTES[quoteIndex]}
        </p>

        {/* Highlights */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-100 text-[11px] font-semibold text-pink-800">
            <Clock className="w-3.5 h-3.5 text-pink-600" />
            <span>15 Min ETA</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-100 text-[11px] font-semibold text-pink-800">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
            <span>100% Aadhaar Verified</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-100 text-[11px] font-semibold text-pink-800">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span>Pay After Service</span>
          </div>
        </div>
      </div>

      {/* Bottom Loading Progress Bar & Tag */}
      <div className="w-full max-w-xs flex flex-col items-center gap-3">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-full animate-[progress_1.6s_ease-in-out_infinite]"></div>
        </div>
        <span className="text-[11px] text-slate-400 font-medium tracking-wide">
          Connecting to QuickServe Fast Network...
        </span>
      </div>
    </div>
  );
};
