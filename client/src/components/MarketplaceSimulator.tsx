import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Smartphone, 
  Briefcase, 
  ShieldCheck, 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  TrendingUp, 
  Layers, 
  DollarSign,
  Sparkles
} from 'lucide-react';
import { ServiceCategory, Professional, Booking } from '../types';

interface MarketplaceSimulatorProps {
  categories: ServiceCategory[];
  professionals: Professional[];
  onRefreshData: () => void;
  lang: 'en' | 'hi';
}

export const MarketplaceSimulator: React.FC<MarketplaceSimulatorProps> = ({
  categories,
  professionals,
  onRefreshData,
  lang
}) => {
  // Stepper state: 0 = Idle, 1 = Booked/Searching, 2 = Assigned & Accepted, 3 = On The Way, 4 = Started (OTP Verified), 5 = Completed & Paid
  const [simStep, setSimStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Simulated Pro state
  const pro = professionals.find(p => p.id === 'pro-rahul') || professionals[0];
  const [proBalance, setProBalance] = useState<number>(pro.available_balance || 3450);
  const [proTodayEarnings, setProTodayEarnings] = useState<number>(pro.today_earnings || 1850);
  const [proJobsCount, setProJobsCount] = useState<number>(pro.completed_jobs_count || 1240);

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setSimStep(prev => {
          if (prev >= 5) {
            setIsAutoPlaying(false);
            return 5;
          }
          return prev + 1;
        });
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleNextStep = () => {
    if (simStep < 5) {
      const next = simStep + 1;
      setSimStep(next);
      if (next === 5) {
        setProBalance(prev => prev + 898);
        setProTodayEarnings(prev => prev + 898);
        setProJobsCount(prev => prev + 1);
      }
    }
  };

  const handleReset = () => {
    setSimStep(0);
    setIsAutoPlaying(false);
    setProBalance(pro.available_balance || 3450);
    setProTodayEarnings(pro.today_earnings || 1850);
    setProJobsCount(pro.completed_jobs_count || 1240);
  };

  const startAutoRun = () => {
    handleReset();
    setIsAutoPlaying(true);
    setSimStep(1);
  };

  const stepsGuide = [
    { s: 0, title: 'Idle Marketplace', desc: 'Customer and Partner ready in Indiranagar cluster.' },
    { s: 1, title: 'Step 1: QuickServe Multi-Chore Stacking', desc: 'Ananya Sharma stacks 3 chores: Bathroom Clean + Utensils + Mopping (75 mins) with 15-min Instant delivery from Indiranagar Hub 01.' },
    { s: 2, title: 'Step 2: Partner Receives Stacked Job', desc: 'Rahul Kumar (⭐4.8 Partner) receives instant push alert with 3 stacked tasks and accepts.' },
    { s: 3, title: 'Step 3: Staged Hub Dispatch & Live Tracking', desc: 'Rahul dispatched from Indiranagar Hub 01 with uniform & equipment kit. Customer Start OTP: 4821.' },
    { s: 4, title: 'Step 4: Live Service Timer & Chore Checklist', desc: 'Start OTP 4821 verified! Live countdown clock ticks, QuickServe bodycam active, tasks marked complete.' },
    { s: 5, title: 'Step 5: Completion OTP Verified • 100% Cashless Paid', desc: 'Completion OTP 7392 verified. ₹898 credited to Rahul\'s wallet with 5★ review!' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Control Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                End-to-End Live Marketplace Simulator
              </span>
              <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
                Customer ↔ Pro ↔ Admin Sync
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {stepsGuide[simStep].title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {stepsGuide[simStep].desc}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={startAutoRun}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                isAutoPlaying 
                  ? 'bg-amber-500 text-slate-950' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isAutoPlaying ? 'Auto-Running (30s)...' : 'Auto-Run Scenario'}</span>
            </button>

            <button
              onClick={handleNextStep}
              disabled={simStep >= 5 || isAutoPlaying}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
              title="Reset Simulator"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Dots */}
        <div className="grid grid-cols-6 gap-2 text-center text-xs">
          {[
            '0. Idle Ready',
            '1. Chores Stacking',
            '2. Pro Accepts',
            '3. Hub Dispatch',
            '4. Live Clock & OTP',
            '5. Paid & Rated'
          ].map((label, idx) => (
            <div
              key={idx}
              onClick={() => { setIsAutoPlaying(false); setSimStep(idx); }}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                simStep === idx
                  ? 'bg-brand-600/20 border-brand-500 text-brand-300 font-bold'
                  : simStep > idx
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="block text-[11px] truncate">{label}</span>
            </div>
          ))}
        </div>

        {/* SIDE-BY-SIDE DUAL DEVICE PHONES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ========================================================= */}
          {/* DEVICE 1: CUSTOMER MOBILE APP (LEFT) */}
          {/* ========================================================= */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
              <Smartphone className="w-4 h-4 text-brand-400" />
              <span>Customer Screen (Ananya Sharma • Indiranagar)</span>
            </div>

            <div className="w-full max-w-[380px] rounded-[44px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-700 text-slate-900 overflow-hidden min-h-[640px] flex flex-col justify-between">
              <div className="bg-white rounded-[36px] overflow-hidden min-h-[620px] flex flex-col justify-between">
                
                {/* Customer App Top */}
                <div className="bg-white border-b border-slate-100 p-3 pt-4">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1.5">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      Indiranagar, Bengaluru
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      ⚡ 15 min arrival
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">QuickServe House Help</h3>
                  <p className="text-[10px] text-slate-400">Book trusted chores in minutes</p>
                </div>

                {/* Customer App Middle Content (Changes by Step) */}
                <div className="p-3 flex-1 flex flex-col justify-between text-xs space-y-3">
                  {simStep === 0 && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-100">QuickServe Standard</span>
                        <h4 className="font-bold text-xs">House help in 15 minutes</h4>
                        <p className="text-[10px] text-emerald-100 mt-0.5">Flat rates • 1 hr ₹199</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { title: 'Bathroom Cleaning', img: '/images/bathroom_clean_3d.jpg', price: 399 },
                          { title: 'Hourly bookings', img: '/images/hourly_bookings_3d.jpg', price: 199 },
                          { title: 'Fridge Cleaning', img: '/images/fridge_cleaning_3d.jpg', price: 299 },
                          { title: 'Utensils', img: '/images/utensils_3d.jpg', price: 249 },
                        ].map((s, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSimStep(1)}
                            className="bg-white rounded-xl border border-slate-200/80 p-1.5 cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between"
                          >
                            <div className="aspect-square w-full rounded-lg bg-slate-50 flex items-center justify-center p-1 mb-1">
                              <img src={s.img} alt={s.title} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-900 truncate">{s.title}</span>
                              <span className="text-[9px] text-emerald-700 font-bold">₹{s.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setSimStep(1)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Instant Book Chores (15 Min Dispatch)</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}

                  {simStep === 1 && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                        <span className="font-bold text-xs">Dispatching from Indiranagar Hub 01...</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>📦 QuickServe 3-Chore Stack</span>
                          <span className="text-brand-600 font-mono">75 Mins</span>
                        </div>
                        <p className="text-[11px] text-slate-600">• Bathroom Cleaning (35m) - ₹349</p>
                        <p className="text-[11px] text-slate-600">• Utensils & Sink (20m) - ₹249</p>
                        <p className="text-[11px] text-slate-600">• Floor Mopping (20m) - ₹299</p>
                        <div className="pt-1 border-t border-slate-200 flex justify-between text-[11px]">
                          <span className="text-emerald-700 font-semibold">Stack Discount (3+ Chores):</span>
                          <span className="text-emerald-700 font-bold">-₹99</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                          <span>Total Amount:</span>
                          <span className="text-emerald-600">₹898 (100% Cashless UPI)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>QuickServe Verified Bodycam & 15-min SLA Active</span>
                      </div>
                    </div>
                  )}

                  {simStep === 2 && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs">Rahul Kumar Accepted Your Booking!</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                        <img 
                          src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80" 
                          alt="Rahul" 
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">Rahul Kumar</h4>
                          <span className="text-[10px] text-emerald-700 font-semibold">✓ Aadhaar & Skill Verified</span>
                          <p className="text-[10px] text-slate-500">Indiranagar Hub 01 • 4.8★ • 1,240 jobs</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {simStep === 3 && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">Status: Dispatched • On The Way</span>
                        <h4 className="font-extrabold text-slate-900 text-sm">Rahul arriving in ~7 mins 🛵</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Dispatched from Indiranagar Hub 01</p>
                      </div>

                      {/* OTP Box */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Share With Rahul Upon Arrival:</span>
                        <span className="text-xl font-mono font-black text-brand-600 tracking-widest block my-1">
                          4821
                        </span>
                        <span className="text-[9px] text-slate-500">Service Start Security OTP</span>
                      </div>

                      <div className="flex gap-2">
                        <a href="tel:+919845122891" className="flex-1 py-2 bg-slate-100 text-slate-800 rounded-xl text-center font-bold text-xs">
                          Call Rahul
                        </a>
                        <button className="flex-1 py-2 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs">
                          Chat
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 4 && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-blue-900 text-center">
                        <span className="font-bold text-xs block">Service In Progress ⚡</span>
                        <div className="font-mono text-base font-black text-blue-700 my-1">
                          ⏱️ 74:35 Remaining
                        </div>
                        <span className="text-[10px] text-blue-600 block">📹 QuickServe Verified Cam Active (48-hr Encrypted)</span>
                      </div>

                      {/* Stacked chore checklist */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-left">
                        <span className="font-bold text-slate-800 text-[11px] block">Live Chore Checklist (2/3 Done):</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="line-through">Bathroom Cleaning (35m)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="line-through">Utensils & Sink (20m)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span>Floor Sweeping & Mopping (20m) - In Progress</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border text-center">
                        <span className="text-[10px] text-slate-400 block">Completion OTP (Share when finished):</span>
                        <span className="text-xl font-mono font-bold text-slate-900 tracking-widest">
                          7392
                        </span>
                      </div>
                    </div>
                  )}

                  {simStep === 5 && (
                    <div className="space-y-3 text-center animate-in zoom-in-95">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">3 Chores Finished & Settled!</h4>
                      <p className="text-slate-500 text-[11px]">
                        ₹898 settled cashless. 75 minutes of spotless work delivered.
                      </p>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-center text-amber-400 gap-1 mb-1">
                          {'★'.repeat(5)}
                        </div>
                        <p className="text-[11px] text-slate-700 italic">
                          "Rahul finished all 3 chores in 75 minutes. The bathroom and kitchen are sparkling clean! Super polite."
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer App Bottom Nav */}
                <div className="border-t border-slate-100 p-3 bg-slate-50 text-[10px] flex justify-around text-slate-400 font-bold">
                  <span className="text-brand-600">Home</span>
                  <span>Bookings</span>
                  <span>Support</span>
                  <span>Profile</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* DEVICE 2: PROFESSIONAL PARTNER APP (RIGHT) */}
          {/* ========================================================= */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Partner Screen (Rahul Kumar • Plumber)</span>
            </div>

            <div className="w-full max-w-[380px] rounded-[44px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-800 text-white overflow-hidden min-h-[640px] flex flex-col justify-between">
              <div className="bg-slate-950 rounded-[36px] overflow-hidden min-h-[620px] flex flex-col justify-between">
                
                {/* Partner Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80" 
                      alt="Rahul" 
                      className="w-9 h-9 rounded-full object-cover border border-emerald-400"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white">Rahul Kumar</h4>
                      <span className="text-[10px] text-emerald-400">🟢 Online • Indiranagar</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">₹{proTodayEarnings}</span>
                    <span className="text-[9px] text-slate-400 block">Today's Earn</span>
                  </div>
                </div>

                {/* Partner Middle Content (Changes by Step) */}
                <div className="p-4 flex-1 flex flex-col justify-between text-xs space-y-4">
                  {simStep === 0 && (
                    <div className="space-y-4 py-8 text-center text-slate-400 animate-in fade-in">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 mx-auto flex items-center justify-center font-bold text-2xl">
                        📡
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Radar Active</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Waiting for customer requests within 5km radius...</p>
                      </div>
                    </div>
                  )}

                  {simStep === 1 && (
                    <div className="p-4 bg-slate-900 border-2 border-brand-500 rounded-2xl space-y-3 animate-pulse">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold bg-brand-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                          New Staked Order!
                        </span>
                        <span className="text-emerald-400 font-bold">₹898 Payout</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">QuickServe 3-Chore Stack (75 mins)</h4>
                        <p className="text-[11px] text-slate-300 mt-1">Bathroom + Utensils + Floor Mopping</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-brand-400" />
                          <span>Sai Orchid, 12th Main, Indiranagar (2.4 km)</span>
                        </p>
                      </div>
                      <div className="pt-2 flex gap-2">
                        <button className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                          Decline
                        </button>
                        <button
                          onClick={() => setSimStep(2)}
                          className="flex-1 py-2 bg-brand-500 text-slate-950 font-bold rounded-xl shadow-lg"
                        >
                          Accept Job →
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 2 && (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Order Accepted</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Indiranagar Hub 01</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">Pick up kit & proceed to Sai Orchid</h4>
                      <p className="text-[11px] text-slate-400">Equip QuickServe uniform, cleaning kit & verified bodycam.</p>
                      <button
                        onClick={() => setSimStep(3)}
                        className="w-full py-2.5 bg-brand-500 text-slate-950 font-bold rounded-xl text-xs"
                      >
                        Start Navigation (On The Way) →
                      </button>
                    </div>
                  )}

                  {simStep === 3 && (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-brand-400">Arrived at Customer Doorstep</span>
                        <span className="text-slate-400">Indiranagar</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Ask customer for their 4-digit Start OTP before commencing work:
                      </p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value="4821" 
                          className="flex-1 p-2 bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white rounded-xl"
                        />
                        <button
                          onClick={() => setSimStep(4)}
                          className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl"
                        >
                          Verify OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 4 && (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-400 uppercase">3 Chores In Progress</span>
                        <span className="font-mono text-xs font-bold text-brand-400">⏱️ 74:35 Left</span>
                      </div>

                      {/* Interactive Chore Checklist for Partner */}
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-emerald-400">
                          <span>✓ Master Bathroom Cleaning</span>
                          <span className="text-[10px] text-slate-400">Done</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-400">
                          <span>✓ Kitchen Utensils & Sink</span>
                          <span className="text-[10px] text-slate-400">Done</span>
                        </div>
                        <div className="flex items-center justify-between text-blue-400 font-semibold">
                          <span>⏳ Floor Sweeping & Mopping</span>
                          <span className="text-[10px] text-blue-400 animate-pulse">Running</span>
                        </div>
                      </div>

                      <p className="text-slate-400 text-[11px]">
                        When all 3 chores are finished, request Completion OTP from Ananya:
                      </p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value="7392" 
                          className="flex-1 p-2 bg-slate-950 border border-slate-700 text-center font-mono font-bold text-white rounded-xl"
                        />
                        <button
                          onClick={() => {
                            setSimStep(5);
                            setProBalance(prev => prev + 898);
                            setProTodayEarnings(prev => prev + 898);
                            setProJobsCount(prev => prev + 1);
                          }}
                          className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl"
                        >
                          Complete & Collect ₹898
                        </button>
                      </div>
                    </div>
                  )}

                  {simStep === 5 && (
                    <div className="space-y-3 text-center animate-in zoom-in-95">
                      <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl space-y-1">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                          Payout Credited!
                        </span>
                        <h3 className="text-2xl font-black text-white">₹898</h3>
                        <p className="text-[10px] text-slate-400">Deposited to wallet balance (3 Chores)</p>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl text-left text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Wallet Balance:</span>
                          <span className="font-bold text-emerald-400">₹{proBalance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Lifetime Jobs:</span>
                          <span className="font-bold text-white">{proJobsCount}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert(`₹${proBalance} instantly transferred to Rahul's UPI: rahul.plumb@oksbi!`)}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                      >
                        Instant UPI Withdrawal →
                      </button>
                    </div>
                  )}
                </div>

                {/* Partner Bottom Nav */}
                <div className="border-t border-slate-800 p-3 bg-slate-900 text-[10px] flex justify-around text-slate-400 font-bold">
                  <span className="text-brand-400">Home</span>
                  <span>Jobs</span>
                  <span>Earnings</span>
                  <span>Profile</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ADMIN TELEMETRY DRAWER */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-xs space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <h3 className="font-bold text-white text-sm">Admin Real-Time Audit Log & Telemetry</h3>
            </div>
            <span className="font-mono text-emerald-400 text-[11px]">Dispatch Engine: ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">Order ID</span>
              <strong className="text-white">QS-BLR-8492</strong> (Plumbing • Indiranagar)
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">Status Machine</span>
              <strong className="text-brand-400 uppercase">
                {simStep === 0 ? 'READY' : simStep === 1 ? 'SEARCHING' : simStep === 2 ? 'ASSIGNED' : simStep === 3 ? 'ON_THE_WAY' : simStep === 4 ? 'STARTED' : 'COMPLETED'}
              </strong>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">Revenue Breakdown</span>
              <span>Pro: <strong className="text-emerald-400">₹449</strong> | Platform Take: <strong className="text-white">₹45 (10%)</strong></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
