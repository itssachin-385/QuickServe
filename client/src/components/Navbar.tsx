import React, { useState } from 'react';
import { 
  MapPin,
  Languages,
  ChevronDown,
  User,
  LogOut,
  Wallet,
  Clock,
  ShoppingBag,
  Search,
  X,
  Zap,
  ShoppingCart
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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  cartCount?: number;
  onOpenCart?: () => void;
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
  onOpenLocationModal,
  searchQuery = '',
  onSearchChange,
  cartCount = 0,
  onOpenCart
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs text-slate-900 font-sans">
      {/* 1. TOP FLIPKART-STYLE STRIP: Brand Toggles (Left) & Delivery Location Selector (Right) */}
      <div className="bg-slate-50/90 border-b border-slate-200/80 px-4 sm:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Brand Toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectModule('website')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#ffe500] hover:bg-yellow-400 text-slate-900 font-extrabold text-[11px] shadow-2xs transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span>QuickServe</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectModule('customer_app')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer"
            >
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>15-Min Delivery</span>
            </button>
          </div>

          {/* Right: Flipkart-Style Delivery Location Selector */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition-colors group cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
              <span className="text-slate-500 text-[11px]">Location:</span>
              <span className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                {activeCityZone ? activeCityZone.split(',')[0] : 'Select delivery location'}
              </span>
              <span className="text-blue-600 font-bold text-[11px] group-hover:underline flex-shrink-0">
                Change location ›
              </span>
            </button>

            {/* Language toggle */}
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded border border-slate-200 bg-white text-[11px] font-semibold cursor-pointer"
              title="Switch Language"
            >
              <Languages className="w-3 h-3 text-amber-500" />
              <span>{lang === 'en' ? 'EN' : 'HI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR: Logo, Flipkart-Style Wide Search Bar, Login, More, Cart */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group"
            onClick={() => onSelectModule('website')}
          >
            <img 
              src="/images/quickserve_app_icon.png" 
              alt="QuickServe Logo" 
              className="w-10 h-10 rounded-xl object-contain shadow-2xs group-hover:scale-105 transition-transform" 
            />
            <div>
              <span className="text-2xl font-black tracking-tight text-[#04b565]">
                Quick<span className="text-slate-900">Serve</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                15-Min Domestic Help
              </span>
            </div>
          </div>

          {/* Flipkart-Style Prominent Wide Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <div className="relative flex items-center bg-blue-50/40 hover:bg-blue-50/60 focus-within:bg-white rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Search className="w-4 h-4 text-blue-600 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search for Products, Brands and More (Maid, Plumber, Electrician, AC...)"
                className="w-full pl-10 pr-9 py-2.5 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-3 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Utilities: Login, More, Cart */}
          <div className="flex items-center gap-5 flex-shrink-0">
            {/* Login / Profile Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsMoreMenuOpen(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{currentUser.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <span className="font-bold text-slate-900 block">{currentUser.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{currentUser.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { onSelectModule('customer_app'); setIsUserMenuOpen(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 rounded-xl flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>My Orders & Bookings</span>
                    </button>
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                        className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 border-t border-slate-100 mt-1 font-medium cursor-pointer"
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
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-800 hover:text-blue-600 hover:bg-blue-50/50 font-bold text-sm transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Login</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            {/* Flipkart-Style 'More' Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setIsMoreMenuOpen(!isMoreMenuOpen); setIsUserMenuOpen(false); }}
                className="flex items-center gap-1 text-slate-800 hover:text-blue-600 font-bold text-sm px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => { onSelectModule('pro_register'); setIsMoreMenuOpen(false); }}
                    className="w-full px-3 py-2.5 text-left hover:bg-emerald-50 text-slate-800 rounded-xl flex items-center gap-2.5 font-bold cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Become a Partner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onSelectModule('admin'); setIsMoreMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-700 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer"
                  >
                    <span>Admin Operations</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onSelectModule('customer_app'); setIsMoreMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-700 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer"
                  >
                    <span>Customer App Mode</span>
                  </button>
                </div>
              )}
            </div>

            {/* Flipkart-Style Cart with Counter Badge */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-800 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-bold text-sm relative group cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-slate-700 group-hover:text-blue-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
