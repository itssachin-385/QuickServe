import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  ChevronRight, 
  MapPin, 
  Wallet, 
  Headphones, 
  LogOut, 
  LogIn, 
  User, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Edit3, 
  Mail, 
  Receipt, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Bell,
  Star,
  Coins,
  Ticket,
  CreditCard,
  Building,
  Briefcase,
  Home,
  MessageCircle,
  Camera,
  ExternalLink,
  Sparkles,
  PhoneCall,
  Wrench
} from 'lucide-react';
import { CustomerUser, SavedAddress } from '../types';
import { updateUserProfile } from '../api';
import { notificationService, AppNotificationItem } from '../services/notificationService';
import { NotificationCenterModal } from './NotificationCenterModal';

interface CustomerProfileScreenProps {
  currentUser?: CustomerUser | null;
  onLogout?: () => void;
  onNavigateTab: (tab: 'home' | 'bookings' | 'support' | 'profile') => void;
  onOpenAuth?: () => void;
  onUpdateUser?: (updated: CustomerUser) => void;
  activeCityZone?: string;
  onSwitchToPartnerMode?: () => void;
}

export const CustomerProfileScreen: React.FC<CustomerProfileScreenProps> = ({
  currentUser,
  onLogout,
  onNavigateTab,
  onOpenAuth,
  onUpdateUser,
  activeCityZone,
  onSwitchToPartnerMode
}) => {
  const isLoggedIn = Boolean(currentUser);

  // Modals state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<AppNotificationItem[]>(() => notificationService.getHistory());
  const unreadNotificationCount = notificationsList.filter(n => !n.read).length;

  useEffect(() => {
    const unsub = notificationService.subscribeHistory((updated) => {
      setNotificationsList(updated);
    });
    return () => unsub();
  }, []);

  // Close modals when Android hardware back button is pressed
  useEffect(() => {
    const handleProfileHardwareBack = (e: Event) => {
      if (isNotificationModalOpen) {
        setIsNotificationModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isLogoutConfirmOpen) {
        setIsLogoutConfirmOpen(false);
        e.preventDefault();
        return;
      }
      if (isEditProfileModalOpen) {
        setIsEditProfileModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isAddressModalOpen) {
        setIsAddressModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isWalletModalOpen) {
        setIsWalletModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isGstModalOpen) {
        setIsGstModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isSafetyModalOpen) {
        setIsSafetyModalOpen(false);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('quickserve:hardwareback', handleProfileHardwareBack);
    return () => {
      window.removeEventListener('quickserve:hardwareback', handleProfileHardwareBack);
    };
  }, [isLogoutConfirmOpen, isEditProfileModalOpen, isAddressModalOpen, isWalletModalOpen, isGstModalOpen, isSafetyModalOpen]);

  // Edit profile form state
  const isGenericName = !currentUser?.name || currentUser.name.startsWith('User +91') || currentUser.name.startsWith('User ');
  const [editName, setEditName] = useState(isGenericName ? '' : (currentUser?.name || ''));
  const [editEmail, setEditEmail] = useState(() => {
    if (!currentUser?.email || currentUser.email.includes('@quickserve.in')) return '';
    return currentUser.email;
  });
  const [editCity, setEditCity] = useState(currentUser?.city || activeCityZone || 'Ber Sarai, New Delhi');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other' | ''>(currentUser?.gender as any || '');
  const [editDob, setEditDob] = useState(currentUser?.dob || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Preferences
  const [whatsappUpdates, setWhatsappUpdates] = useState(currentUser?.whatsapp_updates ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(currentUser?.notifications_enabled ?? true);

  // Wallet top-up state
  const [rechargeAmount, setRechargeAmount] = useState<number>(250);
  const [isRecharging, setIsRecharging] = useState(false);

  // GST State
  const [gstin, setGstin] = useState(currentUser?.gstin || '');
  const [companyName, setCompanyName] = useState(currentUser?.company_name || '');
  const [isSavingGst, setIsSavingGst] = useState(false);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    return currentUser?.saved_addresses || [
      {
        id: 'addr-default-1',
        flat: 'Flat 204, Block B',
        area: activeCityZone || 'Ber Sarai, New Delhi',
        label: 'Home',
        address_line: `Flat 204, Block B, ${activeCityZone || 'Ber Sarai, New Delhi'}`
      }
    ];
  });
  const [newFlat, setNewFlat] = useState('');
  const [newArea, setNewArea] = useState(activeCityZone || 'Ber Sarai, New Delhi');
  const [newLabel, setNewLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!editName.trim()) return;

    setIsSavingProfile(true);
    try {
      const updatedUser: CustomerUser = {
        ...currentUser,
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        city: editCity || undefined,
        gender: editGender || undefined,
        dob: editDob || undefined,
        whatsapp_updates: whatsappUpdates,
        notifications_enabled: notificationsEnabled
      };

      await updateUserProfile(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      localStorage.setItem('quickserve_user', JSON.stringify(updatedUser));
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setProfileSuccessMsg(null);
        setIsEditProfileModalOpen(false);
      }, 700);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Toggle WhatsApp updates
  const handleToggleWhatsapp = async () => {
    const nextVal = !whatsappUpdates;
    setWhatsappUpdates(nextVal);
    if (currentUser) {
      const updatedUser: CustomerUser = {
        ...currentUser,
        whatsapp_updates: nextVal
      };
      await updateUserProfile(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      localStorage.setItem('quickserve_user', JSON.stringify(updatedUser));
    }
  };

  // Toggle push notifications
  const handleToggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    if (nextVal) {
      await notificationService.initNotifications();
    }
    if (currentUser) {
      const updatedUser: CustomerUser = {
        ...currentUser,
        notifications_enabled: nextVal
      };
      await updateUserProfile(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      localStorage.setItem('quickserve_user', JSON.stringify(updatedUser));
    }
  };

  // Quick Wallet recharge
  const handleRechargeWallet = async (amount: number) => {
    if (!currentUser) return;
    setIsRecharging(true);
    try {
      const currentBal = currentUser.wallet_balance || 0;
      const updatedUser: CustomerUser = {
        ...currentUser,
        wallet_balance: currentBal + amount
      };
      await updateUserProfile(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      localStorage.setItem('quickserve_user', JSON.stringify(updatedUser));
      setTimeout(() => {
        setIsRecharging(false);
        setIsWalletModalOpen(false);
      }, 500);
    } catch (err) {
      console.error('Wallet recharge error:', err);
      setIsRecharging(false);
    }
  };

  // Save GST details
  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSavingGst(true);
    try {
      const updatedUser: CustomerUser = {
        ...currentUser,
        gstin: gstin.trim().toUpperCase() || undefined,
        company_name: companyName.trim() || undefined
      };

      await updateUserProfile(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      localStorage.setItem('quickserve_user', JSON.stringify(updatedUser));
      setIsGstModalOpen(false);
    } catch (err) {
      console.error('Failed to save GSTIN:', err);
    } finally {
      setIsSavingGst(false);
    }
  };

  // Add address
  const handleAddAddress = () => {
    if (!newFlat.trim()) return;
    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      flat: newFlat.trim(),
      area: newArea.trim(),
      city: editCity || 'Ber Sarai, New Delhi',
      label: newLabel,
      address_line: `${newFlat.trim()}, ${newArea.trim()}`
    };
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    if (currentUser) {
      const updatedUser = { ...currentUser, saved_addresses: updated };
      updateUserProfile(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      localStorage.setItem('quickserve_user', JSON.stringify(updatedUser));
    }
    setNewFlat('');
    setIsAddingAddress(false);
  };

  // Delete address
  const handleDeleteAddress = (id: string) => {
    const updated = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(updated);
    if (currentUser) {
      const updatedUser = { ...currentUser, saved_addresses: updated };
      updateUserProfile(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      localStorage.setItem('quickserve_user', JSON.stringify(updatedUser));
    }
  };

  // Format phone display
  const formattedPhone = currentUser?.phone 
    ? (currentUser.phone.startsWith('+91') ? currentUser.phone : `+91 ${currentUser.phone}`)
    : '+91 95701 51834';

  const userDisplayName = isGenericName 
    ? 'QuickServe Member' 
    : (currentUser?.name || 'QuickServe Member');

  const userInitials = isGenericName
    ? 'Q'
    : (currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U');

  return (
    <div className="w-full bg-slate-50/60 pb-36 font-sans text-slate-900 select-none">
      
      {/* 1. DEDICATED PROFESSIONAL HEADER (NO SEARCH BAR) */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('home')}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors active:scale-95"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              My Account
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Profile, bookings, addresses & settings
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('support')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-all flex items-center gap-1.5 text-xs font-bold"
          title="24/7 Help & Support"
        >
          <Headphones className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Help</span>
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4 sm:p-5 space-y-4">

        {/* 2. ELEVATED USER PROFILE HERO CARD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-emerald-100/50 via-teal-50/20 to-transparent rounded-bl-full pointer-events-none" />

          {isLoggedIn ? (
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                
                {/* Circular Avatar with Camera overlay */}
                <div 
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="relative group cursor-pointer shrink-0"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-emerald-500/10">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:bg-emerald-600 transition-colors">
                    <Camera className="w-3 h-3" />
                  </div>
                </div>

                {/* Name & Phone Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      {isGenericName ? (
                        <button
                          onClick={() => setIsEditProfileModalOpen(true)}
                          className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-extrabold text-base transition-colors"
                        >
                          <span>Add Your Name</span>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                          {userDisplayName}
                        </h2>
                      )}
                    </div>

                    <button
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 active:scale-95"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Phone */}
                  <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                    {formattedPhone}
                  </p>

                  {/* Email */}
                  {currentUser?.email && !currentUser.email.includes('@quickserve.in') ? (
                    <p className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-1 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                    </p>
                  ) : (
                    <button 
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add email for digital receipts</span>
                    </button>
                  )}

                  {/* Verified & Location Badge */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified Mobile</span>
                    </span>

                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      <span>{currentUser?.city || activeCityZone || 'Ber Sarai, New Delhi'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* QuickServe Plus VIP Club Banner */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white flex items-center justify-between border border-emerald-500/20 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div>
                    <span className="text-xs font-black block text-amber-300">QuickServe Plus Member</span>
                    <span className="text-[10px] text-slate-300">Zero visit fee & priority 15-min technician arrival</span>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Welcome to QuickServe
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Login with mobile OTP to manage bookings & rewards
                </p>
              </div>
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. REWARDS, WALLET & STATS STRIP (3 Horizontal Cards) */}
        {isLoggedIn && (
          <div className="grid grid-cols-3 gap-2.5">
            {/* Wallet Card */}
            <div 
              onClick={() => setIsWalletModalOpen(true)}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs cursor-pointer hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  + Add
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Wallet</span>
                <span className="text-sm sm:text-base font-black text-slate-900 block truncate">
                  ₹{currentUser?.wallet_balance !== undefined ? currentUser.wallet_balance : 250}
                </span>
              </div>
            </div>

            {/* QuickCoins Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                  ₹1 = 1 Coin
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">QuickCoins</span>
                <span className="text-sm sm:text-base font-black text-slate-900 block truncate">
                  {currentUser?.quickcoins || 150}
                </span>
              </div>
            </div>

            {/* Coupons Card */}
            <div 
              onClick={() => onNavigateTab('home')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs cursor-pointer hover:border-emerald-500/50 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Ticket className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-extrabold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md">
                  Offers
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Coupons</span>
                <span className="text-sm sm:text-base font-black text-slate-900 block truncate">
                  4 Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. GROUP 1: BOOKINGS & ORDERS */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Orders & Activity
            </span>
          </div>

          {/* My Bookings */}
          <button
            onClick={() => onNavigateTab('bookings')}
            className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">My Bookings</span>
                <span className="text-[11px] text-slate-500 font-medium">Track visits, technician arrivals & history</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Saved Addresses */}
          <button
            onClick={() => setIsAddressModalOpen(true)}
            className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Saved Addresses</span>
                <span className="text-[11px] text-slate-500 font-medium">Manage home, flat numbers & delivery spots</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {savedAddresses.length} Saved
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        </div>

        {/* 5. GROUP 2: PAYMENTS & INVOICES */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Payments & Billing
            </span>
          </div>

          {/* Wallet & Cashless */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">QuickServe Wallet & Passbook</span>
                <span className="text-[11px] text-slate-500 font-medium">Auto-cashless balance & recharge history</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* GSTIN & Tax Invoicing */}
          <button
            onClick={() => setIsGstModalOpen(true)}
            className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">GSTIN & Business Invoicing</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {currentUser?.gstin ? `GST: ${currentUser.gstin}` : 'Add company GSTIN for 18% tax credit'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* 6. GROUP 3: PREFERENCES & SECURITY */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Preferences & Alerts
            </span>
          </div>

          {/* WhatsApp Alerts Toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">WhatsApp Service Alerts</span>
                <span className="text-[11px] text-slate-500 font-medium">Live helper arrival & booking updates</span>
              </div>
            </div>
            <button
              onClick={handleToggleWhatsapp}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${whatsappUpdates ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${whatsappUpdates ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Notification Inbox / History */}
          <div 
            onClick={() => setIsNotificationModalOpen(true)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Notification History</span>
                <span className="text-[11px] text-slate-500 font-medium">Review past order alerts and start OTPs</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadNotificationCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-black">
                  {unreadNotificationCount} New
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Push Notifications</span>
                <span className="text-[11px] text-slate-500 font-medium">Service reminders & promo coupons</span>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* 7. GROUP 4: SAFETY, HELP & ABOUT */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Trust & Support
            </span>
          </div>

          {/* Safety Guarantee */}
          <button
            onClick={() => setIsSafetyModalOpen(true)}
            className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Safety & Background Verification</span>
                <span className="text-[11px] text-slate-500 font-medium">100% Police-verified helpers • ₹10,000 cover</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* 24/7 Help */}
          <button
            onClick={() => onNavigateTab('support')}
            className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Help & Customer Support</span>
                <span className="text-[11px] text-slate-500 font-medium">24/7 customer care & dispute resolution</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* QUICKSERVE PARTNER / TECHNICIAN PORTAL CARD */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg border border-slate-700/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Partner Mode</h4>
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-400/30">
                    Technician
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                  Manage assigned jobs, verify OTPs & track earnings
                </p>
              </div>
            </div>
            <button
              onClick={() => onSwitchToPartnerMode?.()}
              className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1"
            >
              <span>Open Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 8. GROUP 5: LOG OUT & VERSION */}
        {isLoggedIn ? (
          <div className="pt-2">
            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 active:scale-98 shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of QuickServe</span>
            </button>
          </div>
        ) : null}

        {/* App Version Stamp */}
        <div className="text-center pt-2 pb-6">
          <p className="text-[11px] font-bold text-slate-400 tracking-wide">
            QuickServe v2.4.2 (Official Build)
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Designed for 15-Minute Hyperlocal Home Services • Built in India 🇮🇳
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT PROFILE (Name, Email, Gender, City)                         */}
      {/* ========================================================================= */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in p-0 sm:p-4">
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Edit Profile</h3>
                  <p className="text-[11px] text-slate-500">Update your personal details & receipt email</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kumar Gaurav"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Email Address (For Tax Invoices)
                </label>
                <input
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                />
              </div>

              {/* Phone (Readonly) */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Verified Mobile Number
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono text-xs">
                  <span>{formattedPhone}</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender (For Helper Preference Matching)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditGender(g)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs capitalize border transition-all ${
                        editGender === g
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Primary Location / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ber Sarai, New Delhi"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile || !editName.trim()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: WALLET RECHARGE                                                  */}
      {/* ========================================================================= */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in p-0 sm:p-4">
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">QuickServe Wallet</h3>
                  <p className="text-[11px] text-slate-500">Instant cashless checkout for home chores</p>
                </div>
              </div>
              <button 
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100">Current Balance</span>
                <span className="text-2xl font-black block">
                  ₹{currentUser?.wallet_balance !== undefined ? currentUser.wallet_balance : 250}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full">
                Auto-Refund Enabled
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Select Top-Up Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`py-2 px-1 rounded-xl font-black text-xs border transition-all ${
                      rechargeAmount === amt
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleRechargeWallet(rechargeAmount)}
                disabled={isRecharging}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isRecharging ? 'Processing UPI Recharge...' : `Recharge ₹${rechargeAmount} via UPI`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SAVED ADDRESSES                                                  */}
      {/* ========================================================================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in p-0 sm:p-4">
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Saved Addresses</h3>
                  <p className="text-[11px] text-slate-500">Manage delivery spots & flat numbers</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="pt-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      {addr.label === 'Work' ? <Briefcase className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">{addr.label}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{addr.flat}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{addr.area}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Address Form Toggle */}
            {isAddingAddress ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Flat / Room / House No."
                  value={newFlat}
                  onChange={(e) => setNewFlat(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Area / Colony / Sector"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewLabel(tag)}
                      className={`py-1.5 text-[11px] font-bold rounded-xl border ${newLabel === tag ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddAddress}
                    className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                  >
                    Save Address
                  </button>
                  <button
                    onClick={() => setIsAddingAddress(false)}
                    className="px-3 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="w-full py-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Address</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: GSTIN & BUSINESS INVOICING                                       */}
      {/* ========================================================================= */}
      {isGstModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in p-0 sm:p-4">
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">GSTIN Invoicing</h3>
                  <p className="text-[11px] text-slate-500">Claim 18% Input Tax Credit on all chore invoices</p>
                </div>
              </div>
              <button 
                onClick={() => setIsGstModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGst} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  15-Digit GSTIN Number
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company / Legal Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Enterprises Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingGst}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs shadow-md transition-all"
                >
                  {isSavingGst ? 'Saving GSTIN...' : 'Save GSTIN Information'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SAFETY GUARANTEE & VERIFICATION                                  */}
      {/* ========================================================================= */}
      {isSafetyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in p-0 sm:p-4">
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Safety Guarantee</h3>
                  <p className="text-[11px] text-slate-500">Your household trust and safety protocol</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSafetyModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Police Verified Background</span>
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Every helper, caretaker, and technician undergoes aadhaar, court records, and local police verification before entering your home.
                </p>
              </div>

              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200">
                <h4 className="font-bold text-teal-950 text-xs flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>₹10,000 Property Damage Cover</span>
                </h4>
                <p className="text-[11px] text-teal-800">
                  All chores booked on QuickServe are covered against accidental damage with instant claim assistance.
                </p>
              </div>

              <button
                onClick={() => setIsSafetyModalOpen(false)}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: LOGOUT CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in p-4">
          <div 
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 flex flex-col gap-4 text-center animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-base text-slate-900">Log Out of QuickServe?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You will need to verify with mobile OTP to access saved addresses and bookings again.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutConfirmOpen(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs transition-colors shadow-md"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dedicated In-App Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notificationsList}
        onTrackBooking={() => {
          setIsNotificationModalOpen(false);
          onNavigateTab('bookings');
        }}
        onMarkAllRead={() => notificationService.markAllAsRead()}
        onClearAll={() => notificationService.clearHistory()}
      />
    </div>
  );
};
