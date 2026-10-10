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
  X, Briefcase 
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

// 6 Core Categories as requested in specification
interface CoreCategoryConfig {
  id: string;
  name: string;
  matchCatIds: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CORE_CATEGORIES: CoreCategoryConfig[] = [
  {
    id: 'cleaning',
    name: 'Cleaning & Maid',
    matchCatIds: ['cat-maid', 'cat-deep-clean', 'cleaning'],
    icon: Sparkles,
    color: 'text-emerald-600 bg-emerald-50'
  },
  {
    id: 'plumber',
    name: 'Plumber',
    matchCatIds: ['cat-plumber', 'plumber'],
    icon: Wrench,
    color: 'text-blue-600 bg-blue-50'
  },
  {
    id: 'electrician',
    name: 'Electrician',
    matchCatIds: ['cat-electrician', 'electrician'],
    icon: Zap,
    color: 'text-amber-600 bg-amber-50'
  },
  {
    id: 'ac_appliances',
    name: 'AC & Appliances',
    matchCatIds: ['cat-ac-repair', 'cat-appliance', 'ac-repair'],
    icon: Wind,
    color: 'text-cyan-600 bg-cyan-50'
  },
  {
    id: 'cook',
    name: 'Cook',
    matchCatIds: ['cat-cook', 'cook'],
    icon: Utensils,
    color: 'text-rose-600 bg-rose-50'
  },
  {
    id: 'moving',
    name: 'Moving Help',
    matchCatIds: ['cat-packers', 'cat-tempo', 'packers'],
    icon: Truck,
    color: 'text-indigo-600 bg-indigo-50'
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
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      
      {/* Universal Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo & Location */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => { setActiveTab('home'); setSelectedCategoryKey('all'); setSearchQuery(''); }}
              className="flex items-center gap-2 shrink-0 group text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                QS
              </div>
              <span className="text-base font-bold text-slate-900 hidden sm:inline tracking-tight">
                QuickServe
              </span>
            </button>

            {/* Selected Location Pill */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-left transition-colors max-w-[200px] sm:max-w-[280px]"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-semibold text-slate-800 block truncate">
                  {activeCityZone || 'Select Location'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold ml-1 hidden sm:inline">Change</span>
            </button>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToPartnerPortal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Partner Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`relative p-2 rounded-xl border transition-colors ${
                activeTab === 'orders'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="My Orders"
            >
              <ShoppingBag className="w-4 h-4" />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`p-2 rounded-xl border transition-colors ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Profile"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        
        {/* VIEW 1: HOME CATALOG VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Simple Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What service do you need? (e.g. tap leak, maid, fan, AC)"
                className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-slate-200 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 6 Core Categories */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Service Categories
                </h2>
                {selectedCategoryKey !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryKey('all')}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {CORE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategoryKey === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryKey(isSelected ? 'all' : cat.id)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs leading-tight ${isSelected ? 'font-bold text-emerald-950' : 'font-medium text-slate-700'}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Services List with Transparent Starting Prices */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedCategoryKey !== 'all'
                    ? CORE_CATEGORIES.find(c => c.id === selectedCategoryKey)?.name
                    : searchQuery
                    ? `Results for "${searchQuery}"`
                    : 'Available Home Services'}
                  <span className="text-xs font-normal text-slate-400 ml-2">({filteredServices.length})</span>
                </h3>
              </div>

              {filteredServices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-sm font-bold text-slate-800">No services found</p>
                  <p className="text-xs text-slate-400 mt-1">Try another search term or clear the filter.</p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategoryKey('all'); }}
                    className="mt-3 px-4 py-1.5 text-xs bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-bold text-slate-900 leading-snug">
                              {service.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {service.tagline || service.subServiceName}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-base font-bold text-slate-900">₹{service.startingPrice}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">starting</span>
                          </div>
                        </div>

                        {/* Included tasks preview */}
                        {service.includedTasks && service.includedTasks.length > 0 && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                            <ul className="text-xs text-slate-600 space-y-1">
                              {service.includedTasks.slice(0, 2).map((task, tIdx) => (
                                <li key={tIdx} className="flex items-center gap-1.5 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="truncate">{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>~{service.duration_mins} mins</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBookingService(service)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                        >
                          <span>Book Now</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Assurance Strip */}
            <div className="bg-slate-100/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified Professionals • 100% Free Cancellation before arrival</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <span>Zero advance • Pay after job completion</span>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: ORDERS VIEW */}
        {activeTab === 'orders' && (
          <CleanOrdersView
            bookings={bookings}
            customerPhone={currentUser.phone}
            onRefresh={onRefreshBookings}
            onNavigateHome={() => setActiveTab('home')}
          />
        )}

        {/* VIEW 3: PROFILE VIEW */}
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

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 px-6 py-2.5 flex items-center justify-around sm:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 relative transition-colors ${
            activeTab === 'orders' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {activeOrdersCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
              {activeOrdersCount}
            </span>
          )}
          <span className="text-[10px]">Orders</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-500'
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
