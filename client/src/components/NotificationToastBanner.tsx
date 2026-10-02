import React, { useEffect, useState } from 'react';
import { notificationService, InAppToast } from '../services/notificationService';
import { openWhatsAppBookingShare } from '../utils/whatsapp';
import { Bell, X, MessageCircle, ArrowRight } from 'lucide-react';

interface NotificationToastBannerProps {
  onOpenTracking?: (bookingId?: string) => void;
  customerPhone?: string;
}

export const NotificationToastBanner: React.FC<NotificationToastBannerProps> = ({
  onOpenTracking,
  customerPhone,
}) => {
  const [activeToast, setActiveToast] = useState<InAppToast | null>(null);

  // Play subtle pleasant in-app notification chime via Web Audio API
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((toast) => {
      setActiveToast(toast);
      playChime();

      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        setActiveToast((prev) => (prev?.id === toast.id ? null : prev));
      }, 7000);

      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!activeToast) return null;

  return (
    <div className="fixed top-3 inset-x-0 z-[9999] px-3 pointer-events-none flex justify-center animate-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto bg-slate-900/95 text-white border border-emerald-500/40 backdrop-blur-md rounded-2xl shadow-2xl p-3.5 max-w-md w-full flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">QuickServe Alert</span>
                <span className="text-[9px] text-slate-400">Just now</span>
              </div>
              <h4 className="font-bold text-xs text-white leading-tight mt-0.5">{activeToast.title}</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">{activeToast.body}</p>
            </div>
          </div>

          <button
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeToast.startOtp && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-emerald-300 font-medium">Your Start OTP:</span>
            <span className="text-sm font-mono font-black text-emerald-400 tracking-wider">
              {activeToast.startOtp}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              openWhatsAppBookingShare(
                {
                  id: activeToast.id,
                  service_start_otp: activeToast.startOtp,
                },
                customerPhone
              );
            }}
            className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>Updates on WhatsApp</span>
          </button>

          {onOpenTracking && (
            <button
              onClick={() => {
                setActiveToast(null);
                onOpenTracking();
              }}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <span>Track</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationToastBanner;
