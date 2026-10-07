import React, { useState, useEffect, useMemo } from 'react';
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
import { openWhatsAppBookingShare, openWhatsAppToSupport } from '../utils/whatsapp';
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
    return localStorage.getItem('quickserve_user_address') || (activeCityZone ? activeCityZone : 'Ansal Golf Links 1, Greater Noida');
  });
  const [customerLocality, setCustomerLocality] = useState(() => {
    return localStorage.getItem('quickserve_active_zone') || activeCityZone || 'Ansal Golf Links 1, Greater Noida';
  });
  const [customerNotes, setCustomerNotes] = useState('');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState(() => {
    if (currentUser?.phone) {
      return currentUser.phone.replace(/\D/g, '').slice(-10);
    }
    return localStorage.getItem('quickserve_customer_phone') || '';
  });

  useEffect(() => {
    if (currentUser?.phone) {
      const ph = currentUser.phone.replace(/\D/g, '').slice(-10);
      if (ph) setBookingCustomerPhone(ph);
    }
  }, [currentUser]);

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
    const maidCat = categories.find(c => c.slug === 'maid-helper' || c.id === 'cat-maid') || categories[0];
    if (maidCat) {
      if (stackedChores.length > 0) {
        setSelectedCategory(maidCat);
        setBookingStep(1);
      } else {
        startBookingFlow(maidCat);
      }
    }
  };

  const handleProceedFromScopeModal = (svc: HomeServiceCard) => {
    setActiveScopeService(null);
    const cat = categories.find(c => c.slug === svc.categorySlug || c.id === svc.categoryId) || categories[0];
    startBookingFlow(cat, {
      id: svc.id,
      name: svc.title,
      price: svc.startingPrice,
      duration: `${svc.duration_mins} mins`
    });
  };

  // Tracking modal / view for an active booking
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);

  // Filter bookings for current logged-in user so other users' demo orders don't appear
  const userBookings = useMemo(() => {
    if (!currentUser) {
      // If guest user, check local storage for bookings created in this guest session
      try {
        const guestIds: string[] = JSON.parse(localStorage.getItem('quickserve_guest_booking_ids') || '[]');
        if (guestIds.length > 0) {
          return activeBookings.filter(b => guestIds.includes(b.id) || guestIds.includes(b.booking_reference));
        }
      } catch (e) {}
      return [];
    }
    const userDigits = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
    return activeBookings.filter(b => {
      const bDigits = (b.customer_phone || '').replace(/\D/g, '').slice(-10);
      if (userDigits && bDigits) {
        return bDigits === userDigits;
      }
      return false;
    });
  }, [activeBookings, currentUser]);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isProblemReported, setIsProblemReported] = useState(false);

  // Keep tracking modal in sync with latest booking status if it's currently open
  useEffect(() => {
    if (trackingBooking) {
      const updated = activeBookings.find(b => b.id === trackingBooking.id);
      if (updated && updated.status !== trackingBooking.status) {
        setTrackingBooking(updated);
      }
    }
  }, [activeBookings, trackingBooking]);

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

  const startBookingFlow = (cat: ServiceCategory, subSvc?: SubService) => {
    setSelectedCategory(cat);
    const chosenSub = subSvc || cat.sub_services?.[0] || null;
    setSelectedSubService(chosenSub);
    setStackedChores([{
      id: chosenSub?.id || cat.id,
      title: chosenSub?.name || cat.name,
      title_hi: cat.name_hi || cat.name,
      price: chosenSub?.price || cat.starting_price || 149,
      duration_mins: 45,
      is_completed: false
    }]);
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

  const totalStackMinutes = stackedChores.length > 0 
    ? stackedChores.reduce((acc, c) => acc + (c.duration_mins || 30), 0)
    : 45;

  const rawStackPrice = stackedChores.reduce((acc, c) => acc + c.price, 0);
  const activeBasePrice = stackedChores.length > 0 
    ? rawStackPrice 
    : (selectedSubService?.price || selectedCategory?.starting_price || 149);

  const stackDiscount = stackedChores.length >= 3 ? 99 : 0;
  const basePriceAfterDiscount = Math.max(activeBasePrice - stackDiscount, 99);
  const finalPrice = bookingMode === 'recurring' ? Math.round(basePriceAfterDiscount * 0.85) : basePriceAfterDiscount;
  const platformFee = 29;
  const totalAmountToPay = finalPrice + platformFee;

  const handleConfirmOrder = async (
    paymentMethodOverride?: 'pay_after_work' | 'upi_online' | 'wallet',
    paymentStatusOverride?: 'pending' | 'paid'
  ) => {
    const cleanPhone = (bookingCustomerPhone || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      alert('Please enter your 10-digit mobile number to receive the OTP and booking updates.');
      return;
    }
    localStorage.setItem('quickserve_customer_phone', cleanPhone);

    setIsProcessingBooking(true);

    const method = paymentMethodOverride || selectedPaymentMethod || 'pay_after_work';
    const status = paymentStatusOverride || (method === 'pay_after_work' ? 'pending' : 'paid');

    try {
      const cat = selectedCategory || categories.find(c => c.slug === 'maid-helper') || categories[0];
      const serviceName = selectedSubService?.name || (stackedChores.length > 0 ? stackedChores.map(c => c.title).join(' + ') : (cat?.name || 'Home Service'));
      const chosenAddr = customerAddress || activeCityZone || 'Ansal Golf Links 1, Greater Noida';
      const chosenLocality = customerLocality || activeCityZone || 'Ansal Golf Links 1, Greater Noida';

      const result = await createBooking({
        service_id: cat ? cat.id : 'cat-maid',
        sub_service_selected: serviceName,
        booking_type: bookingMode === 'scheduled' ? 'scheduled' : 'instant',
        booking_mode: bookingMode,
        recurring_cadence: bookingMode === 'recurring' ? recurringCadence : undefined,
        scheduled_at: bookingMode === 'scheduled' ? scheduledSlot : null,
        customer_name: currentUser?.name || 'Customer',
        customer_phone: `+91 ${cleanPhone}`,
        customer_address: chosenAddr,
        locality: chosenLocality,
        professional_id: selectedPro?.id,
        customer_notes: customerNotes,
        stacked_chores: stackedChores,
        is_verified_recording: false,
        recording_consent_given: false,
        service_duration_mins: totalStackMinutes || 45,
        hub_id: 'hub-gnoida-01',
        total_amount: totalAmountToPay,
        payment_method: method as any,
        payment_status: status
      });

      if (result && result.booking) {
        // Auto-create/sync guest profile if not logged in
        if (!currentUser) {
          const autoUser: CustomerUser = {
            id: `cust-${Date.now()}`,
            name: 'Customer',
            phone: `+91 ${cleanPhone}`,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            saved_addresses: [
              {
                id: 'addr-1',
                label: 'Home',
                flat: chosenAddr,
                area: chosenLocality,
                city: 'Greater Noida',
                is_default: true
              }
            ],
            default_address_id: 'addr-1'
          };
          localStorage.setItem('quickserve_user', JSON.stringify(autoUser));
          if (onUpdateUser) onUpdateUser(autoUser);
        }

        try {
          const guestIds: string[] = JSON.parse(localStorage.getItem('quickserve_guest_booking_ids') || '[]');
          if (!guestIds.includes(result.booking.id)) {
            guestIds.push(result.booking.id);
            localStorage.setItem('quickserve_guest_booking_ids', JSON.stringify(guestIds));
          }
        } catch (e) {}

        onRefreshBookings();
        setTrackingBooking(result.booking);
        setSelectedCategory(null);
        setStackedChores([]);
        setBookingStep(1);

        // Instant In-App Notification
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
    } catch (err: any) {
      console.error('Booking creation error:', err);
      alert('Order could not be created. Please check your network connection and try again.');
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
                placeholder='Search "Bathroom", "Fridge", "Maid", "Utensils"...'
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
        {activeTab === 'home' && userBookings.some(b => ['confirmed', 'on_the_way', 'started'].includes(b.status)) && (
          <div className="px-4 pt-3 relative z-10">
            {userBookings
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
          <div className={`p-4 space-y-4 ${stackedChores.length > 0 ? 'pb-44' : 'pb-36'}`}>
            {/* QUICKSERVE HERO BANNER */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold text-white mb-2">
                  ⚡ QuickServe 15-Minute Delivery
                </div>
                <h2 className="text-base font-bold leading-tight">
                  House help in 15 minutes
                </h2>
                <p className="text-[11px] text-emerald-50 mt-1 opacity-90">
                  Book by the hour (1 hr ₹199) or select specific chores below
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const maidCat = categories.find(c => c.slug === 'maid-helper') || categories[0];
                      if (maidCat) {
                        startBookingFlow(maidCat);
                      }
                    }}
                    className="px-3.5 py-2 bg-white text-emerald-900 font-extrabold text-xs rounded-xl shadow-md hover:bg-emerald-50 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Book 1 Hr Help (₹199)</span>
                    <span className="font-bold">→</span>
                  </button>
                  <span className="text-[11px] text-emerald-100 font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                    ✓ Pay After Work
                  </span>
                </div>
              </div>
            </div>

            {/* 6 PRIMARY SERVICES - 1-TAP FAST BOOKING */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Primary Services
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verified local experts at fixed flat prices
                  </p>
                </div>
                <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ⚡ 15-20 Min
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'cat-plumber',
                    slug: 'plumber',
                    title: 'Plumber',
                    title_hi: 'Plumber',
                    price: 149,
                    icon: '🔧',
                    eta: '15 min',
                    subtext: 'Taps, leakage, flush & pipes'
                  },
                  {
                    id: 'cat-electrician',
                    slug: 'electrician',
                    title: 'Electrician',
                    title_hi: 'Electrician',
                    price: 149,
                    icon: '⚡',
                    eta: '15 min',
                    subtext: 'Fan, light, switch, MCB trip'
                  },
                  {
                    id: 'cat-maid',
                    slug: 'maid-helper',
                    title: 'Maid / Helper',
                    title_hi: 'Maid / Helper',
                    price: 199,
                    icon: '🧹',
                    eta: '15 min',
                    subtext: 'Mopping, utensils, dusting'
                  },
                  {
                    id: 'cat-ac-repair',
                    slug: 'ac-repair',
                    title: 'AC Service & Repair',
                    title_hi: 'AC Service & Repair',
                    price: 299,
                    icon: '❄️',
                    eta: '20 min',
                    subtext: 'Jet wash, cooling, gas check'
                  },
                  {
                    id: 'cat-cook',
                    slug: 'cook',
                    title: 'Home Cook',
                    title_hi: 'Home Cook',
                    price: 249,
                    icon: '🍳',
                    eta: '20 min',
                    subtext: 'Fresh home meal lunch/dinner'
                  },
                  {
                    id: 'cat-caretaker',
                    slug: 'caretaker',
                    title: 'Caretaker / Attendant',
                    title_hi: 'Caretaker / Attendant',
                    price: 349,
                    icon: '🤝',
                    eta: '30 min',
                    subtext: 'Elderly care & patient assistance'
                  }
                ].map((svc) => (
                  <div
                    key={svc.id}
                    onClick={() => {
                      const cat = categories.find(c => c.slug === svc.slug || c.id === svc.id) || {
                        id: svc.id,
                        name: svc.title,
                        name_hi: svc.title_hi,
                        slug: svc.slug,
                        starting_price: svc.price,
                        is_active: true
                      };
                      startBookingFlow(cat as any);
                    }}
                    className="p-3 bg-white border border-slate-200/90 hover:border-emerald-500 rounded-2xl cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xl p-1.5 rounded-xl bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                          {svc.icon}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                          {svc.eta}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors leading-tight">
                        {svc.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {svc.subtext}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium leading-none">Starting</span>
                        <span className="text-xs font-black text-slate-900">₹{svc.price}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-xs transition-colors flex items-center gap-0.5">
                        Book →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
            bookings={userBookings}
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
          <div className="p-4 space-y-4 pb-36">
            <h3 className="font-bold text-slate-900 text-base">QuickServe Help & Support</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Phone className="w-4 h-4 text-brand-600" />
                <span>Dedicated Customer Care</span>
              </div>
              <p className="text-slate-600">
                Facing an issue with a booking? Our dedicated QuickServe support team resolves queries in under 15 minutes.
              </p>
              <div className="pt-2">
                <a 
                  href="tel:+919570151834" 
                  className="block text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Helpline: +91 95701 51834</span>
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
      {/* ========================================================================= */}
      {/* 5. QUICKSERVE FAST 1-SCREEN BOOKING BOTTOM SHEET */}
      {/* ========================================================================= */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shadow-xs">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedCategory.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>15-20 Min Express Arrival • QuickServe Pro</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-1.5 hover:bg-slate-200/80 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* 1. ORDER SUMMARY & TRANSPARENT BILL */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>🛠️</span>
                    <span>{selectedSubService?.name || (stackedChores.length > 0 ? stackedChores.map(c => c.title).join(' + ') : selectedCategory.name)}</span>
                  </div>
                  <span className="text-emerald-800 font-extrabold text-sm">₹{activeBasePrice}</span>
                </div>
                
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>🛡️ Platform & Safety Assurance</span>
                  </span>
                  <span>₹{platformFee}</span>
                </div>

                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span className="text-emerald-700 text-base">₹{totalAmountToPay}</span>
                </div>
              </div>

              {/* 2. CUSTOMER MOBILE NUMBER (CRITICAL FOR SMS & WHATSAPP) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>📱</span>
                    <span>Mobile Number:</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Required for OTP
                  </span>
                </label>
                <div className="flex items-center bg-slate-50 border-2 border-slate-300 focus-within:border-emerald-500 rounded-xl overflow-hidden px-3 py-2.5 transition-all shadow-xs">
                  <span className="text-xs font-black text-slate-600 pr-2.5 border-r border-slate-300">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={bookingCustomerPhone}
                    onChange={(e) => setBookingCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-3 bg-transparent text-sm font-bold text-slate-900 focus:outline-none tracking-wider placeholder-slate-400"
                  />
                  {bookingCustomerPhone.length === 10 && (
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Partner phone, live tracking link, and 4-digit OTP will be sent to this number.
                </p>
              </div>

              {/* 3. DOORSTEP ADDRESS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🏠</span>
                    <span>Doorstep Address:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {activeCityZone || 'Ansal Golf Links 1, Greater Noida'}
                  </span>
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Flat / House No., Tower, Society / Street"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* 4. ARRIVAL TIME TOGGLE (INSTANT VS SCHEDULE) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 block">
                  Service Time:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingMode('instant')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      bookingMode === 'instant'
                        ? 'border-2 border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>⚡</span>
                      <span className="text-xs font-bold">15-20 Min Arrival</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Instant dispatch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingMode('scheduled')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      bookingMode === 'scheduled'
                        ? 'border-2 border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span className="text-xs font-bold">Schedule Later</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Pick date & time</span>
                  </button>
                </div>

                {/* Scheduled Slot Picker if selected */}
                {bookingMode === 'scheduled' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-emerald-200 space-y-2 mt-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {availableDates.slice(0, 4).map((item) => (
                        <button
                          key={item.index}
                          type="button"
                          onClick={() => {
                            setSelectedDateIndex(item.index);
                            setScheduledSlot(`${item.fullLabel}, ${selectedTimeSlot}`);
                          }}
                          className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-center transition-all ${
                            selectedDateIndex === item.index
                              ? 'bg-slate-900 text-white font-bold'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span className="block text-[9px] uppercase">{item.dayName}</span>
                          <span className="block text-[11px] font-bold">{item.formattedDate}</span>
                        </button>
                      ))}
                    </div>

                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => {
                        setSelectedTimeSlot(e.target.value);
                        setScheduledSlot(`${availableDates[selectedDateIndex]?.fullLabel}, ${e.target.value}`);
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      {timeSlots.map(s => (
                        <option key={s.id} value={s.time}>{s.period}: {s.time}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 5. PAYMENT MODE (DEFAULT: PAY AFTER WORK) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 block">
                  Payment Mode:
                </label>

                {/* Option: Pay After Work (Default) */}
                <div
                  onClick={() => setSelectedPaymentMethod('pay_after_work')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPaymentMethod === 'pay_after_work'
                      ? 'border-2 border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">Pay After Work</span>
                          <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full">
                            ZERO ADVANCE
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          Pay the partner via Cash or UPI (GPay/PhonePe) once the service is completed.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedPaymentMethod === 'pay_after_work' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                    }`}>
                      {selectedPaymentMethod === 'pay_after_work' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Option: Pay Online via UPI now */}
                <div
                  onClick={() => setSelectedPaymentMethod('upi_online')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPaymentMethod === 'upi_online'
                      ? 'border-2 border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs">UPI / Online Prepay (GPay, PhonePe, Paytm)</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          100% refundable if cancelled before arrival.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedPaymentMethod === 'upi_online' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                    }`}>
                      {selectedPaymentMethod === 'upi_online' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Confirm Button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              {selectedPaymentMethod === 'pay_after_work' ? (
                <button
                  disabled={isProcessingBooking}
                  onClick={() => handleConfirmOrder('pay_after_work', 'pending')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98] text-white font-black rounded-2xl text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingBooking ? (
                    <span className="animate-pulse">Confirming Booking...</span>
                  ) : (
                    <>
                      <span>Book Now • Pay ₹{totalAmountToPay} After Service</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled={isProcessingBooking}
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black rounded-2xl text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingBooking ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>Pay ₹{totalAmountToPay} Online via UPI</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
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
                      <h4 className="font-bold text-slate-900 text-xs">
                        {trackingBooking.professional_name?.replace(/\s*\([★\d\.\s]+\)/g, '') || 'Assigned Partner'}
                      </h4>
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

              {/* WhatsApp Confirmation & Support Card */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">WhatsApp Updates & Support</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">+91 95701 51834 Helpline</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                    ⚡ Instant
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Get order ID, assigned partner details, 4-digit start OTP, and live tracking map directly on WhatsApp.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openWhatsAppToSupport(trackingBooking)}
                    className="py-2.5 px-2 bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1caa52] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Chat on WhatsApp</span>
                  </button>
                  <button
                    onClick={() => openWhatsAppBookingShare(trackingBooking)}
                    className="py-2.5 px-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
                  >
                    <span>📤 Share Details</span>
                  </button>
                </div>
              </div>

              {/* Optional Developer Dispatch Simulation Controls (Hidden by default) */}
              <div className="pt-1 text-center">
                <details className="text-[10px] text-slate-400 cursor-pointer">
                  <summary className="hover:text-slate-600">Dev Tools: Simulation Controls</summary>
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl mt-1.5 text-left">
                    <span className="text-[10px] font-bold text-amber-800 block uppercase mb-1">
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
                </details>
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
                  Active in Greater Noida & NCR Launch (4)
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
