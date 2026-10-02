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
  CreditCard, 
  ChevronDown, 
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
  MessageCircle
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
}

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
  onLogout
}) => {

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cleaning' | 'kitchen' | 'repairs'>('all');

  // Web Cart & Chore Stacking State - STARTS COMPLETELY EMPTY (NO DEFAULT DATA)
  const [stackedChores, setStackedChores] = useState<StackedChore[]>([]);

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

  // Filter chores based on category tabs and search
  const filteredServices = professionalHomeServices.filter(item => {
    const matchesFilter = selectedFilter === 'all' || item.filterGroup === selectedFilter;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
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
        customer_locality: activeCityZone.split(',')[0] || 'Indiranagar',
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
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Locality */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img 
                src="/images/quickserve_app_icon.png" 
                alt="QuickServe" 
                className="w-8 h-8 rounded-xl object-contain" 
              />
              <span className="text-xl font-black tracking-tight text-[#04b565]">
                Quick<span className="text-[#364854]">Serve</span>
              </span>
            </div>

            {/* Location Pill */}
            <button
              onClick={onOpenLocationModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-bold text-slate-800 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#04b565]" />
              <span className="max-w-[120px] truncate">{activeCityZone.split(',')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Quick Nav / Auth */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden md:inline-block text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Services
            </button>

            {currentUser ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-800"
              >
                <div className="w-6 h-6 rounded-full bg-[#04b565] text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[80px] truncate">{currentUser.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-[#04b565] hover:bg-[#039e57] text-white font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO (CLEAN, DIRECT, BLINKIT/URBAN COMPANY STYLE) */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-slate-50 to-white pt-8 pb-6 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Reliable Help in Minutes.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
            Book verified house cleaners, electricians, plumbers & caretakers at transparent rates.
          </p>

          {/* Minimal Search Bar */}
          <div className="max-w-lg mx-auto relative pt-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 'Sweeping', 'Fan repair', 'Tap fix'..."
              className="w-full pl-10 pr-8 py-2.5 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#04b565] shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 4 Launch Categories (Quick 1-Tap Filter / Booking Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 text-left">
            
            {/* Maid */}
            <div 
              onClick={() => {
                setSelectedFilter('cleaning');
                const svc = professionalHomeServices.find(s => s.id === 's-hourly');
                if (svc) setActiveScopeService(svc);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 group hover:shadow-xs ${
                selectedFilter === 'cleaning'
                  ? 'border-[#04b565] bg-emerald-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                🧹
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-900 block truncate group-hover:text-emerald-700 transition-colors">House Maid</span>
                <span className="text-[10px] text-emerald-700 font-bold">Scope & Rates →</span>
              </div>
            </div>

            {/* Electrician */}
            <div 
              onClick={() => {
                setSelectedFilter('repairs');
                const svc = professionalHomeServices.find(s => s.id === 's-fan');
                if (svc) setActiveScopeService(svc);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 group hover:shadow-xs ${
                selectedFilter === 'repairs'
                  ? 'border-[#04b565] bg-emerald-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-900 block truncate group-hover:text-amber-700 transition-colors">Electrician</span>
                <span className="text-[10px] text-amber-700 font-bold">Scope & Rates →</span>
              </div>
            </div>

            {/* Plumber */}
            <div 
              onClick={() => {
                setSelectedFilter('repairs');
                const svc = professionalHomeServices.find(s => s.id === 's-plumbing-tap');
                if (svc) setActiveScopeService(svc);
              }}
              className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all cursor-pointer flex items-center gap-2.5 group hover:shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                🔧
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-900 block truncate group-hover:text-blue-700 transition-colors">Plumber</span>
                <span className="text-[10px] text-blue-700 font-bold">Scope & Rates →</span>
              </div>
            </div>

            {/* Caretaker */}
            <div 
              onClick={() => {
                const svc = professionalHomeServices.find(s => s.id === 's-hourly');
                if (svc) setActiveScopeService(svc);
              }}
              className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all cursor-pointer flex items-center gap-2.5 group hover:shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                🤝
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-900 block truncate group-hover:text-rose-700 transition-colors">Caretaker</span>
                <span className="text-[10px] text-rose-700 font-bold">Scope & Rates →</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CHORES GRID (SIMPLE, CLEAN, WITH REAL "+ ADD" BUTTONS) */}
      {/* ========================================================================= */}
      <section id="services" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Services' },
              { id: 'cleaning', label: 'Cleaning & Maid' },
              { id: 'kitchen', label: 'Kitchen & Cooking' },
              { id: 'repairs', label: 'Repairs & Electrician' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {filteredServices.length} options available • Tap card for Do's & Don'ts
          </span>
        </div>

        {/* Clean Chores Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredServices.map(item => {
            const isSelected = stackedChores.some(c => c.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => setActiveScopeService(item)}
                className={`bg-white rounded-2xl p-3 border transition-all flex flex-col justify-between cursor-pointer group hover:shadow-md hover:border-emerald-300 ${
                  isSelected
                    ? 'border-[#04b565] ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200'
                }`}
              >
                {/* 3D Image */}
                <div className="aspect-square w-full rounded-xl bg-slate-50 flex items-center justify-center p-2 mb-2 relative overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#04b565] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                      ✓
                    </span>
                  )}
                  {/* Subtle Scope Badge */}
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-[9px] font-bold text-emerald-800 border border-emerald-200/60 shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    Do's & Don'ts ℹ️
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {lang === 'en' ? item.title : item.title_hi}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    ₹{item.startingPrice} <span className="text-slate-300">•</span> {item.duration_mins}m
                  </p>
                </div>

                {/* Clean + Add / Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChoreInStack(item);
                  }}
                  className={`mt-3 w-full py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-50 text-[#04b565] border border-emerald-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                      : 'bg-slate-100 hover:bg-[#04b565] hover:text-white text-slate-800'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </section>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 5. MINIMAL 3-STEP "HOW IT WORKS" */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100">
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-slate-900">How QuickServe Works</h3>
          <p className="text-xs text-slate-500 mt-0.5">Simple 3-step home service booking</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center sm:text-left">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="text-xs font-black text-[#04b565]">01. SELECT</span>
            <h4 className="font-extrabold text-slate-900 text-sm">Choose Services</h4>
            <p className="text-xs text-slate-500">Pick any individual chore or stack multiple services in one visit.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="text-xs font-black text-[#f9ba17]">02. DISPATCH</span>
            <h4 className="font-extrabold text-slate-900 text-sm">Verified Pro Assigned</h4>
            <p className="text-xs text-slate-500">Background-verified professional dispatched promptly to your doorstep.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="text-xs font-black text-blue-600">03. CASHLESS</span>
            <h4 className="font-extrabold text-slate-900 text-sm">Pay After Work</h4>
            <p className="text-xs text-slate-500">Inspect the work and settle easily via UPI, Card, or Cash on service.</p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5b. "WHY QUICKSERVE" */}
      {/* ========================================================================= */}
      <section id="why-quickserve" className="max-w-4xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100">
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-slate-900">Why QuickServe</h3>
          <p className="text-xs text-slate-500 mt-0.5">Built for speed, safety, and transparent home help</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#04b565] flex items-center justify-center mx-auto sm:mx-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">100% Verified Pros</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Police-checked, identity-verified professionals with verified skill ratings.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto sm:mx-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Transparent Pricing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Standard upfront rates with zero surprise charges or surge fees.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto sm:mx-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Pay After Service</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Check the quality first, pay only after you are completely satisfied.</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. MINIMAL APP DOWNLOAD STRIP */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-sm text-white">QuickServe Android App</h4>
            <p className="text-xs text-slate-400">Track professionals live on map and rebook your favorites.</p>
          </div>
          <a
            href="/downloads/QuickServe_v2.apk"
            download="QuickServe_v2.apk"
            className="px-4 py-2 bg-[#04b565] hover:bg-[#039e57] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </a>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. MINIMAL CLEAN FOOTER */}
      {/* ========================================================================= */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900">QuickServe</span>
          <span>•</span>
          <span>Home & Local Services</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
            How It Works
          </a>
          <a href="#why-quickserve" className="hover:text-slate-900 transition-colors">
            Why QuickServe
          </a>
          <button onClick={onNavigateToProRegister} className="hover:text-slate-900 transition-colors">
            Partner Onboarding
          </button>
          {onNavigateToAdmin && (
            <button onClick={onNavigateToAdmin} className="hover:text-slate-900 transition-colors">
              Admin
            </button>
          )}
          {onNavigateToProApp && (
            <button onClick={onNavigateToProApp} className="hover:text-slate-900 transition-colors">
              Pro App
            </button>
          )}
        </div>

        <span>© 2026 QuickServe India</span>
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
                      <span>1. Select Date (तारीख चुनें):</span>
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
                      <span>2. Select Time (समय चुनें):</span>
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
