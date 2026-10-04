import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  TrendingUp, 
  AlertCircle,
  CreditCard,
  MessageSquare,
  User,
  Power,
  Video,
  Building2,
  CheckSquare,
  Square
} from 'lucide-react';
import { Professional, Booking } from '../types';
import { updateBookingStatus, verifyBookingOtp, withdrawEarnings, toggleChoreCompletion } from '../api';

interface ProfessionalAppProps {
  professionals: Professional[];
  activeBookings: Booking[];
  onRefreshBookings: () => void;
  lang: 'en' | 'hi';
  onBackToCustomerApp?: () => void;
}

export const ProfessionalApp: React.FC<ProfessionalAppProps> = ({
  professionals,
  activeBookings,
  onRefreshBookings,
  lang,
  onBackToCustomerApp
}) => {
  // Select active professional persona (default: Rahul Kumar - Plumber)
  const [selectedProId, setSelectedProId] = useState<string>(professionals[0]?.id || 'pro-rahul');
  const pro = professionals.find(p => p.id === selectedProId) || professionals[0];

  const [activeTab, setActiveTab] = useState<'home' | 'jobs' | 'earnings' | 'messages' | 'profile'>('home');
  const [isOnline, setIsOnline] = useState<boolean>(pro?.is_available ?? true);
  const [startOtpInput, setStartOtpInput] = useState('');
  const [completeOtpInput, setCompleteOtpInput] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const proBookings = activeBookings.filter(b => b.professional_id === pro.id);
  const ongoingBooking = proBookings.find(b => ['confirmed', 'professional_assigned', 'on_the_way', 'arrived', 'started'].includes(b.status));

  // Ticking timer state for live countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingSeconds = (booking: Booking) => {
    const totalSecs = (booking.service_duration_mins || 45) * 60;
    const startedAt = booking.service_started_at ? new Date(booking.service_started_at).getTime() : now;
    const elapsed = Math.floor((now - startedAt) / 1000);
    return Math.max(0, totalSecs - elapsed);
  };

  const handleToggleChore = async (bookingId: string, choreId: string) => {
    try {
      await toggleChoreCompletion(bookingId, choreId);
      onRefreshBookings();
    } catch (err) {
      console.error('Error toggling chore:', err);
    }
  };

  // Accept a new incoming request / start trip
  const handleAcceptJob = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'on_the_way');
    onRefreshBookings();
  };

  const handleArrived = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'arrived');
    onRefreshBookings();
  };

  const handleDeclineJob = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'searching');
    onRefreshBookings();
  };

  const handleStartService = async (bookingId: string) => {
    if (!startOtpInput.trim()) {
      alert('Please enter customer start OTP (e.g. 4821 or 1234)');
      return;
    }
    try {
      await verifyBookingOtp(bookingId, startOtpInput.trim(), 'start');
      setStartOtpInput('');
      onRefreshBookings();
    } catch (err: any) {
      alert(err.message || 'Incorrect Start OTP');
    }
  };

  const handleCompleteService = async (bookingId: string) => {
    if (!completeOtpInput.trim()) {
      alert('Please enter customer completion OTP (e.g. 7392 or 1234)');
      return;
    }
    try {
      await verifyBookingOtp(bookingId, completeOtpInput.trim(), 'complete');
      setCompleteOtpInput('');
      onRefreshBookings();
      alert('Job marked completed! Earnings credited to your QuickServe wallet.');
    } catch (err: any) {
      alert(err.message || 'Incorrect Completion OTP');
    }
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const res = await withdrawEarnings(pro.id);
      alert(res.message || 'Withdrawal initiated');
      onRefreshBookings();
    } catch (err) {
      alert('Withdrawal processed.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 text-white min-h-[90vh] pb-24 shadow-2xl rounded-3xl overflow-hidden border border-slate-800 relative flex flex-col justify-between font-sans">
      <div>
        {/* Top Header & Persona Selector */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950">
          {/* Quick Return to Customer App */}
          {onBackToCustomerApp && (
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <button
                onClick={onBackToCustomerApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95 border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Back to Customer App</span>
              </button>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                  Partner Portal
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            {/* Pro Switcher for demo ease */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Partner View</span>
              <select
                value={selectedProId}
                onChange={(e) => setSelectedProId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-brand-300 font-bold px-2 py-1 rounded-lg focus:outline-none"
              >
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.service_name})</option>
                ))}
              </select>
            </div>

            {/* Online / Offline Toggle */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={pro.avatar} 
                alt={pro.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-brand-500 shadow-md"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-base text-white">{pro.name}</h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                    🟢 Verified
                  </span>
                </div>
                <span className="text-xs text-slate-400">{pro.service_name} • {pro.zone_name.split(',')[0]}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-amber-400 flex items-center justify-end gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {pro.rating}
              </span>
              <span className="text-[10px] text-slate-500">{pro.completed_jobs_count} jobs</span>
            </div>
          </div>
        </div>

        {/* TAB 1: HOME & LIVE REQUESTS */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-4">
            {/* Quick Earnings Strip (Section 16) */}
            <div className="grid grid-cols-3 gap-2 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block">Today's Earn</span>
                <span className="text-sm font-bold text-emerald-400">₹{pro.today_earnings}</span>
              </div>
              <div className="text-center border-x border-slate-700">
                <span className="text-[10px] text-slate-400 block">Completed</span>
                <span className="text-sm font-bold text-white">7 Jobs</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block">Rating</span>
                <span className="text-sm font-bold text-amber-400">{pro.rating} ⭐</span>
              </div>
            </div>

            {/* ACTIVE ONGOING JOB CARD (IF ANY) */}
            {ongoingBooking ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-950 to-slate-800 border-2 border-brand-500 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-amber-400 text-slate-950">
                    {ongoingBooking.status === 'confirmed' || ongoingBooking.status === 'professional_assigned'
                      ? 'New Assigned Job'
                      : ongoingBooking.status === 'on_the_way'
                      ? 'En Route / Navigating'
                      : ongoingBooking.status === 'arrived'
                      ? 'Arrived at Doorstep'
                      : 'Work In Progress'}
                  </span>
                  <span className="text-xs font-mono text-brand-300">{ongoingBooking.booking_reference}</span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm">{ongoingBooking.sub_service_selected}</h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                    <span>{ongoingBooking.customer_address}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Customer: {ongoingBooking.customer_name} ({ongoingBooking.customer_phone})
                  </p>
                </div>

                {/* Hub, Booking Mode & Bodycam Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ongoingBooking.hub_name && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                      <Building2 className="w-3 h-3" />
                      {ongoingBooking.hub_name}
                    </span>
                  )}
                  {ongoingBooking.booking_mode && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                      {ongoingBooking.booking_mode === 'instant' ? '⚡ 15-Min Instant' : ongoingBooking.booking_mode === 'recurring' ? `🔁 Recurring (${ongoingBooking.recurring_cadence || 'Daily'})` : '📅 Scheduled Slot'}
                    </span>
                  )}
                  {ongoingBooking.is_verified_recording && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold animate-pulse">
                      <Video className="w-3 h-3" />
                      QuickServe Verified Cam Active
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Guaranteed Payout</span>
                    <span className="text-sm font-bold text-emerald-400">₹{ongoingBooking.base_charge}</span>
                  </div>
                  <a 
                    href={`tel:${ongoingBooking.customer_phone}`}
                    className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Phone className="w-3.5 h-3.5 text-brand-400" />
                    <span>Call Customer</span>
                  </a>
                </div>

                {/* Job Step Verification Actions */}
                {(ongoingBooking.status === 'confirmed' || ongoingBooking.status === 'professional_assigned') && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleAcceptJob(ongoingBooking.id)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                    >
                      <Navigation className="w-4 h-4 text-slate-950" />
                      <span>Start Trip (On The Way) →</span>
                    </button>
                  </div>
                )}

                {ongoingBooking.status === 'on_the_way' && (
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handleArrived(ongoingBooking.id)}
                      className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                    >
                      <MapPin className="w-4 h-4 text-slate-950" />
                      <span>I Have Arrived at Doorstep</span>
                    </button>
                    <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-700/80">
                      <label className="text-[11px] text-slate-300 font-semibold block mb-1.5">
                        Or enter customer Start OTP directly:
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          maxLength={4}
                          placeholder="4-digit OTP"
                          value={startOtpInput}
                          onChange={(e) => setStartOtpInput(e.target.value)}
                          className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-base tracking-widest text-amber-300 font-bold"
                        />
                        <button
                          onClick={() => handleStartService(ongoingBooking.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                        >
                          Verify & Start
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {ongoingBooking.status === 'arrived' && (
                  <div className="pt-2 space-y-2">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center">
                      <span className="text-emerald-400 text-xs font-bold block">✓ You have arrived at customer doorstep</span>
                      <span className="text-[11px] text-slate-300">Ask the customer for the 4-digit Start OTP to begin service.</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        maxLength={4}
                        placeholder="Enter Start OTP"
                        value={startOtpInput}
                        onChange={(e) => setStartOtpInput(e.target.value)}
                        className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-base tracking-widest text-amber-300 font-bold"
                      />
                      <button
                        onClick={() => handleStartService(ongoingBooking.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                      >
                        Verify & Start Work
                      </button>
                    </div>
                  </div>
                )}

                {ongoingBooking.status === 'started' && (
                  <div className="pt-2 space-y-3">
                    {/* Live Ticking Service Timer */}
                    {(() => {
                      const remSecs = getRemainingSeconds(ongoingBooking);
                      const mins = Math.floor(remSecs / 60);
                      const secs = remSecs % 60;
                      return (
                        <div className="p-3 bg-slate-900/90 rounded-2xl border border-brand-500/50 flex items-center justify-between shadow-inner">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-slate-200">Active Service Clock</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-base font-black text-brand-400 tracking-wider">
                              {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Total: {ongoingBooking.service_duration_mins || 45} mins</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Interactive Stacked Chores Checklist */}
                    {ongoingBooking.stacked_chores && ongoingBooking.stacked_chores.length > 0 && (
                      <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                          <span>
                            QuickServe Task Checklist ({ongoingBooking.stacked_chores.filter(c => c.is_completed ?? c.completed).length}/{ongoingBooking.stacked_chores.length})
                          </span>
                          <span className="text-[10px] text-brand-400">Tap to toggle</span>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {ongoingBooking.stacked_chores.map(chore => {
                            const isDone = chore.is_completed ?? chore.completed;
                            const choreTitle = chore.title || chore.name;
                            return (
                              <button
                                key={chore.id}
                                type="button"
                                onClick={() => handleToggleChore(ongoingBooking.id, chore.id)}
                                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                                  isDone
                                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isDone ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  )}
                                  <span className={`text-xs ${isDone ? 'line-through text-slate-400 font-medium' : 'font-semibold'}`}>
                                    {choreTitle}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                                  ⏱️ {chore.duration_mins}m
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Completion OTP */}
                    <div className="space-y-2 pt-2 border-t border-slate-700/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-slate-200 font-bold block">
                          Enter Customer Completion OTP (Demo OTP: {ongoingBooking.service_completion_otp})
                        </label>
                        <span className="text-[10px] text-emerald-400 font-bold">100% Quality Verified</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Ask the customer for the 4-digit Completion OTP after they inspect and approve the completed service.
                      </p>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          maxLength={4}
                          placeholder="4-digit End OTP"
                          value={completeOtpInput}
                          onChange={(e) => setCompleteOtpInput(e.target.value)}
                          className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-base tracking-widest text-emerald-300 font-bold"
                        />
                        <button
                          onClick={() => handleCompleteService(ongoingBooking.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 active:scale-95 transition-all shadow-md"
                        >
                          Complete & Collect ₹{ongoingBooking.base_charge}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* NEW INCOMING JOB REQUESTS FEED (Section 16) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>Available Requests in {pro.zone_name.split(',')[0]}</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">Live Radar</span>
              </div>

              {/* Live Unassigned Requests from activeBookings */}
              {activeBookings.filter(b => b.status === 'searching').map(b => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-800 border-2 border-brand-500 space-y-3 shadow-premium animate-pulse">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {b.sub_service_selected}
                    </span>
                    <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-bold">
                      {b.hub_name || 'Indiranagar Hub 01'} • 15m arrival
                    </span>
                  </div>

                  {b.stacked_chores && b.stacked_chores.length > 0 && (
                    <div className="p-2 bg-slate-900/80 rounded-xl text-[11px] text-slate-300">
                      <span className="text-brand-400 font-bold block mb-1">
                        📦 QuickServe Multi-Chore Stack ({b.stacked_chores.length} tasks • {b.service_duration_mins || 45} mins):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {b.stacked_chores.map(c => (
                          <span key={c.id} className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">
                            • {c.title || c.name} ({c.duration_mins}m)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{b.customer_address}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Guaranteed Payout</span>
                      <span className="text-sm font-bold text-emerald-400">₹{b.base_charge}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeclineJob(b.id)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptJob(b.id)}
                        className="px-4 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 rounded-xl text-xs font-bold shadow-md"
                      >
                        Accept Job →
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Sample Incoming Request */}
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3 shadow-premium">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{pro.service_name} Request</span>
                  <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-bold">
                    Right Now • 2.4 km away
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-white">Tap & flush valve repair in Pari Chowk</p>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>Sector Alpha 1, Pari Chowk, Greater Noida</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Guaranteed Payout</span>
                    <span className="text-sm font-bold text-emerald-400">₹449</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => alert('Request skipped')}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => alert('New request accepted! Heading to customer location.')}
                      className="px-4 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 rounded-xl text-xs font-bold shadow-md"
                    >
                      Accept Job
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TRUST & COMPLIANCE BADGE STRIP */}
            <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/80 text-xs space-y-2">
              <span className="font-bold text-slate-300 text-[11px] block">Verified Badges on your Public Profile:</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Aadhaar Identity Verified</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Police Clearance Checked</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Skill Test Certified</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>QuickServe Insured</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JOBS HISTORY */}
        {activeTab === 'jobs' && (
          <div className="p-4 space-y-3">
            <h3 className="font-bold text-white text-sm">Assigned & Completed Jobs</h3>
            {proBookings.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No assigned jobs yet.</p>
            ) : (
              proBookings.map(b => (
                <div key={b.id} className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{b.sub_service_selected}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                      {b.status}
                    </span>
                  </div>
                  <p className="text-slate-400">{b.customer_address}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700 text-[11px]">
                    <span className="text-slate-400">{b.customer_name}</span>
                    <span className="font-bold text-emerald-400">Earned: ₹{b.base_charge}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: EARNINGS & INSTANT UPI WITHDRAWAL (Section 17) */}
        {activeTab === 'earnings' && (
          <div className="p-4 space-y-4 text-xs">
            <div className="p-5 bg-gradient-to-br from-emerald-950 to-slate-900 rounded-3xl border border-emerald-500/30 text-center space-y-2">
              <span className="text-xs text-emerald-300 font-medium">Available Payout Balance</span>
              <h2 className="text-3xl font-extrabold text-white">₹{pro.available_balance || 3450}</h2>
              <p className="text-[10px] text-slate-400">Directly withdrawable to linked UPI: <strong>{pro.upi_id}</strong></p>

              <button
                disabled={isWithdrawing}
                onClick={handleWithdraw}
                className="w-full mt-3 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <TrendingUp className="w-4 h-4 text-slate-950" />
                <span>Instant Withdraw to UPI</span>
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Earnings Breakdown</h4>
              <div className="p-3 bg-slate-800 rounded-xl flex justify-between">
                <span className="text-slate-400">Today's Earnings</span>
                <span className="font-bold text-white">₹{pro.today_earnings || 1850}</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl flex justify-between">
                <span className="text-slate-400">This Week (Mon-Sun)</span>
                <span className="font-bold text-white">₹{pro.weekly_earnings || 11200}</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl flex justify-between">
                <span className="text-slate-400">This Month</span>
                <span className="font-bold text-white">₹{pro.monthly_earnings || 44800}</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-xl flex justify-between">
                <span className="text-slate-400">Platform Commission (10%)</span>
                <span className="text-slate-400 font-mono">Deducted transparently</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="p-4 space-y-3 text-xs">
            <h3 className="font-bold text-white text-sm">Customer & Dispatch Chat</h3>
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                PV
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-white">Priya Verma</span>
                  <span className="text-[10px] text-slate-400">10:48 AM</span>
                </div>
                <p className="text-slate-400 text-[11px] truncate">Please bring replacement tap washer as well.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE & VERIFICATION STATUS */}
        {activeTab === 'profile' && (
          <div className="p-4 space-y-4 text-xs">
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
              <h4 className="font-bold text-white text-sm">Verification Dossier</h4>
              <p className="text-slate-400 text-[11px]">
                Maintained securely according to Indian Ministry of Electronics & IT guidelines.
              </p>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-slate-300">
                  <span>Aadhaar Verification:</span>
                  <span className="text-emerald-400 font-bold">✓ Approved</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Police Verification:</span>
                  <span className="text-emerald-400 font-bold">✓ Certified</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Trade Skill Test:</span>
                  <span className="text-emerald-400 font-bold">✓ Passed (Level 3)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Operating Locality:</span>
                  <span className="text-white">{pro.zone_name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION FOR PROFESSIONAL */}
      <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-6 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-20">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-brand-400' : 'hover:text-white'}`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('jobs')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'jobs' ? 'text-brand-400' : 'hover:text-white'}`}
        >
          <Clock className="w-4 h-4" />
          <span>Jobs</span>
        </button>

        <button 
          onClick={() => setActiveTab('earnings')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'earnings' ? 'text-brand-400' : 'hover:text-white'}`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Earnings</span>
        </button>

        <button 
          onClick={() => setActiveTab('messages')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'messages' ? 'text-brand-400' : 'hover:text-white'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Messages</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-brand-400' : 'hover:text-white'}`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
};
