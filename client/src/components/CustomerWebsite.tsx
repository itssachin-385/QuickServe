import React, { useState, useEffect } from 'react';
import { 
  Search,
  X,
  MapPin, 
  Clock, 
  ArrowRight, 
  Check, 
  Trash2, 
  Timer, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  UserCheck, 
  User,
  ShieldCheck,
  Plus,
  Download,
  Sparkles,
  Zap,
  Wrench,
  HeartHandshake,
  Calendar,
  MessageCircle,
  Star,
  ShoppingCart,
  Tag
} from 'lucide-react';

import { ServiceCategory, Professional, Booking, StackedChore, CustomerUser } from '../types';
import { professionalHomeServices, HomeServiceCard } from '../data/homeServices';
import { createBooking, toggleChoreCompletion, extendBookingTime } from '../api';
import { RazorpayModal } from './RazorpayModal';
import { ServiceScopeModal } from './ServiceScopeModal';
import { notificationService } from '../services/notificationService';
import { openWhatsAppBookingShare } from '../utils/whatsapp';
import { NotificationToastBanner } from './NotificationToastBanner';

interface CustomerWebsiteProps {
  categories: ServiceCategory[];
  onSelectCategory: (cat: ServiceCategory) => void;
  onNavigateToApp: () => void;
  onNavigateToProRegister: () => void;
  onNavigateToProApp?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToSimulator?: () => void;
  lang: 'en' | 'hi';
  featuredPros: Professional[];
  currentUser?: CustomerUser | null;
  onOpenAuth: () => void;
  activeBookings: Booking[];
  onRefreshBookings: () => void;
  activeCityZone: string;
  onOpenLocationModal?: () => void;
  onLogout?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onRegisterCartSync?: (count: number, openCartFn: () => void) => void;
}

// Flipkart-style Category Icon Bar Items
const FLIPKART_CATEGORIES = [
  { id: 'all', label: 'For You', icon: '⭐', sublabel: 'Trending' },
  { id: 'cleaning', label: 'Cleaning & Maids', icon: '🧹', sublabel: 'From ₹199' },
  { id: 'plumbing', label: 'Plumbing', icon: '🔧', sublabel: 'From ₹149' },
  { id: 'electrician', label: 'Electrician', icon: '⚡', sublabel: 'From ₹149' },
  { id: 'appliances', label: 'Appliances', icon: '❄️', sublabel: 'From ₹249' },
  { id: 'kitchen', label: 'Kitchen & Cook', icon: '🍳', sublabel: 'From ₹199' },
  { id: 'sofa', label: 'Sofa & Carpet', icon: '🛋️', sublabel: 'From ₹349' },
  { id: 'deepclean', label: 'Deep Cleaning', icon: '✨', sublabel: 'From ₹499' },
  { id: 'moving', label: 'Moving Help', icon: '📦', sublabel: 'From ₹399' },
  { id: 'verified', label: 'Verified Staff', icon: '🛡️', sublabel: '100% Aadhaar' }
];

// Flipkart-style Hero Promotional Carousel Banners
const HERO_BANNERS = [
  {
    id: 'b1',
    tag: 'THE 15-MINUTE GUARANTEE • FESTIVAL SPECIAL',
    title: 'Top Deals on Domestic Chores',
    subtitle: 'Flat ₹99 Off on 3+ Chores • 100% Aadhaar Verified Staff • Pay After Work',
    gradient: 'from-blue-700 via-indigo-800 to-slate-900',
    badgeBg: 'bg-yellow-400 text-slate-950',
    offerPill: 'Starts @ ₹149',
    paymentBadges: ['BHIM UPI', 'Google Pay', 'PhonePe', 'Paytm'],
    ctaText: 'Explore Chores Now →',
    image: '/images/quickserve_society_poster.jpg',
    categoryTarget: 'all'
  },
  {
    id: 'b2',
    tag: '100% POLICE & BIOMETRIC VERIFIED',
    title: 'Trusted & Background-Checked Helpers',
    subtitle: 'Trained domestic helpers, maids & cooks. Safe for families, children & elderly.',
    gradient: 'from-emerald-700 via-teal-800 to-slate-950',
    badgeBg: 'bg-emerald-300 text-slate-950',
    offerPill: 'Biometric Verified',
    paymentBadges: ['Aadhaar Checked', 'Police Clearance', 'Live GPS Tracking'],
    ctaText: 'View Verified Helpers →',
    image: '/images/sweeping_mopping_3d.jpg',
    categoryTarget: 'cleaning'
  },
  {
    id: 'b3',
    tag: 'EMERGENCY REPAIR & MAINTENANCE • 15 MINS',
    title: 'Plumber & Electrician in 15 Minutes',
    subtitle: 'Tap leaks, MCB tripping, fan repair & switchboard fix • 30-Day service warranty.',
    gradient: 'from-amber-600 via-orange-700 to-rose-950',
    badgeBg: 'bg-amber-300 text-slate-950',
    offerPill: 'Flat Rate ₹149',
    paymentBadges: ['Zero Advance', '30-Day Warranty', 'Verified Techs'],
    ctaText: 'Book Instant Repair →',
    image: '/images/washing_machine_3d.jpg',
    categoryTarget: 'repairs'
  }
];

export const CustomerWebsite: React.FC<CustomerWebsiteProps> = ({
  categories,
  onSelectCategory,
  onNavigateToApp,
  onNavigateToProRegister,
  onNavigateToProApp,
  onNavigateToAdmin,
  onNavigateToSimulator,
  lang,
  featuredPros,
  currentUser,
  onOpenAuth,
  activeBookings,
  onRefreshBookings,
  activeCityZone,
  onOpenLocationModal,
  onLogout,
  searchQuery,
  onSearchChange,
  onRegisterCartSync
}) => {
  // Search state
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const activeSearchQuery = searchQuery !== undefined ? searchQuery : internalSearchQuery;
  const handleSearchChange = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setInternalSearchQuery(val);
  };

  // Flipkart Category Active Tab
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');

  // Hero Banner Slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isSlidePaused]);

  // Web Cart & Chore Stacking State - STARTS COMPLETELY EMPTY
  const [stackedChores, setStackedChores] = useState<StackedChore[]>([]);

  // Synchronize cart with parent navbar
  useEffect(() => {
    if (onRegisterCartSync) {
      onRegisterCartSync(stackedChores.length, () => setIsCartOpen(true));
    }
  }, [stackedChores, onRegisterCartSync]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<'instant' | 'scheduled' | 'recurring'>('instant');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('04:00 PM - 05:00 PM');
  const [scheduledSlot, setScheduledSlot] = useState('Today (02 Oct), 04:00 PM - 05:00 PM');

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    const fullLabel = `${dayName} (${formattedDate})`;
    return { index: i, dayName, formattedDate, fullLabel };
  });

  const timeSlots = [
    { id: 't1', time: '07:30 AM - 08:30 AM', period: 'Morning ☀️' },
    { id: 't2', time: '09:00 AM - 10:00 AM', period: 'Morning ☀️' },
    { id: 't3', time: '10:30 AM - 11:30 AM', period: 'Morning ☀️' },
    { id: 't4', time: '12:00 PM - 01:00 PM', period: 'Morning ☀️' },
    { id: 't5', time: '02:00 PM - 03:00 PM', period: 'Afternoon 🌤️' },
    { id: 't6', time: '04:00 PM - 05:00 PM', period: 'Afternoon 🌤️' },
    { id: 't7', time: '05:30 PM - 06:30 PM', period: 'Evening 🌙' },
    { id: 't8', time: '07:00 PM - 08:00 PM', period: 'Evening 🌙' },
    { id: 't9', time: '08:30 PM - 09:30 PM', period: 'Evening 🌙' },
  ];
  const [isVerifiedRecording, setIsVerifiedRecording] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [customAddress, setCustomAddress] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState<Booking | null>(null);
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeScopeService, setActiveScopeService] = useState<HomeServiceCard | null>(null);

  // Active Ongoing Booking (Only if real logged in user has an active order)
  const ongoingBooking = currentUser 
    ? activeBookings.find(b => 
        ['confirmed', 'on_the_way', 'started'].includes(b.status) &&
        (b.customer_phone === currentUser.phone || b.customer_name === currentUser.name)
      ) || null
    : null;
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);

  // Live timer for active booking
  useEffect(() => {
    let timer: any;
    if (ongoingBooking && ongoingBooking.status === 'started') {
      const durationSecs = (ongoingBooking.service_duration_mins || 60) * 60;
      const startedAt = ongoingBooking.service_started_at ? new Date(ongoingBooking.service_started_at).getTime() : Date.now();

      const updateTimer = () => {
        const elapsedSecs = Math.floor((Date.now() - startedAt) / 1000);
        const rem = Math.max(durationSecs - elapsedSecs, 0);
        setRemainingSeconds(rem);
      };

      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(timer);
  }, [ongoingBooking]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pricing calculations
  const rawStackPrice = stackedChores.reduce((sum, c) => sum + (c.price || 0), 0);
  const stackDiscount = stackedChores.length >= 3 ? 99 : 0;
  const discountedChoresPrice = Math.max(rawStackPrice - stackDiscount, 0);
  const platformFee = Math.round(discountedChoresPrice * 0.10);
  const finalPayable = discountedChoresPrice + platformFee;
  const totalDurationMins = stackedChores.reduce((sum, c) => sum + (c.duration_mins || 30), 0);

  // Filter chores based on category tab and search query
  const filteredServices = professionalHomeServices.filter(item => {
    const matchesSearch = !activeSearchQuery || 
      item.title.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
      item.tagline.toLowerCase().includes(activeSearchQuery.toLowerCase());

    let matchesTab = true;
    if (activeCategoryTab === 'all') matchesTab = true;
    else if (activeCategoryTab === 'cleaning') matchesTab = item.filterGroup === 'cleaning' || item.categorySlug === 'maid-helper';
    else if (activeCategoryTab === 'plumbing') matchesTab = item.categorySlug === 'plumber' || /plumb|tap|pipe|leak|drain|water|flush/i.test(item.title + ' ' + item.tagline);
    else if (activeCategoryTab === 'electrician') matchesTab = item.categorySlug === 'electrician' || /electr|fan|switch|light|wire|mcb|socket/i.test(item.title + ' ' + item.tagline);
    else if (activeCategoryTab === 'appliances') matchesTab = /appliance|machine|ac|refrigerator|microwave|cooler|geyser/i.test(item.title + ' ' + item.tagline);
    else if (activeCategoryTab === 'kitchen') matchesTab = item.filterGroup === 'kitchen' || /kitchen|cook|meal|utensil|dish/i.test(item.title + ' ' + item.tagline);
    else if (activeCategoryTab === 'sofa') matchesTab = /sofa|carpet|curtain|cushion|mattress/i.test(item.title + ' ' + item.tagline) || item.id === 's-hourly';
    else if (activeCategoryTab === 'deepclean') matchesTab = /deep|bathroom|toilet|sanitize|scrub/i.test(item.title + ' ' + item.tagline);
    else if (activeCategoryTab === 'moving') matchesTab = /hourly|helper|move|lift|heavy/i.test(item.title + ' ' + item.tagline);

    return matchesSearch && matchesTab;
  });

  // Toggle chore in stack
  const toggleChoreInStack = (card: HomeServiceCard) => {
    setStackedChores(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, {
          id: card.id,
          title: card.title,
          title_hi: card.title_hi,
          price: card.startingPrice,
          duration_mins: card.duration_mins,
          image: card.image,
          is_completed: false
        }];
      }
    });
  };

  const removeChore = (choreId: string) => {
    setStackedChores(prev => prev.filter(c => c.id !== choreId));
  };

  // Add chore directly
  const addChoreDirect = (chore: { id: string; title: string; price: number; duration_mins: number; image: string }) => {
    setStackedChores(prev => {
      const exists = prev.find(c => c.id === chore.id);
      if (!exists) {
        return [...prev, {
          id: chore.id,
          title: chore.title,
          title_hi: chore.title,
          price: chore.price,
          duration_mins: chore.duration_mins,
          image: chore.image,
          is_completed: false
        }];
      }
      return prev;
    });
    setIsCartOpen(true);
  };

  // Direct Booking Action
  const handleConfirmWebBooking = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (stackedChores.length === 0) {
      alert('Please select at least 1 service to book.');
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const primaryChore = stackedChores[0];
      const matchedCat = categories.find(c => c.id === 'cat-maid') || categories[0];
      const pro = featuredPros.find(p => p.verification_state === 'verified') || featuredPros[0];

      const savedUserAddr = localStorage.getItem('quickserve_user_address');
      let chosenAddress = savedUserAddr || customAddress;
      if (currentUser?.saved_addresses && currentUser.saved_addresses[selectedAddressIndex]) {
        const addr = currentUser.saved_addresses[selectedAddressIndex];
        chosenAddress = addr.address_line || `${addr.flat || ''} ${addr.area || ''}, ${addr.city || ''}`;
      } else if (!chosenAddress) {
        chosenAddress = activeCityZone;
      }

      const res = await createBooking({
        service_id: matchedCat?.id || 'cat-maid',
        sub_service_id: primaryChore.id,
        professional_id: pro?.id,
        customer_name: currentUser.name,
        customer_phone: currentUser.phone,
        customer_address: chosenAddress,
        customer_locality: activeCityZone.split(',')[0] || 'Greater Noida',
        customer_notes: `Mode: ${bookingMode} • ${stackedChores.length} Chores`,
        booking_mode: bookingMode,
        scheduled_at: bookingMode === 'scheduled' ? scheduledSlot : null,
        payment_method: 'pay_after_work',
        payment_status: 'pending',
        stacked_chores: stackedChores,
        is_verified_recording: isVerifiedRecording,
        wallet_applied: 0,
        total_amount: finalPayable
      });

      if (res && res.booking) {
        setShowOrderSuccessModal(res.booking);
        setStackedChores([]);
        setIsCartOpen(false);
        onRefreshBookings();

        // Instant Notification (Feature 2)
        notificationService.notifyBookingConfirmed({
          id: res.booking.id,
          bookingReference: res.booking.booking_reference,
          serviceTitle: res.booking.service_title || res.booking.sub_service_selected,
          partnerName: res.booking.professional_name,
          startOtp: res.booking.service_start_otp,
          amount: res.booking.total_amount,
          paymentMethod: res.booking.payment_method,
        });
      }
    } catch (err: any) {
      console.error('Booking failed:', err);
      alert('Booking could not be completed. Please try again.');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#04b565] selection:text-white pb-32">

      {/* ========================================================================= */}
      {/* 1. SLIM ACTIVE ORDER BANNER (ONLY IF LOGGED IN USER HAS ACTIVE SERVICE) */}
      {/* ========================================================================= */}
      {ongoingBooking && (
        <div className="bg-slate-950 text-white px-4 py-2.5 text-xs sticky top-0 z-50 border-b border-emerald-500/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">
                Active Order: {ongoingBooking.professional_name || 'Assigned Partner'}
              </span>
              <span className="text-slate-400">({ongoingBooking.locality || activeCityZone})</span>
            </div>

            <div className="flex items-center gap-3">
              {ongoingBooking.status === 'started' && (
                <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {formatTimer(remainingSeconds)}
                </span>
              )}
              <button
                onClick={onNavigateToApp}
                className="font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                Track Live →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MINIMAL CLEAN HEADER (MOBILE ONLY, DESKTOP USES MAIN NAVBAR) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. FLIPKART-STYLE MOBILE HEADER (STICKY ON MOBILE SCREENS) */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        {/* Top Strip: Brand & Location & Cart */}
        <div className="px-3.5 py-2 flex items-center justify-between gap-2 border-b border-slate-100">
          {/* Brand & 15-Min Delivery */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#ffe500] text-slate-900 font-extrabold text-[11px] shadow-2xs"
            >
              <Zap className="w-3 h-3 text-blue-600 fill-blue-600" />
              <span>QuickServe</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToApp}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]"
            >
              <Clock className="w-2.5 h-2.5 text-emerald-600" />
              <span>15m</span>
            </button>
          </div>

          {/* Right: Location & Cart */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/60 max-w-[130px]"
            >
              <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">{activeCityZone ? activeCityZone.split(',')[0] : 'Location'}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {stackedChores.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                  {stackedChores.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Flipkart Style) */}
        <div className="px-3.5 py-2">
          <div className="relative flex items-center bg-blue-50/40 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-blue-600 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={activeSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for Products, Brands and More (Maid, Plumber, AC...)"
              className="w-full pl-9 pr-8 py-2 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
            />
            {activeSearchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 p-0.5 rounded-full hover:bg-slate-200 text-slate-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. FLIPKART-STYLE CATEGORY ICON STRIP */}
      {/* ========================================================================= */}
      <section className="bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5">
          <div className="flex items-center justify-between gap-3 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth">
            {FLIPKART_CATEGORIES.map(cat => {
              const isActive = activeCategoryTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryTab(cat.id);
                    if (cat.id === 'verified') {
                      document.getElementById('verified-pros')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col items-center gap-1 flex-shrink-0 group cursor-pointer relative pb-1 pt-0.5 transition-all select-none"
                >
                  {/* Icon Card */}
                  <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-xl sm:text-2xl transition-all shadow-2xs ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 scale-105 ring-2 ring-blue-500/20' 
                      : 'bg-slate-50 group-hover:bg-slate-100 group-hover:scale-105 text-slate-700'
                  }`}>
                    <span>{cat.icon}</span>
                  </div>

                  {/* Label */}
                  <div className="text-center min-w-[55px] sm:min-w-[65px]">
                    <span className={`text-[10px] sm:text-[11px] block transition-colors leading-tight ${
                      isActive 
                        ? 'font-black text-blue-600' 
                        : 'font-bold text-slate-700 group-hover:text-slate-900'
                    }`}>
                      {cat.label}
                    </span>
                  </div>

                  {/* Flipkart Blue Active Indicator Underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full animate-in fade-in" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FLIPKART-STYLE HERO PROMOTIONAL BANNER CAROUSEL */}
      {/* ========================================================================= */}
      <section 
        className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6"
        onMouseEnter={() => setIsSlidePaused(true)}
        onMouseLeave={() => setIsSlidePaused(false)}
      >
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200">
          {/* Active Banner Slide */}
          <div className={`relative bg-gradient-to-r ${HERO_BANNERS[currentSlide].gradient} text-white p-6 sm:p-10 min-h-[220px] sm:min-h-[280px] flex items-center justify-between overflow-hidden transition-all duration-500`}>
            
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            {/* Left Content */}
            <div className="relative z-10 max-w-xl space-y-3">
              {/* Highlight Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white font-black text-[10px] tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>{HERO_BANNERS[currentSlide].tag}</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {HERO_BANNERS[currentSlide].title}
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                {HERO_BANNERS[currentSlide].subtitle}
              </p>

              {/* Badges / CTA Button */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const target = HERO_BANNERS[currentSlide].categoryTarget;
                    setActiveCategoryTab(target);
                    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer ${HERO_BANNERS[currentSlide].badgeBg}`}
                >
                  {HERO_BANNERS[currentSlide].ctaText}
                </button>

                {/* Offer pill */}
                <span className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white font-extrabold text-xs">
                  {HERO_BANNERS[currentSlide].offerPill}
                </span>

                {/* Payment Badges (Flipkart Style) */}
                {HERO_BANNERS[currentSlide].paymentBadges && (
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-white/80 bg-black/25 px-2.5 py-1 rounded-lg">
                    <span>Pay with:</span>
                    {HERO_BANNERS[currentSlide].paymentBadges.map((badge, idx) => (
                      <span key={idx} className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-mono">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Hero Image Card (Flipkart Poster Visual) */}
            <div className="hidden md:flex relative z-10 flex-shrink-0 w-64 h-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900/40 backdrop-blur-sm p-2 items-center justify-center">
              <img
                src={HERO_BANNERS[currentSlide].image}
                alt={HERO_BANNERS[currentSlide].title}
                className="w-full h-full object-cover rounded-xl shadow-md"
              />
            </div>
          </div>

          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => setCurrentSlide(prev => (prev === 0 ? HERO_BANNERS.length - 1 : prev - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all z-20 cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => setCurrentSlide(prev => (prev + 1) % HERO_BANNERS.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all z-20 cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Pagination Indicator Dots (Flipkart Style) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {HERO_BANNERS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentSlide === idx 
                    ? 'w-6 h-2 bg-white shadow-xs' 
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FLIPKART-STYLE DEALS & CHORES GRID */}
      {/* ========================================================================= */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
        
        {/* Section Heading (Flipkart Style) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Top Deals on Domestic Chores
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Flat 15-Minute Doorstep Arrival • Aadhaar Verified • Pay After Work via UPI/Cash
            </p>
          </div>

          {/* Active Category Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Showing:</span>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200">
              {FLIPKART_CATEGORIES.find(c => c.id === activeCategoryTab)?.label || 'All Services'} ({filteredServices.length})
            </span>
          </div>
        </div>

        {/* Flipkart-Style Deal & Chore Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
          {filteredServices.map(item => {
            const isSelected = stackedChores.some(c => c.id === item.id);
            // Dynamic Flipkart-style discount pill based on price
            const discountPill = item.startingPrice >= 299 ? 'Min. 30% Off' : item.startingPrice >= 199 ? 'Flat ₹99 Off' : 'From ₹149*';

            return (
              <div
                key={item.id}
                onClick={() => setActiveScopeService(item)}
                className={`bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-2xs hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 relative overflow-hidden ${
                  isSelected
                    ? 'border-[#04b565] ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200/90 hover:border-blue-400'
                }`}
              >
                {/* Top Corner 'AD' or 'POPULAR' Badge (Flipkart Style) */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {item.isPopular ? 'Top Deal' : 'AD'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{item.duration_mins}m</span>
                  </span>
                </div>

                {/* 3D Diorama Image Container */}
                <div className="aspect-square w-full rounded-xl bg-slate-50 group-hover:bg-blue-50/30 flex items-center justify-center p-2 mb-2 relative overflow-hidden transition-colors">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#04b565] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      ✓
                    </span>
                  )}
                  {/* Scope / Details button */}
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-[9px] font-bold text-slate-700 border border-slate-200 shadow-2xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all">
                    Do's & Don'ts ℹ️
                  </span>
                </div>

                {/* Service Details */}
                <div className="space-y-1 mb-2">
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {lang === 'en' ? item.title : item.title_hi}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {item.tagline}
                  </p>
                  
                  {/* Price Row */}
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="font-black text-slate-900 text-base">₹{item.startingPrice}</span>
                    <span className="text-[11px] text-slate-400 line-through">₹{item.startingPrice + 99}</span>
                  </div>
                </div>

                {/* Flipkart Blue Discount Pill at bottom of card */}
                <div className="bg-blue-600 text-white font-extrabold text-[10px] text-center py-1 px-2 rounded-lg mb-2 shadow-2xs tracking-tight">
                  {discountPill}
                </div>

                {/* Tactile + Add / Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChoreInStack(item);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-[#04b565] border border-emerald-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                      : 'bg-slate-100 hover:bg-[#04b565] hover:text-white text-slate-800 shadow-2xs'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Added to Stack</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add Chore</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </section>



      {/* ========================================================================= */}
      {/* 6. POLISHED 3-STEP "HOW IT WORKS" */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-100">
        <div className="text-center mb-8 space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">How QuickServe Works</h3>
          <p className="text-xs sm:text-sm text-slate-500">Simple 3-step home service booking with zero advance payment</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center sm:text-left">
          
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2">
            <span className="text-[11px] font-black text-[#04b565] tracking-wider uppercase block">01. SELECT</span>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Choose Services</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Pick any single chore or stack multiple home tasks into one single visit.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2">
            <span className="text-[11px] font-black text-amber-500 tracking-wider uppercase block">02. DISPATCH</span>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Verified Partner Assigned</h4>
            <p className="text-xs text-slate-500 leading-relaxed">A police-verified, background-checked professional is dispatched in minutes.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2">
            <span className="text-[11px] font-black text-blue-600 tracking-wider uppercase block">03. PAY AFTER WORK</span>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Inspect & Settle</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Verify the quality of work first, then pay easily via UPI or Cash on site.</p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. "WHY QUICKSERVE" */}
      {/* ========================================================================= */}
      <section id="why-quickserve" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-100">
        <div className="text-center mb-8 space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">Why QuickServe</h3>
          <p className="text-xs sm:text-sm text-slate-500">Built for speed, safety, and transparent home help</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#04b565] flex items-center justify-center mx-auto sm:mx-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">100% Verified Pros</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Aadhaar verified and background-checked professionals with strict quality checks.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto sm:mx-0 shadow-2xs">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Transparent Pricing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Standard upfront pricing with zero surge fees, hidden charges, or visit surprise costs.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto sm:mx-0 shadow-2xs">
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Pay After Service</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Never pay upfront. Complete work first, inspect result, and settle via UPI or cash.</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MODERN APP DOWNLOAD STRIP */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <img 
                src="/images/quickserve_app_icon.png" 
                alt="QuickServe App" 
                className="w-10 h-10 rounded-xl object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h4 className="font-black text-sm sm:text-base text-white">QuickServe Android App</h4>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  v2.1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Track partners live with GPS, manage orders, and rebook in seconds.</p>
            </div>
          </div>
          <a
            href="/downloads/QuickServe_v2.apk"
            download="QuickServe_v2.apk"
            className="px-5 py-3 bg-[#04b565] hover:bg-[#039e57] active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download APK (14.6 MB)</span>
          </a>
        </div>
      </section>

      {/* ========================================================================= */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-900 text-sm">QuickServe</span>
          <span>•</span>
          <span>Hyperlocal Home Services</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <a href="#services" className="hover:text-slate-900 transition-colors">
            Services
          </a>
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
            How It Works
          </a>
          <a href="#why-quickserve" className="hover:text-slate-900 transition-colors">
            Why QuickServe
          </a>
          <button onClick={onNavigateToProRegister} className="hover:text-slate-900 transition-colors cursor-pointer">
            Partner Onboarding
          </button>
        </div>

        <span>© 2026 QuickServe Technologies</span>
      </footer>

      {/* ========================================================================= */}
      {/* 8. FLOATING CART BAR (ONLY APPEARS WHEN USER ADDS A CHORE) */}
      {/* ========================================================================= */}
      {stackedChores.length > 0 && (
        <div className="fixed cart-floating-pos left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-in slide-in-from-bottom">
          <div className="bg-slate-950 text-white rounded-2xl p-3 shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-extrabold text-xs block text-white">
                {stackedChores.length} {stackedChores.length === 1 ? 'Service' : 'Services'} Selected
              </span>
              <p className="text-[11px] text-slate-400">
                Total: <strong className="text-emerald-400">₹{finalPayable}</strong> • ~{totalDurationMins}m
              </p>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-[#04b565] hover:bg-[#039e57] text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SLIDE-OVER CHECKOUT DRAWER */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Checkout</h3>
                <p className="text-[11px] text-slate-500">{activeCityZone}</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              <div className="space-y-2">
                {stackedChores.map(chore => (
                  <div key={chore.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block truncate">{chore.title}</span>
                      <span className="text-[10px] text-slate-400">{chore.duration_mins} mins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">₹{chore.price}</span>
                      <button 
                        onClick={() => removeChore(chore.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setBookingMode('instant')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bookingMode === 'instant'
                      ? 'border-[#04b565] bg-emerald-50 text-[#04b565] shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ⚡ 15-Min Arrival
                </button>
                <button
                  onClick={() => {
                    setBookingMode('scheduled');
                    setScheduledSlot(`${availableDates[selectedDateIndex]?.fullLabel}, ${selectedTimeSlot}`);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bookingMode === 'scheduled'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  📅 Schedule Slot
                </button>
              </div>

              {/* SCHEDULED DATE & TIME SLOT PICKER */}
              {bookingMode === 'scheduled' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-emerald-500/40 space-y-3 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>1. Select Date:</span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {availableDates[selectedDateIndex]?.dayName}
                    </span>
                  </div>

                  {/* 7-Day Date Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {availableDates.map((item) => {
                      const isSelected = selectedDateIndex === item.index;
                      return (
                        <button
                          key={item.index}
                          type="button"
                          onClick={() => {
                            setSelectedDateIndex(item.index);
                            setScheduledSlot(`${item.fullLabel}, ${selectedTimeSlot}`);
                          }}
                          className={`flex-shrink-0 px-3 py-2 rounded-xl text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white font-bold shadow-md scale-102 ring-2 ring-emerald-500'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-[10px] uppercase font-bold tracking-wider opacity-80">
                            {item.dayName}
                          </span>
                          <span className="block text-xs font-black mt-0.5">
                            {item.formattedDate}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slot Header */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>2. Select Time:</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">1-Hour Arrival Slot</span>
                  </div>

                  {/* Time Slots Grid */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                    {timeSlots.map((slot) => {
                      const isSelected = selectedTimeSlot === slot.time;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setSelectedTimeSlot(slot.time);
                            setScheduledSlot(`${availableDates[selectedDateIndex]?.fullLabel}, ${slot.time}`);
                          }}
                          className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="block text-[9px] text-slate-400 font-medium">
                              {slot.period}
                            </span>
                            <span className="text-[11px] font-bold block leading-snug">
                              {slot.time}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Slot Confirmation Badge */}
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 stroke-[3]" />
                    <span>
                      <strong>Slot Confirmed:</strong> {availableDates[selectedDateIndex]?.fullLabel}, {selectedTimeSlot}
                    </span>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">₹{rawStackPrice}</span>
                </div>
                {stackDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>3+ Chores Discount:</span>
                    <span>-₹{stackDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee (10%):</span>
                  <span className="font-bold text-slate-800">₹{platformFee}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                  <span>Total Payable:</span>
                  <span className="text-[#04b565]">₹{finalPayable}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total</span>
                <span className="text-base font-black text-slate-900">₹{finalPayable}</span>
              </div>

              {!currentUser ? (
                <button
                  onClick={onOpenAuth}
                  className="px-5 py-2.5 bg-[#04b565] hover:bg-[#039e57] text-white font-bold text-xs rounded-xl"
                >
                  Log In to Confirm
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    disabled={isBookingSubmitting}
                    onClick={() => setShowPaymentGatewayModal(true)}
                    className="px-4 py-2.5 bg-[#04b565] hover:bg-[#039e57] text-white font-bold text-xs rounded-xl"
                  >
                    Pay with UPI
                  </button>
                  <button
                    disabled={isBookingSubmitting}
                    onClick={handleConfirmWebBooking}
                    className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
                  >
                    {isBookingSubmitting ? '...' : 'Pay Later'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. PAYMENT / CONFIRMATION MODALS */}
      {/* ========================================================================= */}
      {showPaymentGatewayModal && (
        <RazorpayModal
          amount={finalPayable}
          serviceTitle={`${stackedChores.length} Services (${stackedChores.map(c => c.title).slice(0, 2).join(', ')})`}
          customerName={currentUser?.name || 'Customer'}
          customerPhone={currentUser?.phone || ''}
          onClose={() => setShowPaymentGatewayModal(false)}
          onSuccess={(_paymentId) => {
            setShowPaymentGatewayModal(false);
            handleConfirmWebBooking();
          }}
        />
      )}

      {showOrderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#04b565] flex items-center justify-center text-2xl mx-auto">
              🎉
            </div>
            <h3 className="text-lg font-black text-slate-900">Booking Confirmed!</h3>
            <p className="text-xs text-slate-500">
              Partner is arriving in ~15 minutes at {activeCityZone.split(',')[0]}.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] text-slate-400 block font-bold">Start OTP</span>
              <span className="text-base font-mono font-black text-[#04b565]">
                {showOrderSuccessModal.service_start_otp || '4821'}
              </span>
            </div>

            {/* WhatsApp Confirmation & Share Button (Feature 1) */}
            <button
              onClick={() => openWhatsAppBookingShare(showOrderSuccessModal, currentUser?.phone)}
              className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1caa52] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>📲 Get / Share on WhatsApp</span>
            </button>

            <button
              onClick={() => {
                setShowOrderSuccessModal(null);
                onNavigateToApp();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Track Live in App →
            </button>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      {isProfileModalOpen && currentUser && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">My Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-black text-slate-900 text-sm block">{currentUser.name}</span>
              <span className="text-slate-500 font-mono">{currentUser.phone}</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
              <span className="font-bold text-slate-700">Wallet Balance:</span>
              <span className="font-black text-emerald-700">₹{currentUser.wallet_balance || 0}</span>
            </div>

            <button
              onClick={() => {
                setIsProfileModalOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full py-2 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-100 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Service Scope Modal (Do's & Don'ts) */}
      <ServiceScopeModal
        service={activeScopeService}
        isOpen={!!activeScopeService}
        onClose={() => setActiveScopeService(null)}
        onToggleAdd={(svc) => toggleChoreInStack(svc)}
        onProceed={(svc) => {
          setActiveScopeService(null);
          setIsCartOpen(true);
        }}
        isAdded={!!activeScopeService && stackedChores.some(c => c.id === activeScopeService.id)}
        lang={lang}
      />

      {/* Real-time In-App Notification Toast Banner */}
      <NotificationToastBanner
        onOpenTracking={onNavigateToApp}
        customerPhone={currentUser?.phone}
      />

    </div>
  );
};
