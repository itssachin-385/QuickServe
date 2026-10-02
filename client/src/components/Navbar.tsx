import React, { useState } from 'react';
import { 
  MapPin,
  Languages,
  ChevronDown,
  User,
  LogOut,
  Wallet,
  Clock,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { CustomerUser } from '../types';

export type ActiveModule = 'website' | 'customer_app' | 'pro_app' | 'pro_register' | 'admin' | 'architecture' | 'simulator';

interface NavbarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  lang: 'en' | 'hi';
  onToggleLang: () => void;
  isMobileDeviceFrame?: boolean;
  onToggleMobileFrame?: () => void;
  activeCityZone: string;
  currentUser?: CustomerUser | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onChangeCityZone?: (zone: string) => void;
  onOpenGateways?: () => void;
  onOpenLocationModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  lang,
  onToggleLang,
  activeCityZone,
  currentUser,
  onOpenAuth,
  onLogout,
  onChangeCityZone,
  onOpenLocationModal
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isZoneMenuOpen, setIsZoneMenuOpen] = useState(false);

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs text-slate-900">
      {/* Top Banner: Minimal Location & 15-Min Live Delivery Strip (Desktop Only) */}
      <div className="bg-slate-950 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium">QuickServe Micro-Hubs Active</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Hyperlocal Cluster Dropdown & GPS Detector */}
          <div className="relative">
            <button
              onClick={() => {
                if (onOpenLocationModal) {
                  onOpenLocationModal();
                } else {
                  setIsZoneMenuOpen(!isZoneMenuOpen);
                }
              }}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer text-xs group"
              title="Click to change or auto-detect location via GPS"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-white font-black truncate max-w-[140px] sm:max-w-none">{activeCityZone || 'Indiranagar Hub 01'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isZoneMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50 text-xs animate-in fade-in">
                <span className="px-3.5 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-100">
                  Select Bengaluru Cluster:
                </span>
                {[
                  { name: 'Indiranagar Hub 01', area: '100ft Rd / Defence Colony' },
                  { name: 'Koramangala Hub 02', area: '4th Block / Sony World' },
                  { name: 'HSR Layout Hub 03', area: 'Sector 1 / 27th Main' }
                ].map(cluster => (
                  <button
                    key={cluster.name}
                    onClick={() => {
                      if (onChangeCityZone) onChangeCityZone(cluster.name);
                      setIsZoneMenuOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between transition-colors ${
                      activeCityZone.includes(cluster.name.split(' ')[0]) 
                        ? 'text-emerald-700 font-bold bg-emerald-50/60' 
                        : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold">{cluster.name}</span>
                      <span className="text-[10px] text-slate-400">{cluster.area}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ~15m
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <button 
            onClick={onToggleLang}
            className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded transition-colors text-xs"
            title="Switch Language"
          >
            <Languages className="w-3 h-3 text-amber-400" />
            <span className="font-semibold">{lang === 'en' ? 'EN' : 'HI'}</span>
          </button>
        </div>
      </div>

      {/* Main Bar: Clean, White, Modern Consumer Brand Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onSelectModule('website')}
          >
            <img 
              src="/images/quickserve_app_icon.png" 
              alt="QuickServe Logo" 
              className="w-10 h-10 rounded-2xl group-hover:scale-105 transition-transform object-contain" 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-[#04b565] font-sans">
                  Quick<span className="text-[#364854]">Serve</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Home & Local Services
              </p>
            </div>
          </div>

          {/* Simple Clean Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <button
              onClick={() => {
                if (activeModule !== 'website') onSelectModule('website');
                setTimeout(() => {
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className={`hover:text-emerald-600 transition-colors ${
                activeModule === 'website' ? 'text-emerald-600 font-bold' : ''
              }`}
            >
              Services
            </button>

            <button
              onClick={() => onSelectModule('customer_app')}
              className={`hover:text-emerald-600 transition-colors flex items-center gap-1.5 ${
                activeModule === 'customer_app' ? 'text-emerald-600 font-bold' : ''
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Track Dispatch</span>
            </button>
          </nav>

          {/* Right Action: Clean User Login / Profile Dropdown & CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeModule !== 'website') onSelectModule('website');
                setTimeout(() => {
                  document.getElementById('quick-book')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-sm shadow-amber-400/30 group"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-900 group-hover:rotate-12 transition-transform" />
              <span>Book a Service</span>
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 transition-all text-left shadow-xs"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-xl object-cover border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block leading-tight">
                      Verified Customer
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in">
                    <div className="p-2.5 border-b border-slate-100 pb-2.5">
                      <span className="font-bold text-slate-900 block text-sm">{currentUser.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {currentUser.phone.startsWith('+91') ? currentUser.phone : `+91 ${currentUser.phone}`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectModule('customer_app');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-left text-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                    >
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>My Bookings & Live Orders</span>
                    </button>

                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full p-2 rounded-xl hover:bg-rose-50 text-left text-rose-600 flex items-center gap-2 transition-colors pt-2 border-t border-slate-100 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <User className="w-4 h-4" />
                <span>Login / Sign Up</span>
              </button>
            )}

            <button
              onClick={() => onSelectModule('pro_register')}
              className="hidden sm:flex bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors items-center gap-1.5 shadow-xs"
            >
              <span>Partner Onboarding</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
