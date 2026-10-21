import React, { useState, useMemo, useEffect } from 'react';
import { CustomerUser, Booking, ServiceCategory } from '../types';
import { professionalHomeServices, HomeServiceCard } from '../data/homeServices';
import { CleanOrdersView } from './CleanOrdersView';
import { CleanProfileView } from './CleanProfileView';
import { CleanBookingModal } from './CleanBookingModal';
import { CleanLocationModal } from './CleanLocationModal';
import { 
  Search, MapPin, Sparkles, Wrench, Zap, 
  Wind, Utensils, Truck, Home, ShoppingBag, 
  User, ChevronRight, Clock, ShieldCheck, CheckCircle2, 
  X, Briefcase, Check, ArrowRight, Globe, Navigation,
  Mic, Heart, Package, LayoutGrid, ArrowUpDown, Tag, Star, Flame
} from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { playDoorbellChime } from '../utils/sound';
import { LiveTrackingModal } from './LiveTrackingModal';
import { BrandLogo } from './BrandLogo';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { reverseGeocodeGoogle } from '../utils/googleMapsService';

interface CleanCustomerAppProps {
  currentUser: CustomerUser;
  categories: ServiceCategory[];
  bookings: Booking[];
  onRefreshBookings: () => void;
  onLogout: () => void;
  activeCityZone: string;
  onSelectZone: (zone: string, fullAddress?: string) => void;
  onSwitchToPartnerPortal: (directAdminDesk?: boolean) => void;
}

// 6 Core Categories - Urban Company & Linear Minimalist Style
interface CoreCategoryConfig {
  id: string;
  name: string;
  matchCatIds: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const CORE_CATEGORIES: CoreCategoryConfig[] = [
  {
    id: 'cleaning',
    name: 'Cleaning & Maid',
    matchCatIds: ['cat-maid', 'cat-deep-clean', 'cleaning'],
    icon: Sparkles
  },
  {
    id: 'plumber',
    name: 'Plumber',
    matchCatIds: ['cat-plumber', 'plumber'],
    icon: Wrench
  },
  {
    id: 'electrician',
    name: 'Electrician',
    matchCatIds: ['cat-electrician', 'electrician'],
    icon: Zap
  },
  {
    id: 'ac_appliances',
    name: 'AC & Appliances',
    matchCatIds: ['cat-ac-repair', 'cat-appliance', 'ac-repair'],
    icon: Wind
  },
  {
    id: 'cook',
    name: 'Cook',
    matchCatIds: ['cat-cook', 'cook'],
    icon: Utensils
  },
  {
    id: 'moving',
    name: 'Moving Help',
    matchCatIds: ['cat-packers', 'cat-tempo', 'packers'],
    icon: Truck
  }
];

export const CleanCustomerApp: React.FC<CleanCustomerAppProps> = ({
  currentUser,
  bookings,
  onRefreshBookings,
  onLogout,
  activeCityZone,
  onSelectZone,
  onSwitchToPartnerPortal
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'profile'>('home');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Meesho Photo 2 Filtering & Sorting State
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high' | 'rating'>('popular');
  const [quickFilter, setQuickFilter] = useState<'all' | '15m' | 'top_rated' | 'under300'>('all');
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quickserve_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isListeningMic, setIsListeningMic] = useState(false);

  const toggleWishlist = (serviceId: string) => {
    playDoorbellChime();
    setWishlist(prev => {
      const updated = prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId];
      localStorage.setItem('quickserve_wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  const handleVoiceSearch = () => {
    playDoorbellChime();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.onstart = () => setIsListeningMic(true);
        recognition.onend = () => setIsListeningMic(false);
        recognition.onerror = () => setIsListeningMic(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setSearchQuery(transcript);
          }
          setIsListeningMic(false);
        };
        recognition.start();
      } catch (e) {
        setIsListeningMic(false);
      }
    } else {
      const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (input) input.focus();
    }
  };

  // Modals
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [bookingService, setBookingService] = useState<HomeServiceCard | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Booking | null>(null);
  const [isRefreshingLiveGps, setIsRefreshingLiveGps] = useState(false);

  const handleQuickLiveGpsRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshingLiveGps(true);
    playDoorbellChime();

    try {
      let lat: number | null = null;
      let lon: number | null = null;

      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== 'granted') await Geolocation.requestPermissions();
          const pos = await Promise.race([
            Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]).catch(() => Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 4000, maximumAge: 0 }));
          if (pos?.coords) {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          }
        } catch (e) {}
      }

      if (lat === null || lon === null) {
        if (navigator.geolocation) {
          const p = await new Promise<{ lat: number; lon: number } | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              () => {
                navigator.geolocation.getCurrentPosition(
                  (pos2) => resolve({ lat: pos2.coords.latitude, lon: pos2.coords.longitude }),
                  () => resolve(null),
                  { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
                );
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          });
          if (p) {
            lat = p.lat;
            lon = p.lon;
          }
        }
      }

      if (lat !== null && lon !== null) {
        const res = await reverseGeocodeGoogle(lat, lon);
        if (res && res.areaCity) {
          onSelectZone(res.areaCity);
          const fullAddr = [res.houseNo ? `House ${res.houseNo}` : '', res.streetGali, res.landmark ? `Near ${res.landmark}` : '', res.areaCity].filter(Boolean).join(', ');
          localStorage.setItem('quickserve_user_address', fullAddr);
          setSuccessToast(`📍 Live Location Updated: ${res.areaCity}`);
          setTimeout(() => setSuccessToast(''), 3500);
        }
      } else {
        setSuccessToast('GPS signal weak. Tap location to select area manually.');
        setTimeout(() => setSuccessToast(''), 3000);
      }
    } catch (err) {
      setSuccessToast('Location check error.');
      setTimeout(() => setSuccessToast(''), 3000);
    } finally {
      setIsRefreshingLiveGps(false);
    }
  };

  // Auto-prompt location picker if no location is selected yet (for new users)
  useEffect(() => {
    if (!activeCityZone) {
      const timer = setTimeout(() => {
        setIsLocationModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeCityZone]);

  // Active customer orders count & current active booking
  const myCleanPhone = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
  const activeOrdersCount = useMemo(() => {
    return bookings.filter(b => {
      const bPhone = (b.customer_phone || '').replace(/\D/g, '').slice(-10);
      const isMine = !myCleanPhone || bPhone === myCleanPhone || bPhone.includes(myCleanPhone);
      return isMine && b.status !== 'completed' && b.status !== 'cancelled';
    }).length;
  }, [bookings, myCleanPhone]);

  const activeOrder = useMemo(() => {
    return bookings.find(b => {
      const bPhone = (b.customer_phone || '').replace(/\D/g, '').slice(-10);
      const isMine = !myCleanPhone || bPhone === myCleanPhone || bPhone.includes(myCleanPhone);
      return isMine && b.status !== 'completed' && b.status !== 'cancelled';
    });
  }, [bookings, myCleanPhone]);


  // Filtered and sorted services (Meesho Photo 2 layout)
  const filteredServices = useMemo(() => {
    let list = [...professionalHomeServices];

    // Filter by search query if any
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        s.title.toLowerCase().includes(q) ||
        (s.subServiceName && s.subServiceName.toLowerCase().includes(q)) ||
        (s.tagline && s.tagline.toLowerCase().includes(q)) ||
        s.includedTasks.some(t => t.toLowerCase().includes(q))
      );
    }

    // Filter by selected core category
    if (selectedCategoryKey !== 'all') {
      const catConfig = CORE_CATEGORIES.find(c => c.id === selectedCategoryKey);
      if (catConfig) {
        list = list.filter(s => catConfig.matchCatIds.includes(s.categoryId) || catConfig.matchCatIds.includes(s.categorySlug));
      }
    }

    // Quick filters
    if (quickFilter === '15m') {
      list = list.filter(s => s.duration_mins <= 60);
    } else if (quickFilter === 'top_rated') {
      list = list.filter(s => s.isPopular);
    } else if (quickFilter === 'under300') {
      list = list.filter(s => s.startingPrice <= 299);
    }

    // Sorting
    if (sortBy === 'price_low') {
      list.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }

    return list;
  }, [searchQuery, selectedCategoryKey, quickFilter, sortBy]);

  // Dual-Language Support (English & Hindi)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('quickserve_lang') as Language) || 'en';
  });

  const toggleLanguage = () => {
    const next: Language = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('quickserve_lang', next);
  };

  const t = translations[lang];

  const getCategoryName = (id: string, defaultName: string) => {
    if (lang === 'hi') {
      switch (id) {
        case 'cleaning': return 'सफाई व मेड';
        case 'plumber': return 'प्लंबर (नल व पाइप)';
        case 'electrician': return 'इलेक्ट्रीशियन (बिजली)';
        case 'ac_appliances': return 'एसी व उपकरण';
        case 'cook': return 'रसोइया / कुक';
        case 'moving': return 'शिफ्टिंग व ट्रांसपोर्ट';
        default: return defaultName;
      }
    }
    return defaultName;
  };

  const handleBookingPlaced = (newBooking: Booking) => {
    onRefreshBookings();
    playDoorbellChime();
    setSuccessToast(`Order #${newBooking.booking_reference} confirmed!`);
    setActiveTab('orders');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FFF7F9] text-[#1F121C] flex flex-col pb-28 md:pb-8 selection:bg-pink-100 selection:text-pink-900">
      
      {/* 1. COMPACT, REFINED HEADER WITH AUTO SAFE AREA */}
      <header className="bg-white/95 backdrop-blur-md border-b border-pink-100 sticky top-0 z-30 transition-all pt-[max(12px,env(safe-area-inset-top,0px))]">
        
        {/* DESKTOP HEADER (sm and up) */}
        <div className="hidden sm:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 items-center justify-between gap-4 lg:gap-6">
          {/* Left: QuickServe Logo + Location Pill */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('home'); setSelectedCategoryKey('all'); setSearchQuery(''); }}
              className="group text-left focus:outline-none cursor-pointer"
            >
              <BrandLogo size="md" />
            </button>

            {/* Selected Location Pill */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-pink-50/60 hover:bg-pink-50 rounded-full border border-pink-200/80 text-left transition-all max-w-[220px] md:max-w-[280px] group shadow-2xs cursor-pointer"
              title="Change Delivery Location"
            >
              <MapPin className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <span className="text-xs font-semibold text-[#1F121C] truncate">
                {activeCityZone || (lang === 'hi' ? 'लोकेशन चुनें' : 'Select Location')}
              </span>
              <span className="text-[10px] text-pink-600 font-bold shrink-0 ml-0.5 group-hover:underline">
                {lang === 'hi' ? 'बदलें' : 'Change'}
              </span>
            </button>
          </div>

          {/* Center: Desktop Search Bar */}
          <div className="flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 text-xs bg-pink-50/40 hover:bg-white focus:bg-white border border-pink-200/70 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-[#1F121C] placeholder-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-pink-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Header Navigation: Language Switcher, Orders, Profile, Partner Portal */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-pink-200 bg-pink-50/60 hover:bg-pink-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Switch Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-pink-600" />
              <span className={lang === 'en' ? 'text-pink-600 font-extrabold' : 'text-slate-400'}>EN</span>
              <span className="text-pink-200">|</span>
              <span className={lang === 'hi' ? 'text-pink-600 font-extrabold' : 'text-slate-400'}>हिंदी</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchToPartnerPortal(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:text-pink-900 bg-pink-50/50 hover:bg-pink-100/70 rounded-xl border border-pink-200 transition-colors cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-pink-600" />
              <span>{t.partnerPortal}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-pink-100 border-pink-300 text-pink-600'
                  : 'bg-white border-pink-100 text-[#1F121C] hover:bg-pink-50'
              }`}
              title="My Orders"
            >
              <ShoppingBag className="w-4 h-4" />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-pink-100 border-pink-300 text-pink-600'
                  : 'bg-white border-pink-100 text-[#1F121C] hover:bg-pink-50'
              }`}
              title="Profile & Support"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MOBILE HEADER (sm:hidden) - Photo 1 Design */}
        <div className="sm:hidden px-3 pt-1 pb-2 space-y-2">
          {/* Mobile Top Row: User Avatar (Left) + QuickServe Logo (Center) + Wishlist & Cart/Orders Badge (Right) */}
          <div className="flex items-center justify-between">
            {/* Left: User Avatar & Greeting */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1.5 text-left focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 border border-pink-200 text-pink-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentUser?.name && !currentUser.name.toLowerCase().includes('quickserve')
                  ? currentUser.name.slice(0, 2).toUpperCase()
                  : <User className="w-4 h-4 text-pink-600" />}
              </div>
              <span className="text-xs font-bold text-[#1F121C] truncate max-w-[80px]">
                {currentUser?.name && !currentUser.name.toLowerCase().includes('quickserve')
                  ? currentUser.name.split(' ')[0]
                  : (lang === 'hi' ? 'नमस्ते' : 'Profile')}
              </span>
            </button>

            {/* Center: Brand Logo */}
            <button
              type="button"
              onClick={() => { setActiveTab('home'); setSelectedCategoryKey('all'); setSearchQuery(''); }}
              className="focus:outline-none cursor-pointer"
            >
              <BrandLogo size="sm" />
            </button>

            {/* Right: Wishlist Chime + Active Orders Cart Badge */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => playDoorbellChime()}
                className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200/80 text-pink-600 flex items-center justify-center hover:bg-pink-100 transition-colors shadow-2xs cursor-pointer"
                title="Doorbell Chime"
              >
                <Heart className="w-4 h-4 text-pink-600" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200/80 text-pink-600 flex items-center justify-center hover:bg-pink-100 transition-colors relative shadow-2xs cursor-pointer"
                title={t.myOrders}
              >
                <ShoppingBag className="w-4 h-4 text-pink-600" />
                {activeOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                    {activeOrdersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Row 2: Search Bar with Mic Icon (Photo 1 Style) */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-pink-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'सर्विस या काम खोजें (उदा. प्लंबर, नौकरानी)...' : 'Search by service or chore (e.g. Maid, Plumber)...'}
              className="w-full pl-9 pr-14 py-2 text-xs bg-pink-50/40 hover:bg-white focus:bg-white border border-pink-200/90 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-[#1F121C] placeholder-slate-400 transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1 text-pink-500">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-pink-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="p-1 text-pink-500 cursor-pointer">
                <Mic className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Mobile Row 3: Dedicated Location Selector Bar (Delivering to ... >) with 1-Tap Live GPS Refresh */}
          <div className="w-full flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex-1 flex items-center justify-between px-3 py-1.5 bg-pink-50/60 hover:bg-pink-100/70 active:bg-pink-100 rounded-xl border border-pink-200/80 text-left transition-all shadow-2xs group cursor-pointer min-w-0"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-700 truncate">
                  {lang === 'hi' ? 'डिलीवरी:' : 'Delivering to'} <strong className="text-pink-700 font-bold">{activeCityZone || (lang === 'hi' ? 'लोकेशन चुनें' : 'Select Location')}</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-pink-600 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
                &gt;
              </span>
            </button>

            {/* 1-Tap Live GPS Quick Button */}
            <button
              type="button"
              disabled={isRefreshingLiveGps}
              onClick={handleQuickLiveGpsRefresh}
              className="px-2.5 py-1.5 bg-white hover:bg-pink-50 active:scale-90 text-pink-600 border border-pink-200/90 rounded-xl shadow-2xs flex items-center gap-1 text-[11px] font-bold shrink-0 transition-all cursor-pointer"
              title="Current live location fetch"
            >
              <Navigation className={`w-3.5 h-3.5 ${isRefreshingLiveGps ? 'animate-spin text-pink-500' : 'text-pink-600'}`} />
              <span className="text-[10px] font-bold text-pink-700">GPS</span>
            </button>
          </div>
        </div>

      </header>

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-pink-400">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER (Responsive ~1200-1400px maximum) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 pt-2.5 pb-20 sm:py-6">
        
        {/* VIEW 1: HOME CATALOG VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-6 sm:space-y-7">
            
            {/* Visual Hierarchy: Small Elegant Welcome Heading */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-pink-100 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F121C] tracking-tight font-heading">
                  {t.tagline}
                </h1>
                <p className="text-xs sm:text-sm text-[#705869] mt-1">
                  {t.subtitle}
                </p>
              </div>

              {/* Badges & Sleek Status Chips */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
                  <span>Aadhaar Verified</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs">
                  <Check className="w-3.5 h-3.5 text-pink-600" />
                  <span>Zero Advance</span>
                </span>
              </div>
            </div>

            {/* Live Active Order Tracking Banner on Home Screen */}
            {activeOrder && (
              <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white p-4 rounded-3xl shadow-lg shadow-pink-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-pink-400/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl shrink-0">
                    🛵
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-pink-200">Live GPS Order</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <h4 className="font-extrabold text-sm truncate">{activeOrder.service_title} • #{activeOrder.booking_reference}</h4>
                    <p className="text-xs text-pink-100/90 truncate">Partner {activeOrder.professional_name || 'Rahul Kumar'} is on the way</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTrackingOrder(activeOrder)}
                    className="px-4 py-2 bg-white text-pink-700 hover:bg-pink-50 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-pink-600 animate-pulse" />
                    <span>Track on Map</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. CATEGORY NAVIGATION (Pink Accent Cards) */}
            <div>
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="text-xs font-bold text-pink-900/70 uppercase tracking-wider">
                  {lang === 'hi' ? 'सेवा श्रेणियां' : 'Service Categories'}
                </h2>
                {selectedCategoryKey !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryKey('all')}
                    className="text-xs font-semibold text-pink-600 hover:text-pink-700 hover:underline shrink-0 cursor-pointer"
                  >
                    {lang === 'hi' ? 'सभी श्रेणियां देखें' : 'View All Categories'}
                  </button>
                )}
              </div>

              {/* Category row: Desktop 6-col grid, Mobile clean horizontal scroll */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar pb-1">
                {CORE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategoryKey === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryKey(isSelected ? 'all' : cat.id)}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-center flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-600 text-white shadow-md shadow-pink-500/25 -translate-y-0.5'
                          : 'bg-white border-pink-100 text-[#1F121C] hover:border-pink-300 hover:shadow-[0_4px_20px_-2px_rgba(219,39,119,0.1)] hover:-translate-y-0.5'
                      }`}
                    >
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-pink-50/70 text-pink-600 group-hover:bg-pink-100 group-hover:text-pink-700'
                      }`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className={`text-xs font-bold leading-tight ${
                        isSelected ? 'text-white' : 'text-[#1F121C]'
                      }`}>
                        {getCategoryName(cat.id, cat.name)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. MEESHO-STYLE 2-COLUMN SERVICE MARKETPLACE (Photo 2 Reference) */}
            <div className="space-y-3">
              
              {/* Meesho Top Filter Bar: Sort, Instant, Top Rated, Budget */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy(prev => prev === 'price_low' ? 'price_high' : prev === 'price_high' ? 'rating' : prev === 'rating' ? 'popular' : 'price_low');
                  }}
                  className="px-3 py-1.5 rounded-full border border-pink-200 bg-white hover:bg-pink-50 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-pink-600" />
                  <span>
                    Sort: {sortBy === 'price_low' ? 'Price: Low' : sortBy === 'price_high' ? 'Price: High' : sortBy === 'rating' ? 'Top Rated' : 'Popular'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickFilter(prev => prev === '15m' ? 'all' : '15m')}
                  className={`px-3 py-1.5 rounded-full border shrink-0 transition-all cursor-pointer active:scale-95 ${
                    quickFilter === '15m'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-xs'
                      : 'bg-white border-pink-200 text-slate-700 hover:bg-pink-50 shadow-2xs'
                  }`}
                >
                  ⚡ 15 Mins Instant
                </button>

                <button
                  type="button"
                  onClick={() => setQuickFilter(prev => prev === 'top_rated' ? 'all' : 'top_rated')}
                  className={`px-3 py-1.5 rounded-full border shrink-0 transition-all cursor-pointer active:scale-95 ${
                    quickFilter === 'top_rated'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-xs'
                      : 'bg-white border-pink-200 text-slate-700 hover:bg-pink-50 shadow-2xs'
                  }`}
                >
                  ⭐ Top Rated (4.8★)
                </button>

                <button
                  type="button"
                  onClick={() => setQuickFilter(prev => prev === 'under300' ? 'all' : 'under300')}
                  className={`px-3 py-1.5 rounded-full border shrink-0 transition-all cursor-pointer active:scale-95 ${
                    quickFilter === 'under300'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-xs'
                      : 'bg-white border-pink-200 text-slate-700 hover:bg-pink-50 shadow-2xs'
                  }`}
                >
                  ₹ Under 299
                </button>
              </div>

              {/* Title & Count Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-extrabold text-[#1F121C] flex items-center gap-2">
                  <span>
                    {selectedCategoryKey !== 'all'
                      ? CORE_CATEGORIES.find(c => c.id === selectedCategoryKey)?.name
                      : searchQuery
                      ? `Search: "${searchQuery}"`
                      : 'Services for You'}
                  </span>
                  <span className="text-[11px] font-extrabold text-pink-700 bg-pink-100/70 px-2 py-0.5 rounded-full border border-pink-200/60">
                    {filteredServices.length}
                  </span>
                </h3>
              </div>

              {filteredServices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-pink-100 p-8 sm:p-10 text-center shadow-[0_4px_20px_-2px_rgba(219,39,119,0.06)]">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-[#1F121C]">No services found</p>
                  <p className="text-xs text-[#705869] mt-1 max-w-sm mx-auto">
                    Try searching for another service like tap repair, kitchen cleaning, or fan installation.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategoryKey('all'); setQuickFilter('all'); }}
                    className="mt-4 px-4 py-2 text-xs bg-pink-50 text-pink-600 font-bold rounded-xl hover:bg-pink-100 transition-colors cursor-pointer"
                  >
                    Reset Search & Filters
                  </button>
                </div>
              ) : (
                /* 2-COLUMN GRID (Photo 2 Reference) */
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {filteredServices.map((service) => {
                    const isWishlisted = wishlist.includes(service.id);
                    const originalPrice = Math.round(service.startingPrice * 1.35);
                    const discountPercent = Math.round(((originalPrice - service.startingPrice) / originalPrice) * 100);
                    const areaName = activeCityZone ? activeCityZone.split(',')[0] : 'Your Locality';

                    return (
                      <div
                        key={service.id}
                        className="bg-white rounded-2xl border border-pink-100/90 overflow-hidden shadow-[0_2px_12px_-2px_rgba(219,39,119,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(219,39,119,0.12)] hover:border-pink-300 transition-all duration-200 flex flex-col justify-between group"
                      >
                        {/* Photo Container with Wishlist & Badge Overlays */}
                        <div className="relative aspect-square w-full overflow-hidden bg-pink-50/40">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          
                          {/* Top-left Mall / Fast Tag */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-purple-700 text-white shadow-xs">
                              ⚡ 15m Fast
                            </span>
                          </div>

                          {/* Top-right Wishlist Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(service.id);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-pink-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-90"
                            title="Add to Wishlist"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-pink-600 text-pink-600' : ''}`} />
                          </button>

                          {/* Bottom-right Duration Pill */}
                          <div className="absolute bottom-1.5 right-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-xs flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-pink-300" />
                              <span>~{service.duration_mins}m</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Body - Photo 2 Meesho Layout */}
                        <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#1F121C] leading-snug line-clamp-2 group-hover:text-pink-600 transition-colors">
                              {service.title}
                            </h4>

                            {/* Price Row: Current Price | Strike Price | Discount % */}
                            <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-sm sm:text-base font-black text-[#1F121C]">
                                ₹{service.startingPrice}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                                ₹{originalPrice}
                              </span>
                              <span className="text-[10px] font-extrabold text-emerald-600">
                                {discountPercent}% off
                              </span>
                            </div>

                            {/* Special UPI Offer */}
                            <p className="text-[10px] text-pink-700 font-bold mt-0.5">
                              ₹{service.startingPrice - 20} with UPI Instant
                            </p>

                            {/* Green Location Discount Pill (Photo 2 Reference) */}
                            <div className="mt-1.5 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-md text-[9px] sm:text-[10px] font-bold text-emerald-800 flex items-center gap-1 truncate">
                              <Tag className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span className="truncate">₹20 off for {areaName}</span>
                            </div>

                            {/* Rating & Social Proof Row */}
                            <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                              <span className="bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 text-[9px]">
                                <span>4.8</span>
                                <Star className="w-2.5 h-2.5 fill-current" />
                              </span>
                              <span className="text-slate-400 text-[9px] truncate">
                                (14,280)
                              </span>
                              <span className="text-amber-700 font-bold text-[9px] hidden sm:inline truncate">
                                🔥 1.2k+ booked
                              </span>
                            </div>
                          </div>

                          {/* Book Now Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!activeCityZone) {
                                setIsLocationModalOpen(true);
                                return;
                              }
                              setBookingService(service);
                            }}
                            className="w-full mt-2.5 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 active:scale-95 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Book in 15m</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assurance Footer Strip */}
            <div className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#705869] shadow-[0_4px_20px_-2px_rgba(219,39,119,0.04)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 border border-pink-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#1F121C]">{t.quickServeGuarantee}</p>
                  <p className="text-[11px] text-[#705869]">{t.freeCancellation}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-[#1F121C]">
                <span className="flex items-center gap-1 text-pink-700">✓ {t.noAdvance}</span>
                <span className="flex items-center gap-1 text-pink-700">✓ {t.payAfterWork}</span>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: MY ORDERS VIEW */}
        {activeTab === 'orders' && (
          <CleanOrdersView
            bookings={bookings}
            customerPhone={currentUser.phone}
            onRefresh={onRefreshBookings}
            onNavigateHome={() => setActiveTab('home')}
          />
        )}

        {/* VIEW 3: PROFILE & SUPPORT VIEW */}
        {activeTab === 'profile' && (
          <CleanProfileView
            currentUser={currentUser}
            activeCityZone={activeCityZone}
            onLogout={onLogout}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onSwitchToPartnerPortal={() => onSwitchToPartnerPortal(false)}
            onOpenAdminDesk={() => onSwitchToPartnerPortal(true)}
          />
        )}

      </main>

      {/* Responsive Bottom Navigation Bar for Mobile - Fixed 54px flush against 3-button bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 px-1 h-[54px] flex items-center justify-around sm:hidden shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => { setActiveTab('home'); setSelectedCategoryKey('all'); setSearchQuery(''); }}
          className={`flex-1 flex flex-col items-center justify-center h-full py-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home' && selectedCategoryKey === 'all'
              ? 'text-pink-600 font-bold bg-pink-50/70'
              : 'text-[#705869] hover:text-pink-600 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' && selectedCategoryKey === 'all' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none">{lang === 'hi' ? 'होम' : 'Home'}</span>
        </button>

        {/* Tab 2: Categories */}
        <button
          type="button"
          onClick={() => { setActiveTab('home'); setSelectedCategoryKey('cleaning'); }}
          className={`flex-1 flex flex-col items-center justify-center h-full py-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home' && selectedCategoryKey !== 'all'
              ? 'text-pink-600 font-bold bg-pink-50/70'
              : 'text-[#705869] hover:text-pink-600 font-medium'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-none">{lang === 'hi' ? 'कैटेगरी' : 'Categories'}</span>
        </button>

        {/* Tab 3: Partner Hub */}
        <button
          type="button"
          onClick={() => onSwitchToPartnerPortal(false)}
          className="flex-1 flex flex-col items-center justify-center h-full py-0.5 rounded-xl text-[#705869] hover:text-pink-600 font-medium transition-all cursor-pointer"
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 leading-none">Partner</span>
        </button>

        {/* Tab 4: My Orders */}
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex flex-col items-center justify-center h-full py-0.5 rounded-xl relative transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'text-pink-600 font-bold bg-pink-50/70'
              : 'text-[#705869] hover:text-pink-600 font-medium'
          }`}
        >
          <div className="relative">
            <Package className={`w-5 h-5 ${activeTab === 'orders' ? 'stroke-[2.5]' : ''}`} />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 leading-none">{t.myOrders}</span>
        </button>

        {/* Tab 5: Profile */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex flex-col items-center justify-center h-full py-0.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'text-pink-600 font-bold bg-pink-50/70'
              : 'text-[#705869] hover:text-pink-600 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-none">{t.profile}</span>
        </button>
      </nav>

      {/* Floating Voice Search Mic Button - Photo 2 Meesho Feature */}
      {activeTab === 'home' && (
        <button
          type="button"
          onClick={handleVoiceSearch}
          className={`fixed bottom-16 right-4 sm:hidden z-30 w-12 h-12 rounded-full shadow-lg shadow-pink-900/30 flex items-center justify-center transition-all cursor-pointer active:scale-90 border-2 border-white ${
            isListeningMic
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-gradient-to-br from-purple-700 via-pink-600 to-rose-600 text-white'
          }`}
          title="Voice Search Domestic Services"
        >
          <Mic className={`w-5 h-5 ${isListeningMic ? 'animate-bounce' : ''}`} />
        </button>
      )}

      {/* Location Modal */}
      <CleanLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentZone={activeCityZone}
        onSelectZone={(zone, fullAddress) => {
          onSelectZone(zone, fullAddress);
        }}
      />

      {/* Booking Modal */}
      {bookingService && (
        <CleanBookingModal
          service={bookingService}
          currentUser={currentUser}
          activeCityZone={activeCityZone}
          onClose={() => setBookingService(null)}
          onSuccess={handleBookingPlaced}
          onOpenLocationModal={() => {
            setBookingService(null);
            setIsLocationModalOpen(true);
          }}
        />
      )}

      {/* Feature 4: Live Map Tracking Modal */}
      {selectedTrackingOrder && (
        <LiveTrackingModal
          booking={selectedTrackingOrder}
          onClose={() => setSelectedTrackingOrder(null)}
        />
      )}

    </div>
  );
};

