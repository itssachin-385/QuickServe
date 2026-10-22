import React, { useState } from 'react';
import { CustomerUser } from '../types';
import { 
  User, Phone, MapPin, LogOut, MessageSquare, 
  Headphones, ChevronRight, DownloadCloud, Sparkles, 
  ArrowLeft, LogIn, ShieldAlert
} from 'lucide-react';

interface CleanProfileViewProps {
  currentUser: CustomerUser;
  activeCityZone: string;
  onLogout: () => void;
  onOpenLocationModal: () => void;
  onSwitchToPartnerPortal: () => void;
  onOpenAdminDesk?: () => void;
  onNavigateHome?: () => void;
}

export const CleanProfileView: React.FC<CleanProfileViewProps> = ({
  currentUser,
  activeCityZone,
  onLogout,
  onOpenLocationModal,
  onSwitchToPartnerPortal,
  onOpenAdminDesk,
  onNavigateHome
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Check if current user is an unauthenticated guest
  const isGuest = !currentUser.phone || 
    currentUser.phone.trim() === '' || 
    currentUser.id?.startsWith('guest') ||
    currentUser.name?.toLowerCase().includes('quickserve customer');

  const doorstepAddress = (() => {
    try {
      const saved = localStorage.getItem('quickserve_doorstep_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.fullCompleteAddress || activeCityZone;
      }
    } catch (e) {}
    return activeCityZone || 'No address set';
  })();

  return (
    <div className="max-w-4xl w-full mx-auto px-0 sm:px-4 py-2 sm:py-6 space-y-4 animate-in fade-in duration-200">
      
      {/* Top Header with Back Navigation Flow */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="p-2 -ml-1 text-slate-700 hover:text-pink-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-xl font-black text-slate-900 tracking-tight font-heading">
            My Account
          </h1>
        </div>
      </div>

      {/* Profile Header Card - Elevated & Tactile */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-pink-500/25 shrink-0">
              {!isGuest && currentUser.name ? (
                currentUser.name.slice(0, 1).toUpperCase()
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate font-heading">
                {!isGuest && currentUser.name ? currentUser.name : 'Guest User'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                {!isGuest && currentUser.phone ? (
                  <>
                    <Phone className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span>{currentUser.phone}</span>
                  </>
                ) : (
                  <span className="text-slate-400">Phone not verified</span>
                )}
              </p>
            </div>
          </div>

          {/* Action button: Login if guest, Logout if logged in */}
          {isGuest ? (
            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              Log Out
            </button>
          )}
        </div>
      </div>

      {/* Saved Address Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Default Service Address</h3>
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline cursor-pointer active:scale-95 transition-transform"
          >
            Change Address
          </button>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {doorstepAddress}
          </p>
        </div>
      </div>

      {/* Support & Help Desk */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-2.5">
        <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">Help & Support</h3>
        
        <a
          href="https://wa.me/919570151834?text=Hi%20QuickServe%20Team%2C%20I%20need%20assistance%20with%20my%20home%20service"
          target="_blank"
          rel="noreferrer"
          className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-[0.98] flex items-center justify-between text-xs font-semibold text-slate-800 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Chat on WhatsApp Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </a>

        <a
          href="tel:+919570151834"
          className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-[0.98] flex items-center justify-between text-xs font-semibold text-slate-800 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <Headphones className="w-4 h-4 text-emerald-600" />
            <span>Call QuickServe Help Desk</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </a>
      </div>

      {/* App Version & In-App Auto-Update Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
              <span>QuickServe v4.9</span>
              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                Latest (Code 36)
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              Direct In-App Auto-Update enabled.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = 'https://quickserve-3lhk.onrender.com/download-apk';
          }}
          className="px-3.5 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-xl border border-pink-200 flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer whitespace-nowrap shadow-2xs transition-transform"
          title="Direct APK Download"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-pink-600" />
          <span>Update App</span>
        </button>
      </div>

      {/* Discreet Partner & Admin Link at the very bottom */}
      <div className="pt-3 pb-2 text-center">
        <button
          type="button"
          onClick={() => onSwitchToPartnerPortal()}
          className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer transition-colors"
        >
          Technician & Operations Desk &rarr;
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Logout?</h3>
              <p className="text-xs text-slate-500 mt-1">You will need to verify your phone number with OTP to log back in.</p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
