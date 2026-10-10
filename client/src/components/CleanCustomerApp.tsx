import React, { useState, useMemo } from 'react';
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
  X, Briefcase, Check, ArrowRight 
} from 'lucide-react';

interface CleanCustomerAppProps {
  currentUser: CustomerUser;
  categories: ServiceCategory[];
  bookings: Booking[];
  onRefreshBookings: () => void;
  onLogout: () => void;
  activeCityZone: string;
  onSelectZone: (zone: string, fullAddress?: string) => void;
  onSwitchToPartnerPortal: () => void;
}

// 6 Core Categories with subtle pastel palettes
interface CoreCategoryConfig {
  id: string;
  name: string;
  matchCatIds: string[];
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  activeRing: string;
}

const CORE_CATEGORIES: CoreCategoryConfig[] = [
  {
    id: 'cleaning',
    name: 'Cleaning & Maid',
    matchCatIds: ['cat-maid', 'cat-deep-clean', 'cleaning'],
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
    bgColor: 'bg-[#ECFDF5]',
    textColor: 'text-[#059669]',
    borderColor: 'border-[#A7F3D0]',
    activeRing: 'ring-[#059669]'
  },
  {
    id: 'plumber',
    name: 'Plumber',
    matchCatIds: ['cat-plumber', 'plumber'],
    icon: Wrench,
    image: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?w=400&auto=format&fit=crop&q=80',
    bgColor: 'bg-[#F0F9FF]',
    textColor: 'text-[#0284C7]',
    borderColor: 'border-[#BAE6FD]',
    activeRing: 'ring-[#0284C7]'
  },
  {
    id: 'electrician',
    name: 'Electrician',
    matchCatIds: ['cat-electrician', 'electrician'],
    icon: Zap,
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
    bgColor: 'bg-[#FFFBEB]',
    textColor: 'text-[#D97706]',
    borderColor: 'border-[#FDE68A]',
    activeRing: 'ring-[#D97706]'
  },
  {
    id: 'ac_appliances',
    name: 'AC & Appliances',
    matchCatIds: ['cat-ac-repair', 'cat-appliance', 'ac-repair'],
    icon: Wind,
    image: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=400&auto=format&fit=crop&q=80',
    bgColor: 'bg-[#F0FDFA]',
    textColor: 'text-[#0D9488]',
    borderColor: 'border-[#99F6E4]',
    activeRing: 'ring-[#0D9488]'
  },
  {
    id: 'cook',
    name: 'Cook',
    matchCatIds: ['cat-cook', 'cook'],
    icon: Utensils,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80',
    bgColor: 'bg-[#FFF1F2]',
    textColor: 'text-[#E11D48]',
    borderColor: 'border-[#FECDD3]',
    activeRing: 'ring-[#E11D48]'
  },
  {
    id: 'moving',
    name: 'Moving Help',
    matchCatIds: ['cat-packers', 'cat-tempo', 'packers'],
    icon: Truck,
    image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&auto=format&fit=crop&q=80',
    bgColor: 'bg-[#FAF5FF]',
    textColor: 'text-[#7C3AED]',
    borderColor: 'border-[#DDD6FE]',
    activeRing: 'ring-[#7C3AED]'
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
  
  // Modals
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [bookingService, setBookingService] = useState<HomeServiceCard | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Active customer orders count
  const myCleanPhone = (currentUser.phone || '').replace(/\D/g, '').slice(-10);
  const activeOrdersCount = useMemo(() => {
    return bookings.filter(b => {
      const bPhone = (b.customer_phone || '').replace(/\D/g, '').slice(-10);
      const isMine = !myCleanPhone || bPhone === myCleanPhone || bPhone.includes(myCleanPhone);
      return isMine && b.status !== 'completed' && b.status !== 'cancelled';
    }).length;
  }, [bookings, myCleanPhone]);

  // Filtered services
  const filteredServices = useMemo(() => {
    let list = professionalHomeServices;

    // Filter by search query if any
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(s => 
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

    return list;
  }, [searchQuery, selectedCategoryKey]);

  const handleBookingPlaced = (newBooking: Booking) => {
    onRefreshBookings();
    setSuccessToast(`Order #${newBooking.booking_reference} confirmed!`);
    setActiveTab('orders');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col pb-20 md:pb-8 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. COMPACT, ELEGANT HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Left: QuickServe Logo + Location Pill */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('home'); setSelectedCategoryKey('all'); setSearchQuery(''); }}
              className="flex items-center gap-2 group text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-[#059669] text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-[#047857] transition-colors">
                QS
              </div>
              <span className="text-lg font-bold text-[#172033] tracking-tight hidden sm:inline font-heading">
                QuickServe
              </span>
            </button>

            {/* Selected Location Pill */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 rounded-full border border-slate-200/70 text-left transition-colors max-w-[160px] sm:max-w-[220px] md:max-w-[260px] group shadow-2xs"
              title="Change Delivery Location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              <span className="text-xs font-semibold text-[#172033] truncate">
                {activeCityZone || 'Select Location'}
              </span>
              <span className="text-[10px] text-[#059669] font-bold shrink-0 ml-0.5 group-hover:underline hidden sm:inline">
                Change
              </span>
            </button>
          </div>

          {/* Center: Desktop Prominent Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 'tap repair', 'maid', 'AC service'..."
                className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#172033] placeholder-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Header Navigation: Orders, Profile, Partner Portal */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onSwitchToPartnerPortal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#059669] hover:bg-emerald-50/70 rounded-xl border border-slate-200 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#059669]" />
              <span>Partner Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`relative p-2 rounded-xl border transition-colors ${
                activeTab === 'orders'
                  ? 'bg-emerald-50 border-emerald-300 text-[#059669]'
                  : 'bg-white border-slate-200 text-[#172033] hover:bg-slate-50'
              }`}
              title="My Orders"
            >
              <ShoppingBag className="w-4 h-4" />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`p-2 rounded-xl border transition-colors ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 border-emerald-300 text-[#059669]'
                  : 'bg-white border-slate-200 text-[#172033] hover:bg-slate-50'
              }`}
              title="Profile & Support"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What service do you need?"
              className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#172033] placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#172033] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER (Responsive ~1200-1400px maximum) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        
        {/* VIEW 1: HOME CATALOG VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-6 sm:space-y-7">
            
            {/* Visual Hierarchy: Small Elegant Welcome Heading */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/60 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight font-heading">
                  Home services, made simple
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Verified domestic help, plumbers, electricians & technicians at your doorstep in 15 mins.
                </p>
              </div>

              {/* Trust Tag Strip */}
              <div className="flex items-center gap-3 text-xs text-[#64748B] shrink-0">
                <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  Aadhaar Verified
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200">
                  <Check className="w-3 h-3 text-[#059669]" />
                  Zero Advance
                </span>
              </div>
            </div>

            {/* 4. COMPACT, BEAUTIFUL SERVICE CATEGORIES */}
            <div>
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Service Categories
                </h2>
                {selectedCategoryKey !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryKey('all')}
                    className="text-xs font-semibold text-[#059669] hover:underline shrink-0"
                  >
                    View All Categories
                  </button>
                )}
              </div>

              {/* Category row: Desktop 6-col grid, Mobile clean horizontal scroll */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
                {CORE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategoryKey === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryKey(isSelected ? 'all' : cat.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer group ${
                        isSelected
                          ? `bg-white border-[#059669] ring-2 ring-[#059669]/20 shadow-xs`
                          : `${cat.bgColor} ${cat.borderColor} hover:border-[#059669]/40 hover:-translate-y-0.5 hover:shadow-2xs`
                      }`}
                    >
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-105 shadow-2xs ${
                        isSelected
                          ? 'bg-[#059669] text-white shadow-emerald-200'
                          : `${cat.textColor} bg-white/90 border ${cat.borderColor}`
                      }`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className={`text-xs font-bold leading-tight ${
                        isSelected ? 'text-[#059669]' : 'text-[#172033]'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. REDESIGNED SERVICE CARDS (3-4 cols desktop, 2 cols tablet, 1 col mobile) */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm sm:text-base font-bold text-[#172033] flex items-center gap-2">
                  <span>
                    {selectedCategoryKey !== 'all'
                      ? CORE_CATEGORIES.find(c => c.id === selectedCategoryKey)?.name
                      : searchQuery
                      ? `Search Results for "${searchQuery}"`
                      : 'Available Services'}
                  </span>
                  <span className="text-xs font-normal text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full">
                    {filteredServices.length}
                  </span>
                </h3>
              </div>

              {filteredServices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-[#172033]">No services found</p>
                  <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                    Try searching for another service like tap repair, kitchen cleaning, or fan installation.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategoryKey('all'); }}
                    className="mt-4 px-4 py-2 text-xs bg-emerald-50 text-[#059669] font-bold rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    Reset Search & Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4.5">
                  {filteredServices.map((service) => {
                    const catConfig = CORE_CATEGORIES.find(c => c.matchCatIds.includes(service.categoryId) || c.matchCatIds.includes(service.categorySlug)) || CORE_CATEGORIES[0];
                    const tasksList = service.includedTasks || [];

                    return (
                      <div
                        key={service.id}
                        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow service-card flex flex-col justify-between h-full group"
                      >
                        {/* 2D Photo Thumbnail with Category Pill & Duration Badge */}
                        <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-100">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = catConfig.image;
                            }}
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md bg-white/95 border ${catConfig.textColor} ${catConfig.borderColor} shadow-2xs`}>
                              {catConfig.name}
                            </span>
                          </div>
                          <div className="absolute bottom-2.5 right-2.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md bg-black/65 text-white flex items-center gap-1 shadow-2xs">
                              <Clock className="w-3 h-3 text-emerald-300" />
                              <span>~{service.duration_mins}m</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 flex flex-col justify-between flex-1">
                          <div>
                            <h4 className="text-[15px] font-bold text-[#172033] leading-snug line-clamp-1 group-hover:text-[#059669] transition-colors">
                              {service.title}
                            </h4>
                            
                            <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                              {service.tagline || service.subServiceName}
                            </p>

                            {/* Max 2 Short Highlights */}
                            {tasksList.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                {tasksList.slice(0, 2).map((t, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#172033] truncate">
                                    <Check className="w-3 h-3 text-[#059669] shrink-0" />
                                    <span className="truncate">{t}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Card Footer: Price & Compact Book Now Button */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-[#64748B] block font-medium uppercase tracking-wider">Starts at</span>
                              <span className="text-base sm:text-lg font-bold text-[#059669] tracking-tight">
                                ₹{service.startingPrice}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setBookingService(service)}
                              className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Book Now</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assurance Footer Strip */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#64748B] shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#172033]">QuickServe Customer Guarantee</p>
                  <p className="text-[11px] text-[#64748B]">100% Free cancellation anytime before arrival. Transparent flat rate card.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-[#172033]">
                <span className="flex items-center gap-1">✓ No advance required</span>
                <span className="flex items-center gap-1">✓ Pay after work via UPI/Cash</span>
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
            onSwitchToPartnerPortal={onSwitchToPartnerPortal}
          />
        )}

      </main>

      {/* Responsive Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-6 py-2 flex items-center justify-around sm:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            activeTab === 'home' ? 'text-[#059669] font-bold' : 'text-[#64748B]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-0.5 relative transition-colors ${
            activeTab === 'orders' ? 'text-[#059669] font-bold' : 'text-[#64748B]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {activeOrdersCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#059669] text-white text-[9px] font-bold flex items-center justify-center">
              {activeOrdersCount}
            </span>
          )}
          <span className="text-[10px]">Orders</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-0.5 transition-colors ${
            activeTab === 'profile' ? 'text-[#059669] font-bold' : 'text-[#64748B]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

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

    </div>
  );
};
