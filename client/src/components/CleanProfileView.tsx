import React, { useState } from 'react';
import { CustomerUser } from '../types';
import { User, Phone, MapPin, ShieldCheck, HelpCircle, LogOut, MessageSquare, Headphones, Wrench, ChevronRight } from 'lucide-react';

interface CleanProfileViewProps {
  currentUser: CustomerUser;
  activeCityZone: string;
  onLogout: () => void;
  onOpenLocationModal: () => void;
  onSwitchToPartnerPortal: () => void;
}

export const CleanProfileView: React.FC<CleanProfileViewProps> = ({
  currentUser,
  activeCityZone,
  onLogout,
  onOpenLocationModal,
  onSwitchToPartnerPortal
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const doorstepAddress = (() => {
    try {
      const saved = localStorage.getItem('quickserve_doorstep_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.fullCompleteAddress || activeCityZone;
      }
    } catch (e) {}
    return activeCityZone;
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-[#2563EB] flex items-center justify-center font-extrabold text-xl shadow-md border border-slate-800">
            {currentUser.name ? currentUser.name.slice(0, 1).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] truncate font-heading">{currentUser.name || 'QuickServe Customer'}</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser.phone}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Saved Address Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Default Service Address</h3>
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
          >
            Change Address
          </button>
        </div>
        <div className="p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-xs text-[#0F172A] leading-relaxed">
            {doorstepAddress}
          </p>
        </div>
      </div>

      {/* QuickServe Guarantee & Policies */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Service Assurance</h3>
        
        <div className="flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Free Cancellation Anytime</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Cancel without any fee before the service professional reaches your door.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Verified Background Checked Professionals</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Aadhaar verified and trade skill evaluated professionals only.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Transparent Fixed Rate Card</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Zero surprise charges. Pay after job completion with cash or UPI.</p>
          </div>
        </div>
      </div>

      {/* Support & Help Desk */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-5 space-y-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Help & Support</h3>
        
        <a
          href="https://wa.me/919570151834?text=Hi%20QuickServe%20Team%2C%20I%20need%20assistance%20with%20my%20home%20service"
          target="_blank"
          rel="noreferrer"
          className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-xs font-medium text-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Chat on WhatsApp Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </a>

        <a
          href="tel:+919570151834"
          className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-xs font-medium text-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Headphones className="w-4 h-4 text-emerald-600" />
            <span>Call QuickServe Help Desk</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </a>
      </div>

      {/* Partner Onboarding Link */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 mb-5 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-emerald-950">Are you a Service Professional?</h4>
          <p className="text-xs text-emerald-800 mt-0.5">Register your trade and start getting local service bookings.</p>
        </div>
        <button
          type="button"
          onClick={onSwitchToPartnerPortal}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Partner Portal</span>
        </button>
      </div>

      {/* Logout Action */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of QuickServe</span>
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
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
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
