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
      className={`fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-gradient-to-b from-[#831843] via-[#4C0519] to-[#1F121C] text-white px-6 py-12 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top micro pill */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-200 text-[11px] font-bold tracking-wide animate-pulse">
        <Zap className="w-3.5 h-3.5 text-pink-400" />
        <span>15-Minute Doorstep Network</span>
      </div>

      {/* Center Branding & Logo */}
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Animated Logo Container with 3D Glossy Emblem */}
        <div className="relative mb-5 flex flex-col items-center">
          <BrandLogo size="xl" showText={false} variant="3d" className="shadow-2xl shadow-pink-500/50" />
          {/* Subtle pulse ring behind */}
          <div className="absolute inset-0 rounded-3xl bg-pink-400/20 -z-10 animate-ping pointer-events-none"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-1.5 font-heading">
          <span>Quick</span>
          <span className="text-yellow-300">Serve</span>
        </h1>

        {/* Main Catchy Quote */}
        <p className="mt-4 text-base sm:text-lg font-extrabold text-pink-100 leading-snug px-2">
          {QUOTES[quoteIndex]}
        </p>

        {/* Sub-quote description */}
        <p className="mt-2 text-xs sm:text-sm text-pink-200/80 font-medium">
          Instant Domestic Help • Verified Professionals • Zero Hassle
        </p>

        {/* Highlights */}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-semibold text-pink-100">
            <Clock className="w-3.5 h-3.5 text-pink-300" />
            <span>15 Min ETA</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-semibold text-pink-100">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-300" />
            <span>100% Aadhaar Verified</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-semibold text-pink-100">
            <Sparkles className="w-3.5 h-3.5 text-pink-200" />
            <span>Pay After Service</span>
          </div>
        </div>
      </div>

      {/* Bottom Loading Progress Bar & Tag */}
      <div className="w-full max-w-xs flex flex-col items-center gap-3">
        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-pink-500/30">
          <div className="h-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 rounded-full animate-[progress_1.6s_ease-in-out_infinite]"></div>
        </div>
        <span className="text-[11px] text-pink-200/70 font-medium tracking-wide">
          Connecting to QuickServe Fast Network...
        </span>
      </div>
    </div>
  );
};
