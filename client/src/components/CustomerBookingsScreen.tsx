import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Phone, 
  ShieldCheck, 
  Star, 
  Receipt, 
  RotateCcw, 
  X, 
  Plus, 
  ArrowRight, 
  ArrowLeft,
  Wrench, 
  Zap, 
  HeartHandshake, 
  Headphones, 
  Timer, 
  Info,
  CalendarCheck,
  Check,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Booking, ServiceCategory } from '../types';

interface CustomerBookingsScreenProps {
  bookings: Booking[];
  categories: ServiceCategory[];
  onNavigateTab: (tab: 'home' | 'bookings' | 'support' | 'profile') => void;
  onTrackBooking: (booking: Booking) => void;
  onReviewBooking: (booking: Booking) => void;
  onBookCategory: (category: ServiceCategory) => void;
  onRefreshBookings?: () => void;
  activeCityZone?: string;
}

export const CustomerBookingsScreen: React.FC<CustomerBookingsScreenProps> = ({
  bookings,
  categories,
  onNavigateTab,
  onTrackBooking,
  onReviewBooking,
  onBookCategory,
  onRefreshBookings,
  activeCityZone
}) => {
  // Calendar date strip state
  const [selectedDate, setSelectedDate] = useState<string>('all'); // 'all' or 'YYYY-MM-DD'
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [showFullMonthGrid, setShowFullMonthGrid] = useState<boolean>(false);

  // Modals state
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('Morning (8:00 AM - 11:00 AM)');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Plans changed');

  // Handle hardware back button for modals
  useEffect(() => {
    const handleModalBack = (e: Event) => {
      if (selectedReceiptBooking) {
        setSelectedReceiptBooking(null);
        e.preventDefault();
        return;
      }
      if (reschedulingBooking) {
        setReschedulingBooking(null);
        e.preventDefault();
        return;
      }
      if (cancellingBooking) {
        setCancellingBooking(null);
        e.preventDefault();
        return;
      }
    };
    window.addEventListener('quickserve:hardwareback', handleModalBack);
    return () => window.removeEventListener('quickserve:hardwareback', handleModalBack);
  }, [selectedReceiptBooking, reschedulingBooking, cancellingBooking]);

  // Generate 14-day calendar strip starting today
  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      // Check if any booking falls on this date
      const hasBooking = bookings.some(b => {
        const bDate = (b.scheduled_at || b.created_at || '').split('T')[0];
        return bDate === isoStr;
      });

      dates.push({
        isoStr,
        dayName,
        dayNum,
        monthShort,
        hasBooking,
        isToday: i === 0
      });
    }
    return dates;
  }, [bookings]);

  // Counts for tabs
  const activeCount = useMemo(() => {
    return bookings.filter(b => ['requested', 'searching', 'confirmed', 'on_the_way', 'started'].includes(b.status)).length;
  }, [bookings]);

  const upcomingCount = useMemo(() => {
    return bookings.filter(b => b.booking_type === 'scheduled' || b.booking_mode === 'scheduled').length;
  }, [bookings]);

  const completedCount = useMemo(() => {
    return bookings.filter(b => b.status === 'completed').length;
  }, [bookings]);

  // Filtered bookings list
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Status Filter
      if (activeStatusTab === 'active') {
        if (!['requested', 'searching', 'confirmed', 'on_the_way', 'started'].includes(b.status)) return false;
      } else if (activeStatusTab === 'upcoming') {
        if (b.status !== 'confirmed' && b.booking_type !== 'scheduled' && b.booking_mode !== 'scheduled') return false;
      } else if (activeStatusTab === 'completed') {
        if (b.status !== 'completed') return false;
      }

      // 2. Date Filter (if specific date picked on calendar)
      if (selectedDate !== 'all') {
        const bDate = (b.scheduled_at || b.created_at || '').split('T')[0];
        if (bDate !== selectedDate) return false;
      }

      return true;
    });
  }, [bookings, activeStatusTab, selectedDate]);

  // Popular chores for empty state fast booking
  const popularChores = [
    {
      id: 'chore-pop-maid',
      title: '1-Hour House Maid Helper',
      desc: 'Dusting, floor sweeping & light kitchen help',
      price: 199,
      duration: '60 mins',
      categorySlug: 'maid-helper',
      badge: '15-Min Arrival ⚡',
      icon: '🧹'
    },
    {
      id: 'chore-pop-dishes',
      title: 'Utensils & Bartan Wash',
      desc: 'Sparkle scrub for lunch & dinner vessels',
      price: 99,
      duration: '30 mins',
      categorySlug: 'maid-helper',
      badge: 'Popular',
      icon: '🧽'
    },
    {
      id: 'chore-pop-bath',
      title: 'Bathroom Deep Clean',
      desc: 'Tile de-scaling, sanitization & tap shine',
      price: 199,
      duration: '45 mins',
      categorySlug: 'maid-helper',
      badge: 'Most Booked',
      icon: '🚿'
    },
    {
      id: 'chore-pop-elec',
      title: 'Electrician Quick Fix',
      desc: 'Fan regulator, switchboard, MCB repair',
      price: 149,
      duration: '30 mins',
      categorySlug: 'electrician',
      badge: 'Certified Pro 🛡️',
      icon: '⚡'
    }
  ];

  const handleLaunchChoreBooking = (catSlug: string) => {
    const targetCat = categories.find(c => c.slug === catSlug) || categories[0];
    if (targetCat) {
      onBookCategory(targetCat);
    } else {
      onNavigateTab('home');
    }
  };

  const cleanPartnerName = (name?: string) => {
    if (!name) return 'Assigned Partner';
    return name.replace(/\s*\([★\d\.\s]+\)/g, '').trim();
  };

  return (
    <div className="w-full bg-slate-50/60 pb-36 font-sans text-slate-900 select-none">
      
      {/* 1. TOP HEADER */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('home')}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors active:scale-95"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <span>My Bookings</span>
              {bookings.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {bookings.length}
                </span>
              )}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Schedule, live tracking & service history
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('support')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-all flex items-center gap-1.5 text-xs font-bold"
          title="Need Help with a Booking?"
        >
          <Headphones className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Help</span>
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">

        {/* 2. INTERACTIVE SERVICE CALENDAR (As specifically requested by user) */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 leading-none">
                  Service Calendar
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {selectedDate !== 'all' && (
                <button
                  onClick={() => setSelectedDate('all')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  View All Dates
                </button>
              )}
              <button
                onClick={() => setShowFullMonthGrid(!showFullMonthGrid)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Toggle Full Month"
              >
                <CalendarCheck className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 14-Day Date Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
            {/* 'All' date chip */}
            <button
              onClick={() => setSelectedDate('all')}
              className={`flex-shrink-0 w-14 py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                selectedDate === 'all'
                  ? 'bg-slate-900 text-white shadow-md scale-102 ring-2 ring-slate-900/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">Filter</span>
              <span className="text-xs font-black mt-0.5">All</span>
              <span className="text-[8px] opacity-60">Visits</span>
            </button>

            {calendarDates.map((item) => {
              const isSelected = selectedDate === item.isoStr;
              return (
                <button
                  key={item.isoStr}
                  onClick={() => setSelectedDate(item.isoStr)}
                  className={`flex-shrink-0 w-12 py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md scale-102 ring-2 ring-emerald-500/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {item.dayName}
                  </span>
                  <span className="text-sm font-black mt-0.5 leading-tight">
                    {item.dayNum}
                  </span>
                  <span className={`text-[8px] font-medium ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {item.monthShort}
                  </span>

                  {/* Indicator Dot for Scheduled/Active Bookings */}
                  {item.hasBooking && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-white"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Notice if date selected */}
          {selectedDate !== 'all' && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-medium">
                Viewing schedule for: <strong className="text-slate-900">{selectedDate}</strong>
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">
                {filteredBookings.length} {filteredBookings.length === 1 ? 'Visit' : 'Visits'}
              </span>
            </div>
          )}
        </div>

        {/* 3. STATUS FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setActiveStatusTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeStatusTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <span>All Visits</span>
            <span className="text-[10px] opacity-75 font-mono">({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveStatusTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeStatusTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {activeCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            <span>Live & Active</span>
            {activeCount > 0 && (
              <span className="text-[10px] bg-white/20 px-1 rounded font-mono">{activeCount}</span>
            )}
          </button>

          <button
            onClick={() => setActiveStatusTab('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeStatusTab === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Scheduled</span>
            {upcomingCount > 0 && (
              <span className="text-[10px] bg-white/20 px-1 rounded font-mono">{upcomingCount}</span>
            )}
          </button>

          <button
            onClick={() => setActiveStatusTab('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeStatusTab === 'completed'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
            {completedCount > 0 && (
              <span className="text-[10px] opacity-75 font-mono">({completedCount})</span>
            )}
          </button>
        </div>

        {/* 4. MAIN BOOKINGS LIST OR RICH EMPTY STATE */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-3.5">
            {filteredBookings.map((b) => {
              const isOngoing = ['confirmed', 'on_the_way', 'started'].includes(b.status);
              const isFinished = b.status === 'completed';
              const isCancelled = b.status === 'cancelled';

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-subtle space-y-3.5 hover:border-slate-300 transition-all"
                >
                  {/* Card Header: Title, Order Ref, Status Badge */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {b.booking_reference}
                        </span>
                        {b.booking_mode === 'instant' ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold">
                            ⚡ 15-Min Instant
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-800 font-bold">
                            📅 Scheduled
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-slate-900 text-sm mt-0.5">
                        {b.service_title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {b.sub_service_selected || 'Domestic chores visit'}
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                      b.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'on_the_way'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : b.status === 'started'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : b.status === 'cancelled'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
                      <span>{b.status.replace(/_/g, ' ')}</span>
                    </span>
                  </div>

                  {/* Professional / Partner Details */}
                  <div className="flex items-center justify-between bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {cleanPartnerName(b.professional_name).charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-slate-900 text-xs">
                            {cleanPartnerName(b.professional_name)}
                          </h5>
                          <span className="text-[10px] text-amber-600 font-bold flex items-center">
                            ★ {b.professional_rating || 4.9}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          Police & Aadhaar Verified
                        </span>
                      </div>
                    </div>

                    {b.professional_phone && isOngoing && (
                      <a
                        href={`tel:${b.professional_phone}`}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-colors"
                        title="Call Partner"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Call</span>
                      </a>
                    )}
                  </div>

                  {/* High-Security Start OTP Banner (Only shown while waiting or on the way) */}
                  {isOngoing && b.service_start_otp && (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 block">
                          Doorstep Security Start OTP
                        </span>
                        <p className="text-[10px] text-emerald-700">
                          Share with professional only upon arrival
                        </p>
                      </div>
                      <div className="px-3 py-1.5 bg-emerald-600 text-white font-mono font-black text-base rounded-xl tracking-widest shadow-sm">
                        {b.service_start_otp}
                      </div>
                    </div>
                  )}

                  {/* Chores Details & Doorstep Address */}
                  <div className="text-xs space-y-1.5 text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{b.customer_address || activeCityZone || 'Sector 18, Noida'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">Total Paid (UPI)</span>
                      <span className="font-black text-slate-900 text-sm">₹{b.total_amount}</span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    {isOngoing ? (
                      <button
                        onClick={() => onTrackBooking(b)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                      >
                        <Timer className="w-4 h-4 animate-spin" />
                        <span>Track Live Status →</span>
                      </button>
                    ) : isFinished ? (
                      <>
                        <button
                          onClick={() => setSelectedReceiptBooking(b)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-600" />
                          <span>Receipt</span>
                        </button>

                        {!b.review_rating ? (
                          <button
                            onClick={() => onReviewBooking(b)}
                            className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            <span>Rate</span>
                          </button>
                        ) : null}

                        <button
                          onClick={() => {
                            const cat = categories.find(c => c.id === b.service_id) || categories[0];
                            if (cat) onBookCategory(cat);
                          }}
                          className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Book Again</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          const cat = categories.find(c => c.id === b.service_id) || categories[0];
                          if (cat) onBookCategory(cat);
                        }}
                        className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
                      >
                        Re-book Service ↻
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* 5. HIGH-VALUE EMPTY STATE (Fixes the blank screen in user's screenshot)    */
          /* ========================================================================= */
          <div className="space-y-4 animate-in fade-in">
            {/* Empty State Hero Banner */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 text-center shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CalendarIcon className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {selectedDate === 'all' 
                    ? 'No Bookings Scheduled Yet' 
                    : `No Visits on ${selectedDate}`}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Book a police-verified domestic helper in 15 minutes or schedule a future date using the calendar above.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab('home')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Explore Services & Book in 15 Min</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Tap Booking Shortcuts ("Popular Chores in Your Locality") */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-xs">
                    Popular 15-Minute Chores
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Instant dispatch from {activeCityZone || 'Sector 18 Hub'}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Flat Rates
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {popularChores.map((chore) => (
                  <div
                    key={chore.id}
                    onClick={() => handleLaunchChoreBooking(chore.categorySlug)}
                    className="p-3 rounded-2xl border border-slate-200/70 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{chore.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">
                            {chore.title}
                          </h5>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {chore.duration} • ₹{chore.price}
                        </span>
                      </div>
                    </div>

                    <button className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 flex items-center justify-center transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Daily/Weekly Recurring Help Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-4.5 shadow-md relative overflow-hidden space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  SAVE 20% MONTHLY
                </span>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <span>★</span> Daily Recurring Help
                </span>
              </div>

              <div>
                <h4 className="font-black text-sm text-white">
                  Need a Daily Maid, Cook or Caretaker?
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Lock in the same police-verified helper at your fixed morning or evening time. Free replacement guarantee if your helper takes leave.
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('home')}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Setup Daily Schedule</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* QuickServe 4-Point Assurances */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-4 space-y-2.5 text-xs">
              <h5 className="font-bold text-slate-900 text-xs mb-1">QuickServe Guarantee On Every Booking</h5>
              
              <div className="flex items-center gap-2.5 text-slate-600">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                  ⚡
                </div>
                <span>15-Minute Guaranteed Doorstep Arrival</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-600">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                  🛡️
                </div>
                <span>100% Police & Aadhaar Verified Local Technicians</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-600">
                <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                  💰
                </div>
                <span>Zero Cancellation Fee before partner arrival with instant refund</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ITEMISED TAX RECEIPT / INVOICE                                      */}
      {/* ========================================================================= */}
      {selectedReceiptBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in p-0 sm:p-4">
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Tax Invoice & Receipt</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedReceiptBooking.booking_reference}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReceiptBooking(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Body */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <strong className="text-slate-900">{selectedReceiptBooking.customer_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Professional:</span>
                  <strong className="text-slate-900">{selectedReceiptBooking.professional_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Service:</span>
                  <strong className="text-slate-900">{selectedReceiptBooking.service_title}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <strong className="text-emerald-700 font-mono uppercase">UPI Auto-Settled</strong>
                </div>
              </div>

              {/* Itemized Chores */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Cost Breakdown
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Base Chore Visit</span>
                  <span>₹{selectedReceiptBooking.base_charge || selectedReceiptBooking.total_amount - 45}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform & Assurance Fee</span>
                  <span>₹{selectedReceiptBooking.platform_fee || 45}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18% included)</span>
                  <span>₹0.00</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Amount Paid</span>
                  <span className="text-emerald-700">₹{selectedReceiptBooking.total_amount}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-[11px] font-medium text-center">
                ✓ Payment Verified & Secured via Razorpay UPI Platform
              </div>
            </div>

            <button
              onClick={() => {
                alert('Tax Invoice downloaded to device.');
                setSelectedReceiptBooking(null);
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
