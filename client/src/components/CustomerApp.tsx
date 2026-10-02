import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Wrench, 
  Zap, 
  Sparkles, 
  HeartHandshake, 
  MapPin, 
  Star, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  AlertTriangle,
  ArrowLeft,
  X,
  CreditCard,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  Plus,
  Minus,
  Trash2,
  Video,
  Timer,
  Repeat,
  Banknote,
  Wallet,
  Smartphone,
  MessageCircle,
  Bell
} from 'lucide-react';
import { ServiceCategory, Professional, Booking, SubService, StackedChore, CustomerUser } from '../types';
import { smartSearch, createBooking, updateBookingStatus, verifyBookingOtp, submitReview, toggleChoreCompletion, extendBookingTime } from '../api';
import { RazorpayModal } from './RazorpayModal';
import { professionalHomeServices, HomeServiceCard } from '../data/homeServices';
import { CustomerProfileScreen } from './CustomerProfileScreen';
import { CustomerBookingsScreen } from './CustomerBookingsScreen';
import { ServiceScopeModal } from './ServiceScopeModal';
import { notificationService, AppNotificationItem } from '../services/notificationService';
import { openWhatsAppBookingShare } from '../utils/whatsapp';
import { NotificationToastBanner } from './NotificationToastBanner';
import { NotificationCenterModal } from './NotificationCenterModal';

interface CustomerAppProps {
  categories: ServiceCategory[];
  professionals: Professional[];
  activeBookings: Booking[];
  onRefreshBookings: () => void;
  lang: 'en' | 'hi';
  currentUser?: CustomerUser | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  activeCityZone?: string;
  onOpenLocationModal?: () => void;
  onNavigateToWebsite?: () => void;
  onUpdateUser?: (updated: CustomerUser) => void;
  onSwitchToPartnerApp?: () => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  categories,
  professionals,
  activeBookings,
  onRefreshBookings,
  lang,
  currentUser,
  onOpenAuth,
  onLogout,
  activeCityZone,
  onOpenLocationModal,
  onNavigateToWebsite,
  onUpdateUser,
  onSwitchToPartnerApp
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'home' | 'bookings' | 'support' | 'profile'>('home');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Filter for 3D diorama cards
  const [selectedFilterGroup, setSelectedFilterGroup] = useState<'all' | 'cleaning' | 'kitchen' | 'repairs'>('all');

  // QuickServe Chore Stacking State (Starts completely empty)
  const [stackedChores, setStackedChores] = useState<StackedChore[]>([]);

  // 3-Mode Booking Selector State
  const [bookingMode, setBookingMode] = useState<'instant' | 'scheduled' | 'recurring'>('instant');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('04:00 PM - 05:00 PM');
  const [scheduledSlot, setScheduledSlot] = useState('Today (02 Oct), 04:00 PM - 05:00 PM');
  const [recurringCadence, setRecurringCadence] = useState<'daily' | 'weekdays' | 'alternate' | 'weekends'>('weekdays');

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

  // QuickServe Verified (Recording Consent Layer)
  const [isVerifiedRecording, setIsVerifiedRecording] = useState(false);
  const [recordingConsentGiven, setRecordingConsentGiven] = useState(false);
  const [activeScopeService, setActiveScopeService] = useState<HomeServiceCard | null>(null);

  // In-Service Countdown Timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);

  // Booking Flow modal states
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedSubService, setSelectedSubService] = useState<SubService | null>(null);
  const [customerAddress, setCustomerAddress] = useState(() => {
    try {
      const savedDetails = localStorage.getItem('quickserve_doorstep_details');
      if (savedDetails) {
        const p = JSON.parse(savedDetails);
        if (p.fullCompleteAddress) return p.fullCompleteAddress;
      }
    } catch (e) {}
    return localStorage.getItem('quickserve_user_address') || (activeCityZone ? `Sector 18, ${activeCityZone}` : 'Sector 18, Noida');
  });
  const [customerLocality, setCustomerLocality] = useState(() => {
    return localStorage.getItem('quickserve_active_zone') || activeCityZone || 'Sector 18, Noida';
  });
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [showAllCategoriesModal, setShowAllCategoriesModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pay_after_work' | 'upi_online' | 'wallet'>('pay_after_work');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<AppNotificationItem[]>(() => notificationService.getHistory());
  const unreadNotificationCount = notificationsList.filter(n => !n.read).length;

  useEffect(() => {
    const unsub = notificationService.subscribeHistory((updated) => {
      setNotificationsList(updated);
    });
    return () => unsub();
  }, []);

  // Sync address if activeCityZone changes
  useEffect(() => {
    if (activeCityZone) {
      setCustomerLocality(activeCityZone);
      try {
        const savedDetails = localStorage.getItem('quickserve_doorstep_details');
        if (savedDetails) {
          const p = JSON.parse(savedDetails);
          if (p.fullCompleteAddress) {
            setCustomerAddress(p.fullCompleteAddress);
            return;
          }
        }
      } catch (e) {}
      const userAddr = localStorage.getItem('quickserve_user_address');
      if (userAddr) setCustomerAddress(userAddr);
    }
  }, [activeCityZone]);

  // Handle Android Hardware Back Button (<) across tabs, modals, and booking flow
  useEffect(() => {
    const handleHardwareBack = (e: Event) => {
      // 1. Close any active modals or overlays
      if (activeScopeService) {
        setActiveScopeService(null);
        e.preventDefault();
        return;
      }
      if (isNotificationModalOpen) {
        setIsNotificationModalOpen(false);
        e.preventDefault();
        return;
      }
      if (showAllCategoriesModal) {
        setShowAllCategoriesModal(false);
        e.preventDefault();
        return;
      }
      if (showPaymentModal) {
        setShowPaymentModal(false);
        e.preventDefault();
        return;
      }
      if (selectedCategory) {
        if (bookingStep > 1) {
          setBookingStep((bookingStep - 1) as any);
        } else {
          setSelectedCategory(null);
        }
        e.preventDefault();
        return;
      }
      if (searchQuery || searchResult) {
        setSearchQuery('');
        setSearchResult(null);
        e.preventDefault();
        return;
      }

      // 2. If user is on Profile, Bookings, or Support tab -> Navigate back to Home tab!
      if (activeTab !== 'home') {
        setActiveTab('home');
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('quickserve:hardwareback', handleHardwareBack);
    return () => {
      window.removeEventListener('quickserve:hardwareback', handleHardwareBack);
    };
  }, [activeScopeService, showAllCategoriesModal, showPaymentModal, selectedCategory, bookingStep, searchQuery, searchResult, activeTab]);

  // Guaranteed open review & booking step
  const openReviewAndBook = () => {
    const maidCat = categories.find(c => c.slug === 'maid-helper' || c.id === 'cat-maid') || categories[0] || {
      id: 'cat-maid',
      name: 'House Help & Chores',
      slug: 'maid-helper',
      description: 'Verified domestic helpers on demand',
      icon: 'Sparkles',
      base_price: 199,
      price_unit: 'visit',
      sla_minutes: 15,
      is_active: true
    };
    setSelectedCategory(maidCat);
    setBookingStep(1);
  };

  const handleProceedFromScopeModal = (svc: HomeServiceCard) => {
    setActiveScopeService(null);
    setStackedChores(prev => {
      const exists = prev.some(c => c.id === svc.id);
      if (!exists) {
        return [...prev, {
          id: svc.id,
          title: svc.title,
          price: svc.startingPrice,
          duration_mins: svc.duration_mins,
          image: svc.image
        }];
      }
      return prev;
    });
    const maidCat = categories.find(c => c.slug === 'maid-helper' || c.id === 'cat-maid') || categories[0] || {
      id: 'cat-maid',
      name: 'House Help & Chores',
      slug: 'maid-helper',
      description: 'Verified domestic helpers on demand',
      icon: 'Sparkles',
      base_price: 199,
      price_unit: 'visit',
      sla_minutes: 15,
      is_active: true
    };
    setSelectedCategory(maidCat);
    setBookingStep(1);
  };

  // Tracking modal / view for an active booking
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isProblemReported, setIsProblemReported] = useState(false);

  // Real-time tracking auto-sync
  useEffect(() => {
    if (activeBookings.length > 0 && !trackingBooking) {
      // Find ongoing booking
      const ongoing = activeBookings.find(b => ['confirmed', 'on_the_way', 'started'].includes(b.status));
      if (ongoing) {
        setTrackingBooking(ongoing);
      }
    }
  }, [activeBookings]);

  // Handle smart search
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 2) {
      setIsSearching(true);
      const res = await smartSearch(val);
      setSearchResult(res);
      setIsSearching(false);
    } else {
      setSearchResult(null);
    }
  };

  const startBookingFlow = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    setSelectedSubService(cat.sub_services?.[0] || null);
    setBookingStep(1);
    // Find default matched verified pro for this category
    const pro = professionals.find(p => p.service_id === cat.id && p.verification_state === 'verified');
    setSelectedPro(pro || professionals[0]);
  };

  // Live in-service countdown timer
  useEffect(() => {
    let timer: any;
    if (trackingBooking && trackingBooking.status === 'started') {
      const durationSecs = (trackingBooking.service_duration_mins || 60) * 60;
      const startedAt = trackingBooking.service_started_at ? new Date(trackingBooking.service_started_at).getTime() : Date.now();

      const updateTimer = () => {
        const elapsedSecs = Math.floor((Date.now() - startedAt) / 1000);
        const rem = Math.max(durationSecs - elapsedSecs, 0);
        setRemainingSeconds(rem);
      };

      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(timer);
  }, [trackingBooking]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleChoreInStack = (item: HomeServiceCard) => {
    const exists = stackedChores.some(c => c.id === item.id);
    if (exists) {
      setStackedChores(prev => prev.filter(c => c.id !== item.id));
    } else {
      setStackedChores(prev => [
        ...prev,
        {
          id: item.id,
          title: item.title,
          title_hi: item.title_hi,
          price: item.startingPrice,
          duration_mins: item.duration_mins,
          image: item.image,
          is_completed: false
        }
      ]);
    }
  };

  const removeChoreFromStack = (choreId: string) => {
    setStackedChores(prev => prev.filter(c => c.id !== choreId));
  };

  const totalStackMinutes = stackedChores.reduce((acc, c) => acc + (c.duration_mins || 30), 0);
  const rawStackPrice = stackedChores.reduce((acc, c) => acc + c.price, 0);
  const stackDiscount = stackedChores.length >= 3 ? 99 : 0;
  const verifiedRecordingPrice = isVerifiedRecording ? 49 : 0;
  const basePriceAfterDiscount = Math.max(rawStackPrice - stackDiscount, 199) + verifiedRecordingPrice;
  const finalPrice = bookingMode === 'recurring' ? Math.round(basePriceAfterDiscount * 0.85) : basePriceAfterDiscount;
  const platformFee = Math.round(finalPrice * 0.10);
  const totalAmountToPay = finalPrice + platformFee;

  const handleConfirmOrder = async (
    paymentMethodOverride?: 'pay_after_work' | 'upi_online' | 'wallet',
    paymentStatusOverride?: 'pending' | 'paid'
  ) => {
    setIsProcessingBooking(true);

    const method = paymentMethodOverride || selectedPaymentMethod;
    const status = paymentStatusOverride || (method === 'pay_after_work' ? 'pending' : 'paid');

    try {
      const maidCat = categories.find(c => c.slug === 'maid-helper') || categories[0];
      const result = await createBooking({
        service_id: selectedCategory ? selectedCategory.id : maidCat.id,
        sub_service_selected: stackedChores.map(c => c.title).join(' + ') || 'Hourly household help',
        booking_type: bookingMode === 'scheduled' ? 'scheduled' : 'instant',
        booking_mode: bookingMode,
        recurring_cadence: bookingMode === 'recurring' ? recurringCadence : undefined,
        scheduled_at: bookingMode === 'scheduled' ? scheduledSlot : null,
        customer_name: currentUser?.name || 'Customer',
        customer_phone: currentUser?.phone || '',
        customer_address: customerAddress,
        locality: customerLocality,
        professional_id: selectedPro?.id,
        customer_notes: customerNotes,
        stacked_chores: stackedChores,
        is_verified_recording: isVerifiedRecording,
        recording_consent_given: recordingConsentGiven,
        service_duration_mins: totalStackMinutes || 60,
        hub_id: 'hub-noida-01',
        total_amount: totalAmountToPay,
        payment_method: method as any,
        payment_status: status
      });

      if (result.success) {
        onRefreshBookings();
        setTrackingBooking(result.booking);
        setSelectedCategory(null);
        setBookingStep(1);

        // 1. Instant Push & In-App Notification (Feature 2)
        notificationService.notifyBookingConfirmed({
          id: result.booking.id,
          bookingReference: result.booking.booking_reference,
          serviceTitle: result.booking.service_title || result.booking.sub_service_selected,
          partnerName: result.booking.professional_name,
          startOtp: result.booking.service_start_otp,
          amount: result.booking.total_amount,
          paymentMethod: result.booking.payment_method,
        });
      }
    } catch (err) {
      alert('Error creating booking. Please try again.');
    } finally {
      setIsProcessingBooking(false);
    }
  };

  const handleToggleChore = async (choreId: string) => {
    if (!trackingBooking) return;
    try {
      const res = await toggleChoreCompletion(trackingBooking.id, choreId);
      setTrackingBooking(res.booking);
      onRefreshBookings();
    } catch (e) {
      setTrackingBooking(prev => {
        if (!prev || !prev.stacked_chores) return prev;
        return {
          ...prev,
          stacked_chores: prev.stacked_chores.map(c => c.id === choreId ? { ...c, is_completed: !c.is_completed } : c)
        };
      });
    }
  };

  const handleExtendTime = async () => {
    if (!trackingBooking) return;
    try {
      const res = await extendBookingTime(trackingBooking.id);
      setTrackingBooking(res.booking);
      setRemainingSeconds(prev => prev + 1800);
      onRefreshBookings();
      alert('Added 30 minutes extension (+₹99) to your current visit!');
    } catch (e) {
      setRemainingSeconds(prev => prev + 1800);
      alert('Added 30 minutes extension!');
    }
  };

  const handleSimulateStatus = async (bookingId: string, newStatus: any) => {
    await updateBookingStatus(bookingId, newStatus);
    onRefreshBookings();
    if (trackingBooking && trackingBooking.id === bookingId) {
      const updated = { ...trackingBooking, status: newStatus };
      setTrackingBooking(updated);

      if (newStatus === 'on_the_way') {
        notificationService.notifyPartnerArriving({
          id: updated.id,
          partnerName: updated.professional_name,
          startOtp: updated.service_start_otp,
          etaMinutes: 12,
        });
      }
    }
  };

  const handleVerifyStartOtp = async (bookingId: string) => {
    try {
      const res = await verifyBookingOtp(bookingId, trackingBooking?.service_start_otp || '1234', 'start');
      onRefreshBookings();
      if (res?.booking) {
        setTrackingBooking(res.booking);
        notificationService.notifyServiceStarted({
          id: res.booking.id,
          serviceTitle: res.booking.service_title || res.booking.sub_service_selected,
          partnerName: res.booking.professional_name,
        });
      }
    } catch (err: any) {
      console.warn('Start OTP verify notice:', err);
    }
  };

  const handleVerifyCompleteOtp = async (bookingId: string) => {
    try {
      const res = await verifyBookingOtp(bookingId, trackingBooking?.service_completion_otp || '1234', 'complete');
      onRefreshBookings();
      if (res?.booking) {
        setTrackingBooking(res.booking);
        notificationService.notifyServiceCompleted({
          id: res.booking.id,
          serviceTitle: res.booking.service_title || res.booking.sub_service_selected,
          amount: res.booking.total_amount,
          paymentMethod: res.booking.payment_method,
        });
        // Open review modal
        setReviewBooking(res.booking);
      }
    } catch (err: any) {
      console.warn('Complete OTP verify notice:', err);
    }
  };

  const handleSendReview = async () => {
    if (!reviewBooking) return;
    await submitReview(reviewBooking.id, reviewRating, reviewComment, isProblemReported);
    onRefreshBookings();
    setReviewBooking(null);
    setReviewComment('');
    setIsProblemReported(false);
    alert('Thank you! Your feedback helps keep QuickServe verified and reliable.');
  };

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'Wrench': return Wrench;
      case 'Zap': return Zap;
      case 'Sparkles': return Sparkles;
      case 'HeartHandshake': return HeartHandshake;
      default: return Wrench;
    }
  };

  const activeCats = categories.filter(c => c.is_active);
  const inactiveCats = categories.filter(c => !c.is_active);
  const doorstepDetails = (() => {
    try {
      const s = localStorage.getItem('quickserve_doorstep_details');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  })();
  const doorstepSubtitle = doorstepDetails?.streetGali || doorstepDetails?.houseNo || 'Tap to set doorstep address';

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen relative flex flex-col font-sans sm:shadow-2xl sm:rounded-3xl sm:border sm:border-slate-200 sm:my-3 overflow-x-hidden">
      {/* 1. TOP HEADER & LOCALITY */}
      <div>
        {/* 1. QUICKSERVE CLEAN TOP HEADER - ONLY DISPLAYED ON HOME TAB */}
        {activeTab === 'home' && (
          <div className="bg-white border-b border-slate-100 p-4 pt-5 pb-3">
            {/* Top: Location, Instant Arrival Indicator & User Login */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {onNavigateToWebsite && (
                  <button
                    onClick={onNavigateToWebsite}
                    className="p-1.5 -ml-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
                    title="All Services"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={onOpenLocationModal}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {activeCityZone || 'Sector 18, Noida'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <span className="text-[10px] text-slate-400 block font-normal truncate max-w-[170px]">
                      {doorstepSubtitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>15 min</span>
                </div>

                {/* In-App Notification Center Bell */}
                <button
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="relative p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors active:scale-95"
                  title="Notifications & Alerts"
                >
                  <Bell className="w-4 h-4 text-slate-700" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {currentUser ? (
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-700 shadow-sm"
                    title={currentUser.name}
                  >
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </button>
                ) : (
                  <button
                    onClick={onOpenAuth}
                    className="px-2.5 py-1 rounded-full bg-brand-600 text-white text-[11px] font-bold shadow-sm hover:bg-brand-500"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>

            {/* Clean Light Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={lang === 'en' ? 'Search "Bathroom", "Fridge", "Maid", "Utensils"...' : 'सर्च करें "बाथरूम सफाई", "फ्रिज", "झाड़ू-पोछा"...'}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setSearchResult(null); }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Smart Search Suggestions Dropdown */}
            {searchResult && (
              <div className="relative z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs mt-2 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-500 mb-2 pb-1 border-b border-slate-100">
                  <span className="font-medium">Instant Match</span>
                  <span className="text-emerald-600 font-semibold">{searchResult.matchedIntentName || 'Match'}</span>
                </div>
                {searchResult.matchedCategory ? (
                  <div
                    onClick={() => {
                      if (searchResult.matchedCategory.is_active) {
                        startBookingFlow(searchResult.matchedCategory);
                        setSearchQuery('');
                        setSearchResult(null);
                      } else {
                        alert(`'${searchResult.matchedCategory.name}' is part of Phase 2 rollout.`);
                      }
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50/50 cursor-pointer border border-slate-100 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{searchResult.matchedCategory.name}</h4>
                      <p className="text-[11px] text-slate-500">{searchResult.matchedCategory.tagline}</p>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                      Book Now →
                    </span>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-2">No direct service match found. Try "bathroom", "fridge", or "utensils".</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. ONGOING ORDER BANNER (IF ACTIVE - ONLY ON HOME TAB) */}
        {activeTab === 'home' && activeBookings.some(b => ['confirmed', 'on_the_way', 'started'].includes(b.status)) && (
          <div className="px-4 pt-3 relative z-10">
            {activeBookings
              .filter(b => ['confirmed', 'on_the_way', 'started'].includes(b.status))
              .slice(0, 1)
              .map(b => (
                <div 
                  key={b.id} 
                  onClick={() => setTrackingBooking(b)}
                  className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md flex items-center justify-between cursor-pointer hover:bg-emerald-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                        {b.status === 'on_the_way' ? 'Professional On The Way 🚗' : b.status === 'started' ? 'Service In Progress ⚡' : 'Booking Confirmed ✓'}
                      </p>
                      <h4 className="text-xs font-bold text-white">{b.service_title} • {b.professional_name}</h4>
                    </div>
                  </div>
                  <span className="text-xs font-bold underline bg-emerald-700/60 px-2 py-1 rounded-lg">Track</span>
                </div>
              ))}
          </div>
        )}

        {/* 3. MAIN BODY ACCORDING TO ACTIVE TAB */}
        {activeTab === 'home' && (
          <div className={`p-4 space-y-4 ${stackedChores.length > 0 ? 'pb-36' : 'pb-20'}`}>
            {/* QUICKSERVE HERO BANNER */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white mb-2">
                  ⚡ QuickServe 15-Minute Delivery
                </div>
                <h2 className="text-base font-bold leading-tight">
                  {lang === 'en' ? 'House help in 15 minutes' : '15 मिनट में घरेलू मदद'}
                </h2>
                <p className="text-[11px] text-emerald-50 mt-1 opacity-90">
                  {lang === 'en' ? 'Book by the hour (1 hr ₹199) or select specific chores below' : 'प्रति घंटा बुकिंग या मनपसंद काम चुनें, पारदर्शी फ्लैट रेट्स'}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const maidCat = categories.find(c => c.slug === 'maid-helper') || categories[0];
                      if (maidCat) {
                        setSelectedCategory(maidCat);
                        setSelectedSubService(maidCat.sub_services?.[0] || null);
                        setBookingStep(1);
                      }
                    }}
                    className="px-3 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition-colors flex items-center gap-1"
                  >
                    <span>Book 1 Hr Help (₹199)</span>
                    <span>→</span>
                  </button>
                  <span className="text-[11px] text-emerald-100 font-medium">✓ Flat Rates</span>
                </div>
              </div>
            </div>

            {/* CHORES FILTER PILLS */}
            <div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'all', label: 'All Chores' },
                  { id: 'cleaning', label: '🧹 Cleaning & Floors' },
                  { id: 'kitchen', label: '🍽️ Kitchen & Dining' },
                  { id: 'repairs', label: '🔧 Fix & Appliances' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilterGroup(f.id as any)}
                    className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap text-xs transition-all ${
                      selectedFilterGroup === f.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D ISOMETRIC DIORAMA CARDS GRID (WITH CHORE STACKING & DURATION BADGES) */}
            <div className="grid grid-cols-2 gap-3">
              {professionalHomeServices
                .filter(item => selectedFilterGroup === 'all' || item.filterGroup === selectedFilterGroup)
                .map((item) => {
                  const isSelected = stackedChores.some(c => c.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveScopeService(item)}
                      className={`group bg-white rounded-2xl p-2.5 transition-all cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500'
                          : 'border border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      {/* Duration Badge */}
                      <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200/60 text-[9px] font-bold text-slate-700 shadow-xs">
                        ⏱️ {item.duration_mins}m
                      </span>

                      {/* Active Selection Checkmark */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow">
                          ✓
                        </span>
                      )}

                      {/* 3D Diorama Image Container */}
                      <div className="aspect-square w-full rounded-xl bg-slate-50/90 flex items-center justify-center p-2 mb-2 overflow-hidden border border-slate-100/70 group-hover:bg-slate-50 transition-colors relative">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                          loading="lazy"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-1 py-0.5 rounded bg-white/95 text-[8px] font-black text-emerald-800 border border-emerald-200/80 shadow-2xs">
                          Do's & Don'ts ℹ️
                        </span>
                      </div>

                      {/* Card Bottom: Title & Add/Stack Button */}
                      <div className="flex items-end justify-between gap-1 pt-0.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-xs leading-snug group-hover:text-emerald-600 transition-colors truncate">
                            {lang === 'en' ? item.title : item.title_hi}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            ₹{item.startingPrice} • {item.duration_mins} mins
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChoreInStack(item);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Added ✓' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* 3-POINT QUICKSERVE MINIMAL TRUST STRIP */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 mt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                  ⚡
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">15-20 Min Arrival</h5>
                  <p className="text-[10px] text-slate-500">Trained local partners ready in your society</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                  🛡️
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">100% Police & Aadhaar Verified</h5>
                  <p className="text-[10px] text-slate-500">Identity check & 4-digit start OTP security</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                  ₹
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Flat Transparent Pricing</h5>
                  <p className="text-[10px] text-slate-500">No hidden fees, no surge charges. Pay after service.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY BOOKINGS & SCHEDULE (WITH CALENDAR & RICH ACTIONS) */}
        {activeTab === 'bookings' && (
          <CustomerBookingsScreen
            bookings={activeBookings}
            categories={categories}
            onNavigateTab={setActiveTab}
            onTrackBooking={(b) => setTrackingBooking(b)}
            onReviewBooking={(b) => setReviewBooking(b)}
            onBookCategory={(cat) => startBookingFlow(cat)}
            onRefreshBookings={onRefreshBookings}
            activeCityZone={activeCityZone}
          />
        )}

        {/* TAB 3: SUPPORT & HELP */}
        {activeTab === 'support' && (
          <div className="p-4 space-y-4 pb-20">
            <h3 className="font-bold text-slate-900 text-base">QuickServe Help & Support</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Phone className="w-4 h-4 text-brand-600" />
                <span>Dedicated Customer Care</span>
              </div>
              <p className="text-slate-600">
                Facing an issue with a booking? Our Bengaluru support team resolves disputes in under 15 minutes.
              </p>
              <div className="pt-2">
                <a 
                  href="tel:1800123456" 
                  className="block text-center py-2 bg-slate-900 text-white font-bold rounded-xl"
                >
                  Call Helpline: 1800-QUICK-HELP
                </a>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">Common Topics</h4>
              <button 
                onClick={() => alert('Razorpay UPI refund policy: Cancellations before professional arrival receive 100% instant refund back to your source account.')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center"
              >
                <span>Refund Policy & Invoicing</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button 
                onClick={() => alert('All QuickServe home helpers and caretakers are police verified with verified address records stored securely.')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center"
              >
                <span>Safety & Verification Guidelines</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <CustomerProfileScreen
            currentUser={currentUser}
            onLogout={onLogout}
            onNavigateTab={setActiveTab}
            onOpenAuth={onOpenAuth}
            activeCityZone={activeCityZone}
            onUpdateUser={onUpdateUser}
            onSwitchToPartnerMode={onSwitchToPartnerApp}
          />
        )}
      </div>

      {/* PERSISTENT FLOATING PROCEED / CART BAR (ALWAYS ANCHORED SAFELY ABOVE BOTTOM BAR) */}
      {stackedChores.length > 0 && activeTab === 'home' && (
        <div className="fixed bottom-[74px] left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-50 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
          <div className="bg-slate-950/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border-2 border-emerald-500/60 flex items-center justify-between ring-4 ring-emerald-500/15">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shrink-0">
                {stackedChores.length}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white truncate">
                    {stackedChores.length} {stackedChores.length === 1 ? 'Chore' : 'Chores'} ({totalStackMinutes} mins)
                  </span>
                  {stackedChores.length >= 3 && (
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full shrink-0">
                      -₹99 SAVED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-400 font-extrabold truncate">
                  ₹{totalAmountToPay} Total • 15-Min Guaranteed Visit
                </p>
              </div>
            </div>

            <button
              onClick={openReviewAndBook}
              className="shrink-0 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <span>Review & Book</span>
              <span className="text-sm font-bold">→</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. BOTTOM MOBILE NAVIGATION BAR - ALWAYS FIXED TO BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 h-16 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-area-bottom">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-emerald-600 font-bold' : 'hover:text-slate-700'}`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'home' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
            <Wrench className="w-4 h-4" />
          </div>
          <span>Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'bookings' ? 'text-emerald-600 font-bold' : 'hover:text-slate-700'}`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'bookings' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
            <Calendar className="w-4 h-4" />
          </div>
          <span>Bookings</span>
        </button>

        <button 
          onClick={() => setActiveTab('support')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'support' ? 'text-emerald-600 font-bold' : 'hover:text-slate-700'}`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'support' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
            <MessageSquare className="w-4 h-4" />
          </div>
          <span>Support</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'hover:text-slate-700'}`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>Profile</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 5. QUICKSERVE 5-STEP STACKING & BOOKING FLOW MODAL */}
      {/* ========================================================================= */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {bookingStep > 1 && (
                  <button 
                    onClick={() => setBookingStep((bookingStep - 1) as any)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {bookingStep === 1 && '1. Review Your Chore Stack'}
                    {bookingStep === 2 && '2. Choose Booking Mode'}
                    {bookingStep === 3 && '3. QuickServe Verified Safety'}
                    {bookingStep === 4 && '4. Location & Partner'}
                    {bookingStep === 5 && '5. Review & Payment Mode'}
                  </h3>
                  <span className="text-[10px] text-slate-400">Step {bookingStep} of 5 • QuickServe Verified</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* STEP 1: REVIEW STACKED CHORES (THE CHORE CART) */}
              {bookingStep === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Stacked Chores for Single Visit</h4>
                      <p className="text-slate-500 text-[11px]">One verified Pro handles all stacked tasks:</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      ⏱️ {totalStackMinutes} mins total
                    </span>
                  </div>

                  {/* List of currently stacked chores */}
                  <div className="space-y-2">
                    {stackedChores.map((chore) => (
                      <div
                        key={chore.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {chore.image && (
                            <img src={chore.image} alt={chore.title} className="w-10 h-10 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100" />
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{chore.title}</p>
                            <span className="text-[10px] text-slate-400">{chore.duration_mins} mins duration</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-xs">₹{chore.price}</span>
                          {stackedChores.length > 1 && (
                            <button
                              onClick={() => removeChoreFromStack(chore.id)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="Remove from stack"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stack discount banner */}
                  {stackedChores.length >= 3 ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <span>🎉 Multi-Chore Stack Discount Applied!</span>
                      </div>
                      <span className="font-bold text-xs">-₹99</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-[10px]">
                      💡 Tip: Stack 3 or more chores to unlock instant ₹99 bundle discount!
                    </div>
                  )}

                  {/* Cost preview summary */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Chores Subtotal</span>
                      <span className="font-semibold text-slate-800">₹{rawStackPrice}</span>
                    </div>
                    {stackedChores.length >= 3 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Bundle Stack Discount</span>
                        <span>-₹99</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Platform Assurance Fee</span>
                      <span className="font-semibold text-slate-800">₹{platformFee}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
                      <span>Total Estimated</span>
                      <span className="text-emerald-700">₹{totalAmountToPay}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: 3-MODE BOOKING SELECTOR (INSTANT / SCHEDULED / RECURRING) */}
              {bookingStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Select Booking Mode</h4>
                    <p className="text-slate-500 text-[11px]">How often and when do you need this help?</p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Mode 1: Instant */}
                    <div
                      onClick={() => setBookingMode('instant')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        bookingMode === 'instant'
                          ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          ⚡
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-slate-900 text-xs">Instant 15-Minute Arrival</h5>
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">POPULAR</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Dispatches nearest partner from {activeCityZone || 'Sector 18, Noida Hub'}</p>
                        </div>
                      </div>
                      <input type="radio" checked={bookingMode === 'instant'} readOnly className="text-emerald-600" />
                    </div>

                    {/* Mode 2: Scheduled */}
                    <div
                      onClick={() => setBookingMode('scheduled')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        bookingMode === 'scheduled'
                          ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          📅
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">Scheduled Slot</h5>
                          <p className="text-[10px] text-slate-500 mt-0.5">Pick a convenient 1-hour time window</p>
                        </div>
                      </div>
                      <input type="radio" checked={bookingMode === 'scheduled'} readOnly className="text-emerald-600" />
                    </div>

                    {/* Mode 3: Recurring */}
                    <div
                      onClick={() => setBookingMode('recurring')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        bookingMode === 'recurring'
                          ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                          🔁
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-slate-900 text-xs">Recurring Cadence</h5>
                            <span className="text-[9px] bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded-full">SAVE 15%</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Auto-assigned consistent partner on your schedule</p>
                        </div>
                      </div>
                      <input type="radio" checked={bookingMode === 'recurring'} readOnly className="text-emerald-600" />
                    </div>
                  </div>

                  {/* Scheduled Slot Picker */}
                  {bookingMode === 'scheduled' && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-emerald-500/40 space-y-3 mt-2 animate-in fade-in-50">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>1. Select Date (तारीख चुनें):</span>
                        </label>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
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

                  {/* Recurring Cadence Picker */}
                  {bookingMode === 'recurring' && (
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2 mt-2">
                      <label className="text-[11px] font-semibold text-purple-900 block">Recurring Days Cadence:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'daily', label: 'Daily (Mon-Sun)' },
                          { id: 'weekdays', label: 'Weekdays (Mon-Fri)' },
                          { id: 'alternate', label: 'Alternate (Mon-Wed-Fri)' },
                          { id: 'weekends', label: 'Weekends Only (Sat-Sun)' },
                        ].map((cad) => (
                          <button
                            key={cad.id}
                            type="button"
                            onClick={() => setRecurringCadence(cad.id as any)}
                            className={`p-2 rounded-lg text-[10px] font-bold transition-all border ${
                              recurringCadence === cad.id
                                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                            }`}
                          >
                            {cad.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-purple-800 mt-1">✓ 15% discount automatically applied to all visits</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: "QUICKSERVE VERIFIED" SECURITY & RECORDING CONSENT */}
              {bookingStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">QuickServe Verified & Safety</h4>
                    <p className="text-slate-500 text-[11px]">Extra layer of protection for you and your home:</p>
                  </div>

                  {/* Verified Recording Option Card */}
                  <div 
                    onClick={() => setIsVerifiedRecording(!isVerifiedRecording)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isVerifiedRecording
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-slate-900 text-xs">Enable QuickServe Verified</h5>
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 rounded-full">+₹49</span>
                          </div>
                          <p className="text-[10px] text-slate-500">Certified partner records work session</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isVerifiedRecording} 
                        onChange={() => {}} 
                        className="w-4 h-4 text-emerald-600 rounded" 
                      />
                    </div>
                  </div>

                  {/* QuickServe Consent Terms Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px] leading-relaxed text-slate-600">
                    <p className="font-bold text-slate-900">🛡️ How Verification & Privacy Works:</p>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-600">
                      <li>A certified partner records only active chore work using an encrypted badge.</li>
                      <li>Video footage is anonymized with facial blurring; raw footage is automatically deleted after 48 hours.</li>
                      <li>Footage is strictly accessed only if you raise an objective dispute.</li>
                    </ul>

                    {isVerifiedRecording && (
                      <label className="flex items-start gap-2 pt-2 border-t border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={recordingConsentGiven}
                          onChange={(e) => setRecordingConsentGiven(e.target.checked)}
                          className="mt-0.5 rounded text-emerald-600"
                        />
                        <span className="text-[10px] font-semibold text-slate-800">
                          I explicitly consent on behalf of my household to encrypted recording of this visit.
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: ADDRESS & ASSIGNED CLUSTER HUB */}
              {bookingStep === 4 && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Address & Staging Hub</h4>
                    <p className="text-slate-500 text-[11px]">Where should the professional arrive?</p>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">House / Flat / Society:</label>
                      <input 
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Locality / Cluster Hub:</label>
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          {activeCityZone || 'Sector 18, Noida Hub'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold flex-shrink-0">5 Pros Ready</span>
                      </div>
                    </div>

                    {/* Matched Verified Pro Card */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                      <img 
                        src={selectedPro?.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'} 
                        alt="Rahul" 
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-slate-900 text-xs">{selectedPro?.name || 'Rahul Kumar'}</h5>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded">✓ Certified</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">4.8★ • Police & Aadhaar Cleared</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Special Instructions (Optional):</label>
                      <textarea
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="e.g. Master bathroom tap is dripping, bell is not working."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs h-16 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & PAYMENT OPTIONS */}
              {bookingStep === 5 && (
                <div className="space-y-3.5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Review & Select Payment Mode</h4>
                    <p className="text-slate-500 text-[11px]">Zero hidden charges • 100% Quality Assurance Guarantee</p>
                  </div>

                  {/* Itemized Bill Summary */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Stacked Chores ({stackedChores.length}):</span>
                      <span className="font-bold text-slate-800">₹{rawStackPrice}</span>
                    </div>

                    {stackedChores.length >= 3 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Multi-Chore Stack Discount:</span>
                        <span>-₹99</span>
                      </div>
                    )}

                    {bookingMode === 'recurring' && (
                      <div className="flex justify-between text-purple-700 font-bold">
                        <span>Recurring Subscriber 15% OFF:</span>
                        <span>-₹{Math.round((rawStackPrice - stackDiscount) * 0.15)}</span>
                      </div>
                    )}

                    {isVerifiedRecording && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>QuickServe Verified Recording:</span>
                        <span>+₹49</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Platform Assurance Fee (10%):</span>
                      <span className="font-bold text-slate-800">₹{platformFee}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-extrabold text-slate-900">
                      <span>Total Amount:</span>
                      <span className="text-emerald-700 text-base font-black">₹{totalAmountToPay}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Choose How You Want to Pay:</span>

                    {/* Option 1: Payment After Work (User's explicit request) */}
                    <div
                      onClick={() => setSelectedPaymentMethod('pay_after_work')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        selectedPaymentMethod === 'pay_after_work'
                          ? 'border-2 border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            selectedPaymentMethod === 'pay_after_work' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Banknote className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">Payment After Work</span>
                              <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                ✨ Pay After Service
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              Pay seamlessly via Cash or UPI QR directly to the partner only after the work is completed to your 100% satisfaction.
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-800 font-medium">
                              <span>✓ Zero advance</span>
                              <span>•</span>
                              <span>✓ 100% Quality assurance</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-0.5 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'pay_after_work' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                          }`}>
                            {selectedPaymentMethod === 'pay_after_work' && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Instant UPI / Online Payment */}
                    <div
                      onClick={() => setSelectedPaymentMethod('upi_online')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        selectedPaymentMethod === 'upi_online'
                          ? 'border-2 border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            selectedPaymentMethod === 'upi_online' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">Instant UPI / Cards</span>
                              <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                GPay • PhonePe • Paytm
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              Prepay online securely via Razorpay gateway. 100% refundable if cancelled.
                            </p>
                          </div>
                        </div>

                        <div className="pt-0.5 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'upi_online' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                          }`}>
                            {selectedPaymentMethod === 'upi_online' && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Option 3: QuickServe Wallet */}
                    <div
                      onClick={() => setSelectedPaymentMethod('wallet')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        selectedPaymentMethod === 'wallet'
                          ? 'border-2 border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            selectedPaymentMethod === 'wallet' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">QuickServe Wallet</span>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                Bal: ₹{currentUser?.wallet_balance || 0}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                              {(currentUser?.wallet_balance || 0) >= totalAmountToPay 
                                ? 'Sufficient balance available for 1-tap instant debit.' 
                                : 'Insufficient wallet balance. Please choose Pay After Work or UPI.'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-0.5 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'wallet' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                          }`}>
                            {selectedPaymentMethod === 'wallet' && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {bookingStep < 5 ? (
                <button
                  onClick={() => setBookingStep((bookingStep + 1) as any)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : selectedPaymentMethod === 'pay_after_work' ? (
                <button
                  disabled={isProcessingBooking}
                  onClick={() => handleConfirmOrder('pay_after_work', 'pending')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  {isProcessingBooking ? (
                    <span>Confirming Booking...</span>
                  ) : (
                    <>
                      <span>Confirm Booking (Pay ₹{totalAmountToPay} After Work)</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              ) : selectedPaymentMethod === 'upi_online' ? (
                <button
                  disabled={isProcessingBooking}
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  {isProcessingBooking ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>Pay ₹{totalAmountToPay} via UPI / Online</span>
                      <span>•</span>
                      <span>15 Min Arrival</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled={isProcessingBooking || (currentUser?.wallet_balance || 0) < totalAmountToPay}
                  onClick={() => handleConfirmOrder('wallet', 'paid')}
                  className={`w-full py-3.5 font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-98 ${
                    (currentUser?.wallet_balance || 0) >= totalAmountToPay
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Pay ₹{totalAmountToPay} from Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RAZORPAY UPI CHECKOUT MODAL */}
      {showPaymentModal && selectedCategory && (
        <RazorpayModal
          amount={totalAmountToPay}
          serviceTitle={`QuickServe Chores (${stackedChores.length} Chores)`}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(_paymentId) => {
            setShowPaymentModal(false);
            handleConfirmOrder();
          }}
        />
      )}


      {/* ========================================================================= */}
      {/* 6. LIVE IN-SERVICE TELEMETRY & COUNTDOWN TRACKING VIEW */}
      {/* ========================================================================= */}
      {trackingBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <h3 className="font-bold text-white text-xs">Live Telemetry & In-Service Tracking</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{trackingBooking.booking_reference}</span>
                </div>
              </div>
              <button 
                onClick={() => setTrackingBooking(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tracking Body */}
            <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
              {/* LIVE IN-SERVICE TIMER (WHEN STATUS IS STARTED) */}
              {trackingBooking.status === 'started' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">Live Service Countdown</span>
                    </div>
                    {trackingBooking.is_verified_recording && (
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                        REC
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-mono font-black text-white tracking-widest">
                        {formatTimer(remainingSeconds)}
                      </span>
                      <p className="text-[10px] text-emerald-200 mt-0.5">Remaining in this booking visit</p>
                    </div>

                    <button
                      onClick={handleExtendTime}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
                    >
                      + 30m (₹99)
                    </button>
                  </div>
                </div>
              )}

              {/* INTERACTIVE CHORE CHECKLIST */}
              {trackingBooking.stacked_chores && trackingBooking.stacked_chores.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Chores Checklist ({trackingBooking.stacked_chores.length})</span>
                    <span className="text-[10px] text-slate-500">Tap to toggle status</span>
                  </div>

                  <div className="space-y-1.5">
                    {trackingBooking.stacked_chores.map((chore) => (
                      <div
                        key={chore.id}
                        onClick={() => handleToggleChore(chore.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          chore.is_completed
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(chore.is_completed)}
                            onChange={() => {}}
                            className="rounded text-emerald-600"
                          />
                          <span className={`text-xs font-semibold ${chore.is_completed ? 'line-through text-slate-400' : ''}`}>
                            {chore.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{chore.duration_mins} mins</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Header */}
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900">
                  {trackingBooking.status === 'on_the_way' && `${trackingBooking.professional_name} is arriving in ~12 mins 🚗`}
                  {trackingBooking.status === 'confirmed' && `Booking Confirmed • Partner preparing at ${activeCityZone || 'Sector 18, Noida Hub'}`}
                  {trackingBooking.status === 'started' && 'Partner at Work Inside Home 🧹'}
                  {trackingBooking.status === 'completed' && 'Service Completed Successfully! 🎉'}
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {trackingBooking.sub_service_selected}
                </p>
              </div>

              {/* SECURITY OTP DISPLAY (Section 8 & 36) */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Service Start OTP</span>
                  <span className="text-lg font-mono font-bold text-emerald-600 tracking-wider">
                    {trackingBooking.service_start_otp}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Share upon arrival</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Completion OTP</span>
                  <span className="text-lg font-mono font-bold text-slate-800 tracking-wider">
                    {trackingBooking.service_completion_otp}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Share after inspection</span>
                </div>
              </div>

              {/* Professional Profile Card */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-subtle">
                <div className="flex items-center gap-3">
                  <img 
                    src={trackingBooking.professional_avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'} 
                    alt={trackingBooking.professional_name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-xs">{trackingBooking.professional_name}</h4>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1 rounded">
                        ✓ Verified Pro
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{trackingBooking.professional_phone}</p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      <span>{trackingBooking.professional_rating || 4.8}★ ({activeCityZone || 'Sector 18, Noida Hub'})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${trackingBooking.professional_phone}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </a>
                  <button 
                    onClick={() => alert(`Starting encrypted chat with ${trackingBooking.professional_name}...`)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Payment Mode & Bill Status */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                trackingBooking.payment_method === 'pay_after_work' || trackingBooking.payment_status === 'pending'
                  ? 'bg-amber-50/90 border-amber-200 shadow-xs'
                  : 'bg-emerald-50/90 border-emerald-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    trackingBooking.payment_method === 'pay_after_work' || trackingBooking.payment_status === 'pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {trackingBooking.payment_method === 'pay_after_work' || trackingBooking.payment_status === 'pending' ? (
                      <Banknote className="w-5 h-5" />
                    ) : (
                      <Check className="w-5 h-5 stroke-[3]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">
                        {trackingBooking.payment_method === 'pay_after_work' ? 'Payment After Work' : 'Prepaid Online'}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        trackingBooking.payment_status === 'pending'
                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                      }`}>
                        {trackingBooking.payment_status === 'pending' ? `TO PAY: ₹${trackingBooking.total_amount}` : `PAID ₹${trackingBooking.total_amount}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                      {trackingBooking.payment_method === 'pay_after_work' || trackingBooking.payment_status === 'pending'
                        ? 'Pay seamlessly via Cash or UPI QR directly to the partner only after the service is completed to your satisfaction.'
                        : 'Payment successfully received online. Zero cash required.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Confirmation & Share Card (Feature 1) */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">WhatsApp Confirmation</span>
                      <span className="text-[10px] text-emerald-700 font-medium">Instant Booking Details & Live Link</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    ⚡ 1-Tap
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Receive order ID, assigned partner details, 4-digit start OTP, and live tracking map on WhatsApp or share with family.
                </p>
                <button
                  onClick={() => openWhatsAppBookingShare(trackingBooking, currentUser?.phone)}
                  className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1caa52] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow transition-all transform active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>📲 Get / Share Updates on WhatsApp</span>
                </button>
              </div>

              {/* Simulation Testing Sandbox Controls */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-bold text-amber-800 block uppercase mb-1.5">
                  🧪 Partner Dispatch Simulation Controls
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleSimulateStatus(trackingBooking.id, 'on_the_way')}
                    className="py-1 px-1.5 bg-white border border-amber-300 rounded text-[10px] font-semibold text-slate-700 hover:bg-amber-100"
                  >
                    1. On The Way
                  </button>
                  <button
                    onClick={() => handleVerifyStartOtp(trackingBooking.id)}
                    className="py-1 px-1.5 bg-white border border-amber-300 rounded text-[10px] font-semibold text-slate-700 hover:bg-amber-100"
                  >
                    2. Verify Start OTP
                  </button>
                  <button
                    onClick={() => handleVerifyCompleteOtp(trackingBooking.id)}
                    className="py-1 px-1.5 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-500"
                  >
                    3. Complete Job
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Close */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need help with this order?</span>
              <button
                onClick={() => {
                  setTrackingBooking(null);
                  setActiveTab('support');
                }}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Report Problem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ALL SERVICES EXPANSION MODAL (Shows Inactive Phase-2 Categories) */}
      {/* ========================================================================= */}
      {showAllCategoriesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">All Service Categories</h3>
                <span className="text-[10px] text-slate-400">Phase 1 (Active) & Phase 2 (Coming Soon)</span>
              </div>
              <button 
                onClick={() => setShowAllCategoriesModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider mb-2">
                  Active in Bengaluru Launch (4)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {activeCats.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setShowAllCategoriesModal(false);
                        startBookingFlow(c);
                      }}
                      className="p-3 rounded-xl border border-brand-500/50 bg-brand-50/50 cursor-pointer"
                    >
                      <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                      <span className="text-[10px] text-brand-700 font-semibold">Book Now →</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                    Phase 2 Upcoming Categories ({inactiveCats.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Admin Managed</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {inactiveCats.map(c => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-80"
                    >
                      <h4 className="font-semibold text-slate-700 text-xs">{c.name}</h4>
                      <span className="text-[10px] text-slate-400">Coming Soon</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500">
                Admin can activate any category dynamically from the Admin Web Dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. POST-SERVICE RATING & REVIEW MODAL (Section 20) */}
      {/* ========================================================================= */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-in slide-in-from-bottom">
            <div className="text-center">
              <span className="text-3xl block mb-2">🌟</span>
              <h3 className="font-bold text-slate-900 text-base">How was your experience?</h3>
              <p className="text-xs text-slate-500">
                with {reviewBooking.professional_name} for {reviewBooking.service_title}
              </p>
            </div>

            {/* Star selector */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star 
                    className={`w-7 h-7 ${
                      star <= reviewRating 
                        ? 'text-amber-400 fill-amber-400' 
                        : 'text-slate-200'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback / Notes</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Punctual, carried genuine parts, cleaned up afterward..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs h-20 resize-none"
              />
            </div>

            {/* Separate Problem Report Checkbox (Section 20 requirement) */}
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="problemReport"
                checked={isProblemReported}
                onChange={(e) => setIsProblemReported(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="problemReport" className="text-xs text-rose-900">
                <span className="font-bold block">Report an issue with this service</span>
                <span className="text-[10px] text-rose-700">Flags this job for Admin review and opens a priority dispute ticket.</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setReviewBooking(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Skip
              </button>
              <button
                onClick={handleSendReview}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Scope Modal (Do's & Don'ts) */}
      <ServiceScopeModal
        service={activeScopeService}
        isOpen={!!activeScopeService}
        onClose={() => setActiveScopeService(null)}
        onToggleAdd={(svc) => toggleChoreInStack(svc)}
        onProceed={handleProceedFromScopeModal}
        isAdded={!!activeScopeService && stackedChores.some(c => c.id === activeScopeService.id)}
        lang={lang}
      />

      {/* Real-time In-App Notification Toast Banner */}
      <NotificationToastBanner
        onOpenTracking={() => {}}
        customerPhone={currentUser?.phone}
      />

      {/* 8. Dedicated In-App Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notificationsList}
        onTrackBooking={(bookingId) => {
          const target = activeBookings.find(b => b.id === bookingId || b.booking_reference === bookingId);
          if (target) {
            setTrackingBooking(target);
          } else {
            setActiveTab('bookings');
          }
        }}
        onMarkAllRead={() => notificationService.markAllAsRead()}
        onClearAll={() => notificationService.clearHistory()}
      />

    </div>
  );
};
