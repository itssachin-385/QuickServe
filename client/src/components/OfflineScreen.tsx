import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    const handleNativeOnline = () => {
      handleManualRetry();
    };

    window.addEventListener('online', handleNativeOnline);
    return () => window.removeEventListener('online', handleNativeOnline);
  }, []);

  return (
    <div className="fixed inset-0 z-[999999] bg-white flex flex-col justify-between items-center px-6 py-10 select-none animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="w-full flex items-center justify-between max-w-sm pt-2">
        <BrandLogo size="md" />
        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-rose-700 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Offline</span>
        </div>
      </div>

      {/* Center Body */}
      <div className="flex flex-col items-center text-center max-w-sm px-2 my-auto">
        {/* Animated Wi-Fi Off Emblem */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-xl shadow-rose-600/10">
            <WifiOff className="w-14 h-14" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-md border-2 border-white">
            !
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
          No Internet Connection
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
          Please check your network settings and try again.
        </p>

        {/* Retry Failure Banner */}
        {retryFailed && (
          <div className="mt-4 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold animate-in shake">
            Unable to connect. Please turn on Wi-Fi or Mobile Data.
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
          <span>{isChecking ? 'Checking Connection...' : 'Retry Connection'}</span>
        </button>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-sm text-center text-xs text-slate-400">
        QuickServe &bull; On-Demand Services
      </div>

    </div>
  );
};
