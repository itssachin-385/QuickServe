import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Phone, ShieldCheck, Zap } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { API_BASE } from '../api';

interface OfflineScreenProps {
  onRetry?: () => Promise<any> | void;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  const handleManualRetry = async () => {
    setIsChecking(true);
    setRetryFailed(false);
    try {
      const base = API_BASE.replace(/\/api\/?$/, '');
      const res = await fetch(`${base}/api/ping`, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(3500)
      }).catch(() => null);

      if (res && res.ok) {
        if (onRetry) await onRetry();
      } else {
        // Also fallback test with a fast public HEAD request
        const googleTest = await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-store',
          signal: AbortSignal.timeout(3000)
        }).catch(() => null);

        if (googleTest) {
          if (onRetry) await onRetry();
        } else {
          setRetryFailed(true);
        }
      }
    } catch (e) {
      setRetryFailed(true);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-retry as soon as browser/device fires native 'online' event
  useEffect(() => {
    const handleNativeOnline = () => {
      handleManualRetry();
    };

    window.addEventListener('online', handleNativeOnline);
    return () => window.removeEventListener('online', handleNativeOnline);
  }, []);

  return (
    <div className="fixed inset-0 z-[999999] bg-white flex flex-col justify-between items-center px-6 py-8 select-none animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="w-full flex items-center justify-between max-w-sm pt-2">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-full text-rose-700 text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Offline</span>
        </div>
      </div>

      {/* Center Body */}
      <div className="flex flex-col items-center text-center max-w-sm px-2">
        {/* Animated Wi-Fi Off Emblem */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-xl shadow-rose-600/10">
            <WifiOff className="w-12 h-12" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-white">
            !
          </div>
        </div>

        {/* Headlines */}
        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
          No Internet Connection
        </h2>
        <p className="text-xs font-bold text-pink-700 uppercase tracking-wider mt-1">
          इंटरनेट कनेक्शन नहीं है
        </p>

        {/* Explanation */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4 text-left space-y-2">
          <div className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
            <Zap className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
            <p>
              <strong>Only Online Service:</strong> QuickServe Rapido aur Swiggy ki tarah live 15-minute dispatch network hai. Live technicians track karne ke liye internet connection zaroori hai.
            </p>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed pt-1 border-t border-slate-200/70">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-slate-600 text-[11px]">
              Kripya apne phone me <strong>Mobile Data</strong> ya <strong>Wi-Fi</strong> turn ON karein.
            </p>
          </div>
        </div>

        {/* Retry Failure Banner */}
        {retryFailed && (
          <div className="mt-4 px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold animate-in shake">
            Internet abhi bhi connect nahi ho paya. Data check karein.
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleManualRetry}
          disabled={isChecking}
          className="w-full mt-6 py-3.5 px-6 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-700 hover:to-rose-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-pink-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking Connection...' : 'Retry Connection (दोबारा चेक करें)'}</span>
        </button>
      </div>

      {/* Bottom Emergency Help */}
      <div className="w-full max-w-sm pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Urgent Help?</span>
        <a 
          href="tel:+919570151834"
          className="inline-flex items-center gap-1.5 text-pink-700 font-bold hover:underline"
        >
          <Phone className="w-3.5 h-3.5 text-pink-600" />
          <span>Call: +91 95701 51834</span>
        </a>
      </div>

    </div>
  );
};
