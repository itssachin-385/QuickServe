import React, { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';

interface AppSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  onFinish,
  minDurationMs = 1400
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 300);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col justify-center items-center bg-white text-slate-900 px-6 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Center Branding & Logo - Minimalist & Premium */}
      <div className="flex flex-col items-center text-center max-w-sm animate-in fade-in zoom-in-95 duration-500">
        {/* Animated Logo Container with Pink House Emblem */}
        <div className="relative mb-5 flex flex-col items-center">
          <BrandLogo size="xl" showText={false} className="drop-shadow-xl" />
          <div className="absolute inset-0 rounded-3xl bg-pink-100/60 -z-10 animate-pulse pointer-events-none scale-110"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1 font-heading">
          <span className="text-pink-600">Quick</span>
          <span className="text-slate-900">Serve</span>
        </h1>

        {/* Subtitle / Tagline */}
        <p className="mt-1.5 text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-400">
          Instant Domestic Help Network
        </p>
      </div>
    </div>
  );
};
