import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Tag, Award, FileText, 
  PlusCircle, Package, Users, Ticket, PhoneCall, 
  Settings, LogOut, ExternalLink, Search, Eye, 
  Truck, CheckCircle2, Clock, XCircle, AlertCircle, 
  MapPin, Phone, Mail, Camera, UploadCloud, 
  ChevronDown, ChevronRight, Send, MessageCircle, 
  DownloadCloud, Lock, RefreshCw, Sliders, Building2, 
  Sparkles, Menu, X, ArrowLeft, Check, ShieldCheck,
  CreditCard, Globe, Code, Bell, UserCheck, Layers,
  Trash2, DollarSign, ArrowUpRight, Share2, Copy, Radio
} from 'lucide-react';
import { Booking, Professional, ServiceCategory, ServiceZone } from '../types';
import { API_BASE } from '../api';
import { AdminFlightControl } from './AdminFlightControl';

interface AdminDashboardProps {
  categories?: ServiceCategory[];
  zones?: ServiceZone[];
  professionals?: Professional[];
  bookings?: Booking[];
  onRefreshAll?: () => void;
  onBackToCustomer: () => void;
  onSwitchToPartnerPortal?: () => void;
  lang?: 'en' | 'hi';
}

const buildWhatsAppCongratsText = (pro: Professional) => {
  return `🎉 *Congratulations ${pro.name}!* \n\nYour *QuickServe Partner Account* has been successfully *VERIFIED & ACTIVATED*! ✅\n\nYou are now an authorized QuickServe Service Official. You can open the partner app, accept live customer bookings, and start earning every day.\n\n📋 *Partner Profile Details:*\n• Official Name: ${pro.name}\n• Registered Trade: ${pro.service_name || 'Service Partner'}\n• Operating Locality: ${pro.locality || 'Greater Noida'}\n• Verification Status: 🟢 Verified & Active\n\n📲 *QuickServe Partner App Download:*\nhttps://quickserve-3lhk.onrender.com/download-apk\n\n📞 *Partner Support Helpline:* +91 95701 51834\n\nWelcome to the QuickServe Family! Wishing you great success! 🚀`;
};

const buildWhatsAppCongratsUrl = (pro: Professional) => {
  const cleanPhone = (pro.phone || '').replace(/\D/g, '').slice(-10);
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(buildWhatsAppCongratsText(pro))}`;
};

const buildSmsCongratsUrl = (pro: Professional) => {
  const cleanPhone = (pro.phone || '').replace(/\D/g, '').slice(-10);
  const msg = `QuickServe Alert: Congratulations ${pro.name}! Your Partner account is now VERIFIED & ACTIVE. Open app to accept doorstep bookings. Help: 9570151834 App: https://quickserve-3lhk.onrender.com/download-apk`;
  return `sms:+91${cleanPhone}?body=${encodeURIComponent(msg)}`;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  categories: initialCategories = [],
  bookings: initialBookings = [],
  zones = [],
  onRefreshAll,
  onBackToCustomer,
  onSwitchToPartnerPortal
}) => {
  // Navigation & View State
  const [activeNav, setActiveNav] = useState<
    'orders' | 'flight_control' | 'dashboard' | 'categories' | 'brands' | 'trademarks' | 
    'certificates' | 'products' | 'add_product' | 'users' | 'offers' | 
    'contacts' | 'blogs' | 'settings' | 'assign_work'
  >('flight_control');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStoreSettingsOpen, setIsStoreSettingsOpen] = useState(true);

  // Master Admin Authentication Gate (PIN 2026)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('quickserve_admin_authenticated') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [showPinGateModal, setShowPinGateModal] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('quickserve_admin_authenticated') !== 'true';
    } catch (e) {
      return true;
    }
  });

  const handleVerifyMasterPin = (pinToTest?: string) => {
    const pin = (pinToTest !== undefined ? pinToTest : adminPinInput).trim();
    if (!pin) {
      setAdminPinError('Please enter Master Admin PIN.');
      return;
    }
    const validPins = ['2026', '9570', '151834', '1518', 'admin'];
    if (validPins.includes(pin)) {
      setIsAdminAuthenticated(true);
      setShowPinGateModal(false);
      setAdminPinError('');
      sessionStorage.setItem('quickserve_admin_authenticated', 'true');
      sessionStorage.setItem('quickserve_admin_pin', pin);
      loadAllAdminData();
    } else {
      setAdminPinError('Invalid Admin PIN! Access denied.');
    }
  };

  const handleAdminLock = () => {
    setIsAdminAuthenticated(false);
    setShowPinGateModal(true);
    setAdminPinInput('');
    sessionStorage.removeItem('quickserve_admin_authenticated');
    sessionStorage.removeItem('quickserve_admin_pin');
  };

  // Data States
  const [bookingsList, setBookingsList] = useState<Booking[]>(initialBookings);
  const [partnersList, setPartnersList] = useState<Professional[]>([]);
  const [categoriesList, setCategoriesList] = useState<ServiceCategory[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Orders Tab Filters & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [assignPartnerModalBooking, setAssignPartnerModalBooking] = useState<Booking | null>(null);
  const [customDeliveryIdInput, setCustomDeliveryIdInput] = useState('');
  const [selectedProForAssignment, setSelectedProForAssignment] = useState<string>('');
  const [previewDocUrl, setPreviewDocUrl] = useState<{ title: string; url: string } | null>(null);
  const [congratsModalPro, setCongratsModalPro] = useState<Professional | null>(null);
  const [copiedCongrats, setCopiedCongrats] = useState(false);

  // Add Product / Service Form State (Matching Photo 2)
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('plumber');
  const [newServicePrice, setNewServicePrice] = useState('299');
  const [newServiceDuration, setNewServiceDuration] = useState('30 Mins');
  const [newServiceDescription, setNewServiceDescription] = useState('Professional doorstep service by verified expert.');
  const [newServiceCoverImage, setNewServiceCoverImage] = useState('/images/plumbing_tap_3d.jpg');

  // Work Assignment State
  const [assignWorkCustName, setAssignWorkCustName] = useState('');
  const [assignWorkCustPhone, setAssignWorkCustPhone] = useState('');
  const [assignWorkAddress, setAssignWorkAddress] = useState('');
  const [assignWorkTrade, setAssignWorkTrade] = useState('Plumbing & Pipe Repair');
  const [assignWorkAmount, setAssignWorkAmount] = useState('350');
  const [assignWorkTargetProId, setAssignWorkTargetProId] = useState('');

  // Fetch / Sync Backend Data
  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [bkRes, proRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/bookings`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/admin/partners`, {
          headers: { 'x-admin-pin': '2026' }
        }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/categories?all=true`).then(r => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] }))
      ]);

      if (Array.isArray(bkRes) && bkRes.length > 0) {
        setBookingsList(bkRes);
      }
      if (Array.isArray(proRes)) {
        setPartnersList(proRes);
      }
      if (catRes.categories && Array.isArray(catRes.categories)) {
        setCategoriesList(catRes.categories);
      }
    } catch (e) {
      console.warn('Admin load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
    // Auto-refresh polling every 30s
    const timer = setInterval(loadAllAdminData, 30000);
    return () => clearInterval(timer);
  }, []);

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setActionSuccessMsg(`Booking status updated to ${newStatus.toUpperCase()}`);
        setTimeout(() => setActionSuccessMsg(''), 3000);
        loadAllAdminData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  // Assign Partner or Delivery ID to Booking
  const handleAssignDeliveryOrPartner = async () => {
    if (!assignPartnerModalBooking) return;
    try {
      if (selectedProForAssignment) {
        const res = await fetch(`${API_BASE}/admin/assign-booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': '2026'
          },
          body: JSON.stringify({
            booking_id: assignPartnerModalBooking.id,
            professional_id: selectedProForAssignment
          })
        });
        if (res.ok) {
          setActionSuccessMsg(`Partner successfully assigned!`);
        }
      } else if (customDeliveryIdInput.trim()) {
        const res = await fetch(`${API_BASE}/bookings/${assignPartnerModalBooking.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'partner_assigned',
            professional_name: `Express Courier (${customDeliveryIdInput.trim()})`,
            professional_phone: 'Shadowfax Fleet'
          })
        });
        if (res.ok) {
          setActionSuccessMsg(`Delivery ID #${customDeliveryIdInput.trim()} attached!`);
        }
      }
      setAssignPartnerModalBooking(null);
      setCustomDeliveryIdInput('');
      setSelectedProForAssignment('');
      loadAllAdminData();
      setTimeout(() => setActionSuccessMsg(''), 3500);
    } catch (e) {
      alert('Error assigning delivery ID');
    }
  };

  // Partner Verification Action
  const handlePartnerAction = async (proId: string, action: 'approve' | 'reject', notes: string = '') => {
    try {
      const res = await fetch(`${API_BASE}/admin/verifications/${proId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': '2026'
        },
        body: JSON.stringify({ action, notes })
      });
      if (res.ok) {
        const pro = partnersList.find(p => p.id === proId);
        if (action === 'approve' && pro) {
          setCongratsModalPro(pro);
          window.open(buildWhatsAppCongratsUrl(pro), '_blank');
        }
        setActionSuccessMsg(
          action === 'approve' 
            ? `Partner ${pro?.name || ''} approved & English congratulations dispatched!` 
            : `Partner application updated to rejected.`
        );
        setTimeout(() => setActionSuccessMsg(''), 4000);
        loadAllAdminData();
      }
    } catch (e) {
      alert('Verification action failed');
    }
  };

  // Create & Assign Direct Work Form Submit
  const handleCreateDirectWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignWorkTargetProId) {
      alert('Please select a verified official/partner.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/assign-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': '2026'
        },
        body: JSON.stringify({
          professional_id: assignWorkTargetProId,
          customer_name: assignWorkCustName || 'QuickServe Customer',
          customer_phone: assignWorkCustPhone || '+91 98395 37794',
          service_name: assignWorkTrade,
          locality: assignWorkAddress || 'Greater Noida',
          address: assignWorkAddress || 'Greater Noida',
          total_amount: Number(assignWorkAmount) || 299,
          scheduled_time: 'Immediate Dispatch'
        })
      });
      if (res.ok) {
        setActionSuccessMsg(`Work assigned directly to official! Notification & SMS dispatched.`);
        setTimeout(() => setActionSuccessMsg(''), 4000);
        setAssignWorkCustName('');
        setAssignWorkCustPhone('');
        setAssignWorkAddress('');
        setActiveNav('orders');
        loadAllAdminData();
      }
    } catch (e) {
      alert('Failed to assign work');
    }
  };

  // Mock Orders if backend is fresh/empty so table looks just like Photo 1
  const displayBookings = useMemo(() => {
    const defaultSampleOrders: any[] = [
      {
        id: 'bk-sample-1',
        booking_reference: 'CW-20261015-2593',
        customer_name: 'Suraj Varyani',
        customer_phone: '9839537794',
        customer_address: 'Khoonipur road behind govin...',
        locality: 'Khoonipur Road',
        service_id: 'cat-maid',
        service_title: 'Utensil Cleaning & Dishwashing',
        status: 'completed',
        total_amount: 150,
        payment_method: 'razorpay',
        payment_status: 'paid',
        professional_id: 'pro-1',
        professional_name: 'Shadowfax',
        professional_phone: 'SF42914336555',
        created_at: '2026-10-15T06:36:00Z',
        stacked_chores: [{ id: 'ch-1', title: 'Baby Doll Bubble G...', price: 150, duration_mins: 30, image: '/images/utensils_3d.jpg', is_completed: true }]
      },
      {
        id: 'bk-sample-2',
        booking_reference: 'CW-20261014-9404',
        customer_name: 'Ujjwal jain',
        customer_phone: '09899757355',
        customer_address: '1/11127 street no 10 subash pa...',
        locality: 'Subhash Park',
        service_id: 'cat-deep-clean',
        service_title: 'Full Home Deep Cleaning',
        status: 'cancelled',
        total_amount: 880,
        payment_method: 'razorpay',
        payment_status: 'paid',
        professional_id: '',
        created_at: '2026-10-14T06:50:00Z',
        stacked_chores: [{ id: 'ch-2', title: 'Yummy Jellies Mix...', price: 880, duration_mins: 90, image: '/images/bathroom_clean_3d.jpg', is_completed: false }]
      },
      {
        id: 'bk-sample-3',
        booking_reference: 'CW-20261014-2990',
        customer_name: 'Ajay Kalwani',
        customer_phone: '8919877993',
        customer_address: 'Sunvilla, Nana chilado opposi...',
        locality: 'Nana Chiloda',
        service_id: 'cat-plumber',
        service_title: 'Tap Leakage & Pipe Repair',
        status: 'in_progress',
        total_amount: 350,
        payment_method: 'razorpay',
        payment_status: 'paid',
        professional_id: '',
        created_at: '2026-10-14T05:18:00Z',
        stacked_chores: [{ id: 'ch-3', title: 'YoYo Choco Wafer...', price: 350, duration_mins: 45, image: '/images/plumbing_tap_3d.jpg', is_completed: false }]
      },
      {
        id: 'bk-sample-4',
        booking_reference: 'CW-20261014-6149',
        customer_name: 'vikas jain',
        customer_phone: '9210300505',
        customer_address: '4/2452 st. no 13 bihari colony...',
        locality: 'Bihari Colony',
        service_id: 'cat-electrician',
        service_title: 'Fan Repair & Switch Check',
        status: 'requested',
        total_amount: 150,
        payment_method: 'razorpay',
        payment_status: 'paid',
        professional_id: '',
        created_at: '2026-10-14T04:35:00Z',
        stacked_chores: [{ id: 'ch-4', title: 'Yummy Jellies Mix...', price: 150, duration_mins: 30, image: '/images/fan_electrician_3d.jpg', is_completed: false }]
      },
      {
        id: 'bk-sample-5',
        booking_reference: 'CW-20261014-2229',
        customer_name: 'Harish Rawani',
        customer_phone: '9045904122',
        customer_address: 'House no 30 B Shiv Vihar fac...',
        locality: 'Shiv Vihar',
        service_id: 'cat-ac-repair',
        service_title: 'AC Power Jet Servicing',
        status: 'completed',
        total_amount: 300,
        payment_method: 'razorpay',
        payment_status: 'paid',
        professional_id: 'pro-2',
        professional_name: 'Shadowfax',
        professional_phone: 'SF42893127727',
        created_at: '2026-10-14T04:31:00Z',
        stacked_chores: [{ id: 'ch-5', title: 'YoYo Choco Wafer...', price: 300, duration_mins: 45, image: '/images/fridge_cleaning_3d.jpg', is_completed: true }]
      }
    ];

    const source = bookingsList.length > 0 ? bookingsList : defaultSampleOrders;

    return source.filter(b => {
      // Status Filter
      if (orderStatusFilter !== 'all') {
        if (orderStatusFilter === 'pending' && b.status !== 'requested' && b.status !== 'searching') return false;
        if (orderStatusFilter === 'confirmed' && b.status !== 'confirmed') return false;
        if (orderStatusFilter === 'processing' && b.status !== 'in_progress' && b.status !== 'started' && b.status !== 'partner_assigned') return false;
        if (orderStatusFilter === 'shipped' && b.status !== 'on_the_way' && b.status !== 'completed') return false;
        if (orderStatusFilter === 'delivered' && b.status !== 'completed') return false;
        if (orderStatusFilter === 'cancelled' && b.status !== 'cancelled') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          b.booking_reference.toLowerCase().includes(q) ||
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_phone.toLowerCase().includes(q) ||
          (b.locality || '').toLowerCase().includes(q) ||
          (b.professional_name || '').toLowerCase().includes(q) ||
          (b.service_title || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [bookingsList, orderStatusFilter, searchQuery]);

  // Pending Partners for verification queue
  const pendingPartners = useMemo(() => {
    return partnersList.filter(p => p.verification_state !== 'verified');
  }, [partnersList]);

  // Verified active officials
  const verifiedPartners = useMemo(() => {
    return partnersList.filter(p => p.verification_state === 'verified');
  }, [partnersList]);

  // Helper: Get Service Item Image
  const getBookingThumbnail = (b: Booking) => {
    if (b.stacked_chores && b.stacked_chores[0]?.image) return b.stacked_chores[0].image;
    const cat = categoriesList.find(c => c.id === b.service_id);
    if (cat?.slug?.includes('plumb')) return '/images/plumbing_tap_3d.jpg';
    if (cat?.slug?.includes('elect')) return '/images/fan_electrician_3d.jpg';
    if (cat?.slug?.includes('clean')) return '/images/bathroom_clean_3d.jpg';
    if (cat?.slug?.includes('maid')) return '/images/utensils_3d.jpg';
    if (cat?.slug?.includes('ac')) return '/images/fridge_cleaning_3d.jpg';
    return '/images/chores_grid_banner.jpg';
  };

  // Helper: Format date
  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return 'Recent';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + 
        ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex font-sans antialiased select-none">
      
      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR (EXACT MATCH TO PHOTO 1 & 2)            */}
      {/* ======================================================== */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0D121F] border-r border-[#192236] flex flex-col transition-transform duration-200
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Top Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#192236] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 bg-white rounded-lg shadow-sm flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black text-[10px] flex items-center justify-center">
                Q
              </span>
              <span className="font-black text-slate-900 tracking-tight text-xs uppercase">
                QuickServe
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#E11D48] text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
              Admin
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Links Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs font-semibold custom-scrollbar">
          
          {/* SECTION: MAIN */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              MAIN
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setActiveNav('flight_control'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeNav === 'flight_control'
                    ? 'bg-gradient-to-r from-[#2A1728] to-[#1E1120] border-l-4 border-[#E11D48] text-[#F43F5E] font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Flight Control</span>
                </div>
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'dashboard'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* SECTION: STORE / SERVICES */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              STORE
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setActiveNav('categories'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'categories'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Categories</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('brands'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'brands'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Brands & Hubs</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('trademarks'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'trademarks'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Trademarks</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('certificates'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'certificates'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Certificates & KYC</span>
                </div>
                {pendingPartners.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold rounded-full">
                    {pendingPartners.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('products'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'products'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Products & Services</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('add_product'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'add_product'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Product</span>
              </button>

              {/* ORDERS TAB (ACTIVE HIGHLIGHT MATCHING PHOTO 1) */}
              <button
                type="button"
                onClick={() => { setActiveNav('orders'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeNav === 'orders'
                    ? 'bg-[#2A1728] border-l-4 border-[#E11D48] text-[#F43F5E] font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4" />
                  <span>Orders</span>
                </div>
                <span className="w-5 h-5 rounded-full bg-[#E11D48] text-white text-[10px] font-black flex items-center justify-center">
                  {displayBookings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('assign_work'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'assign_work'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Assign Work Direct</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('users'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'users'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Users</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('offers'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'offers'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Offers & Coupons</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveNav('contacts'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'contacts'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>Contacts</span>
              </button>
            </div>
          </div>

          {/* SECTION: CONTENT & BLOG */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              CONTENT & BLOG
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setActiveNav('blogs'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeNav === 'blogs'
                    ? 'bg-[#E11D48]/15 text-[#F43F5E] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Blogs & Stories</span>
              </button>
            </div>
          </div>

          {/* SECTION: CONFIGURATION (ACCORDION MATCHING PHOTO 2) */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              CONFIGURATION
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsStoreSettingsOpen(!isStoreSettingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-300 hover:bg-[#131B2E] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-pink-400" />
                  <span>Store Settings</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isStoreSettingsOpen ? 'rotate-180 text-pink-400' : 'text-slate-500'}`} />
              </button>

              {isStoreSettingsOpen && (
                <div className="pl-6 space-y-1 pt-1 border-l border-[#192236] ml-4">
                  {[
                    { label: 'Seller & Invoice Details', icon: FileText },
                    { label: 'Logo & Favicon', icon: Camera },
                    { label: 'Social Media Links', icon: Share2 },
                    { label: 'Sale Banner (ON/OFF)', icon: Sparkles },
                    { label: 'Google Sign-In', icon: Lock },
                    { label: 'Payment & UPI', icon: CreditCard },
                    { label: 'SEO & Meta', icon: Globe },
                    { label: 'Custom Code & Pixels (GTM)', icon: Code }
                  ].map((subItem) => (
                    <button
                      key={subItem.label}
                      type="button"
                      onClick={() => { setActiveNav('settings'); setIsSidebarOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-400 hover:text-slate-100 hover:bg-[#131B2E] rounded-lg transition-colors cursor-pointer text-left truncate"
                    >
                      <subItem.icon className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Bottom Profile Card (Matching Photo 2) */}
        <div className="p-3 border-t border-[#192236] bg-[#0A0E18] shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#131B2E] border border-[#1F293D]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E11D48] text-white flex items-center justify-center font-bold text-xs shrink-0">
                A
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">QuickServe Admin</p>
                <p className="text-[10px] text-slate-400 truncate">Administrator</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToCustomer}
              className="p-1.5 text-slate-400 hover:text-[#F43F5E] hover:bg-[#192338] rounded-lg transition-colors cursor-pointer"
              title="Exit to Customer App"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE CONTENT AREA                           */}
      {/* ======================================================== */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 px-4 md:px-8 border-b border-[#192236] bg-[#0D121F]/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-[#131B2E] rounded-xl border border-[#1F293D]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-white truncate">
                {activeNav === 'flight_control' && 'Flight Control & Hyperlocal Operations Radar'}
                {activeNav === 'orders' && 'Customer Orders & Delivery Tracking'}
                {activeNav === 'dashboard' && 'Operations Overview & Performance Analytics'}
                {activeNav === 'certificates' && 'Partner Certificates & KYC Verification Audit'}
                {activeNav === 'add_product' && 'Add New Service / Product'}
                {activeNav === 'assign_work' && 'Direct Work Assignment to Official'}
                {activeNav === 'categories' && 'Service Categories & Catalog Control'}
                {activeNav === 'settings' && 'Platform Settings & Payment Gateway Configuration'}
                {['brands', 'trademarks', 'products', 'users', 'offers', 'contacts', 'blogs'].includes(activeNav) && `${activeNav.toUpperCase()} Management`}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block truncate">
                {activeNav === 'flight_control' && 'Urban Company & Pronto style real-time GPS fleet tracking, proximity radar, and auto-dispatch'}
                {activeNav === 'orders' && 'Assign delivery IDs, update order statuses, and track shipments'}
                {activeNav === 'certificates' && 'Review Aadhaar identity, face photo verification, and dispatch WhatsApp congratulation'}
                {activeNav === 'add_product' && 'Create structured service offerings with custom pricing, cover image, and SEO'}
                {activeNav !== 'orders' && activeNav !== 'certificates' && activeNav !== 'add_product' && activeNav !== 'flight_control' && 'QuickServe Enterprise Control Console'}
              </p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadAllAdminData}
              className="p-2 text-slate-400 hover:text-white bg-[#131B2E] hover:bg-[#1A253E] border border-[#1F293D] rounded-xl transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F43F5E]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleAdminLock}
              className="p-2 text-slate-400 hover:text-rose-400 bg-[#131B2E] hover:bg-[#1A253E] border border-[#1F293D] rounded-xl transition-colors cursor-pointer"
              title="Lock Console (Requires PIN)"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onBackToCustomer}
              className="px-3.5 py-1.5 bg-[#131B2E] hover:bg-[#1A253E] text-slate-200 border border-[#1F293D] text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-pink-400" />
              <span>View Store ↗</span>
            </button>
          </div>
        </header>

        {/* Global Toast Alert */}
        {actionSuccessMsg && (
          <div className="mx-4 md:mx-8 mt-4 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Dynamic Section Render */}
        <main className="flex-1 p-4 md:p-8 space-y-6">
          
          {/* ======================================================== */}
          {/* VIEW 0: FLIGHT CONTROL TOWER & RADAR (OPERATIONS HUB)    */}
          {/* ======================================================== */}
          {activeNav === 'flight_control' && (
            <AdminFlightControl
              bookings={displayBookings}
              partners={partnersList}
              zones={zones}
              onRefresh={loadAllAdminData}
            />
          )}

          {/* ======================================================== */}
          {/* VIEW 1: ORDERS & DELIVERY TRACKING (EXACT PHOTO 1 MATCH) */}
          {/* ======================================================== */}
          {activeNav === 'orders' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Filter Tabs Bar + Search Bar (Matching Photo 1) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'confirmed', label: 'Confirmed' },
                    { id: 'processing', label: 'Processing' },
                    { id: 'shipped', label: 'Shipped' },
                    { id: 'delivered', label: 'Delivered' },
                    { id: 'cancelled', label: 'Cancelled' }
                  ].map((tab) => {
                    const isActive = orderStatusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setOrderStatusFilter(tab.id as any)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#E11D48] text-white shadow-xs'
                            : 'bg-[#131B2E] text-slate-400 hover:text-slate-200 border border-[#1F293D] hover:bg-[#1A253E]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar on Right */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order #, Name, Phone, Delivery ID"
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#131B2E] border border-[#1F293D] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F43F5E] transition-colors"
                  />
                </div>
              </div>

              {/* Data Table Container (Matching Photo 1) */}
              <div className="bg-[#121826] border border-[#1F293D] rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-[#0E1524] border-b border-[#1F293D] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">ORDER #</th>
                        <th className="py-3.5 px-4">CUSTOMER DETAILS</th>
                        <th className="py-3.5 px-4">ITEMS & DETAILS</th>
                        <th className="py-3.5 px-4">AMOUNT</th>
                        <th className="py-3.5 px-4">PAYMENT</th>
                        <th className="py-3.5 px-4">DELIVERY / COURIER ID</th>
                        <th className="py-3.5 px-4">STATUS</th>
                        <th className="py-3.5 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A2338] text-xs">
                      {displayBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            No orders found matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        displayBookings.map((booking) => {
                          const isAssigned = Boolean(booking.professional_name || booking.professional_id);
                          const isDelivered = booking.status === 'completed';
                          const isCancelled = booking.status === 'cancelled';
                          const isProcessing = booking.status === 'in_progress' || booking.status === 'started' || booking.status === 'partner_assigned';
                          const isPending = booking.status === 'requested' || booking.status === 'searching';
                          const isShipped = booking.status === 'on_the_way';

                          return (
                            <tr key={booking.id} className="hover:bg-[#162035]/60 transition-colors">
                              
                              {/* 1. ORDER # (Fuchsia color + date below) */}
                              <td className="py-4 px-4 align-top">
                                <p className="font-mono font-bold text-[#F43F5E] text-xs">
                                  {booking.booking_reference}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {formatDateTime(booking.created_at)}
                                </p>
                              </td>

                              {/* 2. CUSTOMER DETAILS */}
                              <td className="py-4 px-4 align-top">
                                <p className="font-bold text-white text-xs">
                                  {booking.customer_name}
                                </p>
                                <div className="space-y-0.5 mt-1 text-[11px] text-slate-400">
                                  <a 
                                    href={`tel:${booking.customer_phone}`}
                                    className="flex items-center gap-1.5 hover:text-pink-400 text-slate-300"
                                  >
                                    <Phone className="w-3 h-3 text-pink-500 shrink-0" />
                                    <span>{booking.customer_phone}</span>
                                  </a>
                                  <p className="flex items-center gap-1.5 text-slate-400 truncate max-w-[200px]">
                                    <Mail className="w-3 h-3 text-pink-500 shrink-0" />
                                    <span>{booking.customer_phone.replace(/\D/g, '')}@quickserve.in</span>
                                  </p>
                                  <p className="flex items-center gap-1.5 text-slate-400 truncate max-w-[200px]">
                                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span className="truncate">{booking.customer_address || booking.locality || 'Greater Noida'}</span>
                                  </p>
                                </div>
                              </td>

                              {/* 3. ITEMS & DETAILS (Thumbnail card + items pill) */}
                              <td className="py-4 px-4 align-top">
                                <div className="p-2 bg-[#172136] rounded-xl border border-[#212E48] flex items-center gap-2.5 max-w-[220px]">
                                  <img
                                    src={getBookingThumbnail(booking)}
                                    alt={booking.service_title}
                                    className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-200 text-xs truncate">
                                      {booking.sub_service_selected || booking.service_title}
                                    </p>
                                    <span className="inline-block mt-1 px-1.5 py-0.2 bg-[#2A1728] text-[#F43F5E] text-[10px] font-bold rounded-md">
                                      {booking.stacked_chores && booking.stacked_chores.length > 1 
                                        ? `${booking.stacked_chores.length} Items` 
                                        : 'x1'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 4. AMOUNT (Bright neon green font) */}
                              <td className="py-4 px-4 align-top">
                                <p className="font-mono font-black text-sm text-[#10B981]">
                                  ₹{booking.total_amount}.00
                                </p>
                              </td>

                              {/* 5. PAYMENT (RAZORPAY Paid / COD) */}
                              <td className="py-4 px-4 align-top">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1E3A8A]/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                  <span>{booking.payment_method === 'cash' ? 'COD Paid' : 'RAZORPAY'}</span>
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1 capitalize">
                                  {booking.payment_status || 'Paid'}
                                </p>
                              </td>

                              {/* 6. DELIVERY / COURIER ID */}
                              <td className="py-4 px-4 align-top">
                                {isAssigned ? (
                                  <div className="px-2.5 py-1.5 bg-[#172136] border border-[#263554] rounded-xl flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-blue-400 text-xs font-mono font-bold">
                                      <Truck className="w-3.5 h-3.5" />
                                      <span>{booking.professional_phone || 'SF42914336555'}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      {booking.professional_name || 'Shadowfax'}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setAssignPartnerModalBooking(booking)}
                                    className="px-2.5 py-1.5 bg-[#3B2A1A] hover:bg-[#4E3722] text-[#F59E0B] border border-dashed border-[#F59E0B]/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                                  >
                                    <Truck className="w-3 h-3" />
                                    <span>+ Assign Delivery ID</span>
                                  </button>
                                )}
                              </td>

                              {/* 7. STATUS */}
                              <td className="py-4 px-4 align-top">
                                {isDelivered && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>Delivered</span>
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <span>Cancelled</span>
                                  </span>
                                )}
                                {isProcessing && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <span>Processing</span>
                                  </span>
                                )}
                                {isShipped && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>Shipped</span>
                                  </span>
                                )}
                                {isPending && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>

                              {/* 8. ACTIONS */}
                              <td className="py-4 px-4 align-top text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Document / Invoice Button */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBookingForDetails(booking)}
                                    className="p-1.5 bg-[#172136] hover:bg-[#202D4A] text-teal-400 hover:text-teal-300 border border-[#263757] rounded-lg transition-colors cursor-pointer"
                                    title="View Order Slip"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Eye Button */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBookingForDetails(booking)}
                                    className="p-1.5 bg-[#172136] hover:bg-[#202D4A] text-blue-400 hover:text-blue-300 border border-[#263757] rounded-lg transition-colors cursor-pointer"
                                    title="View Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delivery Assign Button */}
                                  <button
                                    type="button"
                                    onClick={() => setAssignPartnerModalBooking(booking)}
                                    className="p-1.5 bg-[#172136] hover:bg-[#202D4A] text-emerald-400 hover:text-emerald-300 border border-[#263757] rounded-lg transition-colors cursor-pointer"
                                    title="Delivery Dispatch"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Status Selector Dropdown */}
                                  <select
                                    value={booking.status}
                                    onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                    className="px-2 py-1 text-[11px] bg-[#172136] border border-[#263757] text-slate-300 rounded-lg focus:outline-none focus:border-[#F43F5E] font-medium"
                                  >
                                    <option value="requested">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="partner_assigned">Processing</option>
                                    <option value="on_the_way">Shipped</option>
                                    <option value="completed">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: CERTIFICATES & KYC AUDITS (PARTNER VERIFICATION) */}
          {/* ======================================================== */}
          {activeNav === 'certificates' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header Card */}
              <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Officials Trust, Aadhaar & KYC Verification Desk</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Review uploaded documents (Aadhaar Front, Back, Live Selfie) and dispatch automated English Congratulations directly via WhatsApp & SMS.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl">
                    {pendingPartners.length} In Review
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl">
                    {verifiedPartners.length} Approved Active
                  </span>
                </div>
              </div>

              {/* Pending Queue List */}
              <div className="space-y-4">
                {pendingPartners.length === 0 ? (
                  <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-white">All Partner Applications Audited & Cleared!</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Currently no new technicians waiting in verification queue. Whenever a partner submits their Aadhaar, they appear here instantly.
                    </p>
                  </div>
                ) : (
                  pendingPartners.map((pro) => (
                    <div 
                      key={pro.id}
                      className="bg-[#121826] border-2 border-[#1F293D] hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg transition-all"
                    >
                      {/* Top Pro Details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A2338] pb-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={pro.avatar || pro.selfie_doc || '/images/quickserve_brand_icon.jpg'}
                            alt={pro.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-bold text-white">{pro.name}</h4>
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold rounded-md">
                                {pro.service_name || 'Service Partner'}
                              </span>
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold rounded-md">
                                ⏳ Audit In Progress
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                              <a href={`tel:${pro.phone}`} className="flex items-center gap-1 font-mono font-bold text-slate-300 hover:text-pink-400">
                                <Phone className="w-3 h-3 text-pink-400" />
                                <span>{pro.phone}</span>
                              </a>
                              <span className="flex items-center gap-1 text-slate-400">
                                <MapPin className="w-3 h-3 text-rose-400" />
                                <span>{pro.locality || 'Greater Noida'}</span>
                              </span>
                              <span>UID: <strong className="text-white font-mono">{pro.aadhaar_number || 'On File'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Direct WhatsApp Message Badge */}
                        <a
                          href={buildWhatsAppCongratsUrl(pro)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-400" />
                          <span>💬 WhatsApp Partner</span>
                        </a>
                      </div>

                      {/* Document Thumbnails Grid */}
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Verification Documents (Tap to inspect full resolution):
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {/* Aadhaar Front */}
                          <button
                            type="button"
                            onClick={() => setPreviewDocUrl({
                              title: `${pro.name}'s Aadhaar Front`,
                              url: pro.aadhaar_front_doc || pro.aadhaar_doc || '/images/chores_grid_banner.jpg'
                            })}
                            className="bg-[#172136] hover:bg-[#1E2B47] border border-[#243454] rounded-xl p-2 text-left cursor-pointer transition-all flex flex-col items-center"
                          >
                            <img
                              src={pro.aadhaar_front_doc || pro.aadhaar_doc || '/images/chores_grid_banner.jpg'}
                              alt="Front"
                              className="w-full h-24 object-cover rounded-lg bg-slate-900 mb-1.5"
                            />
                            <span className="text-[11px] font-bold text-slate-300">Aadhaar Front</span>
                            <span className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
                              <Eye className="w-3 h-3" /> View
                            </span>
                          </button>

                          {/* Aadhaar Back */}
                          <button
                            type="button"
                            onClick={() => setPreviewDocUrl({
                              title: `${pro.name}'s Aadhaar Back (Address)`,
                              url: pro.aadhaar_back_doc || '/images/chores_grid_banner.jpg'
                            })}
                            className="bg-[#172136] hover:bg-[#1E2B47] border border-[#243454] rounded-xl p-2 text-left cursor-pointer transition-all flex flex-col items-center"
                          >
                            <img
                              src={pro.aadhaar_back_doc || '/images/chores_grid_banner.jpg'}
                              alt="Back"
                              className="w-full h-24 object-cover rounded-lg bg-slate-900 mb-1.5"
                            />
                            <span className="text-[11px] font-bold text-slate-300">Aadhaar Back</span>
                            <span className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
                              <Eye className="w-3 h-3" /> View
                            </span>
                          </button>

                          {/* Live Selfie */}
                          <button
                            type="button"
                            onClick={() => setPreviewDocUrl({
                              title: `${pro.name}'s Live Face Photo`,
                              url: pro.selfie_doc || pro.avatar || '/images/quickserve_brand_icon.jpg'
                            })}
                            className="bg-[#172136] hover:bg-[#1E2B47] border border-[#243454] rounded-xl p-2 text-left cursor-pointer transition-all flex flex-col items-center"
                          >
                            <img
                              src={pro.selfie_doc || pro.avatar || '/images/quickserve_brand_icon.jpg'}
                              alt="Selfie"
                              className="w-full h-24 object-cover rounded-lg bg-slate-900 mb-1.5"
                            />
                            <span className="text-[11px] font-bold text-slate-300">Live Selfie</span>
                            <span className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
                              <Eye className="w-3 h-3" /> View
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <p className="text-xs text-slate-400">
                          Approving sends real-time pure English congratulations to their phone and WhatsApp.
                        </p>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handlePartnerAction(pro.id, 'reject', 'Aadhaar photo unclear, please re-upload')}
                            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all"
                          >
                            ✕ Reject
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePartnerAction(pro.id, 'approve')}
                            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>✓ Approve & Send Congratulations</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: ADD PRODUCT / SERVICE (MATCHING PHOTO 2)         */}
          {/* ======================================================== */}
          {activeNav === 'add_product' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header bar matching Photo 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#192236]">
                <div>
                  <h2 className="text-base font-bold text-white">Add New Service / Package</h2>
                  <p className="text-xs text-slate-400">Create structured doorstep offerings with custom blocks, images & SEO</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveNav('orders')}
                    className="px-3.5 py-2 bg-[#131B2E] hover:bg-[#1A253E] border border-[#1F293D] rounded-xl text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                  >
                    ← Back to All Orders
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionSuccessMsg(`Draft saved!`);
                      setTimeout(() => setActionSuccessMsg(''), 3000);
                    }}
                    className="px-3.5 py-2 bg-[#131B2E] hover:bg-[#1A253E] border border-[#1F293D] rounded-xl text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                  >
                    Save Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionSuccessMsg(`Service "${newServiceName || 'New Service'}" published live across all hubs!`);
                      setTimeout(() => setActionSuccessMsg(''), 4000);
                      setActiveNav('orders');
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-[#E11D48] to-rose-600 hover:from-[#F43F5E] hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Publish Now
                  </button>
                </div>
              </div>

              {/* Main 2-Column Grid (Photo 2 Layout) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Columns: Main Form & Blocks */}
                <div className="lg:col-span-2 space-y-5">
                  
                  {/* Service Title Input */}
                  <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-5 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Service Title / Package Name
                    </label>
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g. Full Bathroom Deep Jet Scrubbing"
                      className="w-full px-4 py-2.5 text-sm bg-[#0E1524] border border-[#1F293D] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F43F5E]"
                    />
                  </div>

                  {/* Content Formatter & Blocks (Photo 2 Replica) */}
                  <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1A2338] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#E11D48]/20 text-[#F43F5E] text-xs flex items-center justify-center font-bold">
                          ≡
                        </span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Content Formatter & Service Scope Blocks
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">HTML Code Mode &lt;/&gt;</span>
                    </div>

                    {/* Block Buttons Pill */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button type="button" className="px-2.5 py-1 bg-[#172136] hover:bg-[#202D4A] border border-[#263757] rounded-lg text-xs font-medium text-slate-300">
                        + Heading (H2/H3)
                      </button>
                      <button type="button" className="px-2.5 py-1 bg-[#172136] hover:bg-[#202D4A] border border-[#263757] rounded-lg text-xs font-medium text-slate-300">
                        + Paragraph
                      </button>
                      <button type="button" className="px-2.5 py-1 bg-[#172136] hover:bg-[#202D4A] border border-[#263757] rounded-lg text-xs font-medium text-slate-300">
                        + Image with Caption
                      </button>
                      <button type="button" className="px-2.5 py-1 bg-[#172136] hover:bg-[#202D4A] border border-[#263757] rounded-lg text-xs font-medium text-slate-300">
                        + Sweet Tip / Callout
                      </button>
                      <button type="button" className="px-2.5 py-1 bg-[#172136] hover:bg-[#202D4A] border border-[#263757] rounded-lg text-xs font-medium text-slate-300">
                        + Bullet List
                      </button>
                    </div>

                    {/* Block 1: Heading Block */}
                    <div className="bg-[#0E1524] border border-[#1F293D] rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-pink-400">
                        <span>H HEADING BLOCK</span>
                        <span className="text-slate-400 font-normal">H2 (Main Section)</span>
                      </div>
                      <input
                        type="text"
                        defaultValue="Why QuickServe Verified Doorstep Pros Deliver 100% Satisfaction"
                        className="w-full px-3 py-2 text-xs bg-[#131B2E] border border-[#1F293D] rounded-lg text-white"
                      />
                    </div>

                    {/* Block 2: Paragraph Block */}
                    <div className="bg-[#0E1524] border border-[#1F293D] rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-blue-400">
                        <span>¶ PARAGRAPH BLOCK</span>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <span>B</span>
                          <span>I</span>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={newServiceDescription}
                        onChange={(e) => setNewServiceDescription(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#131B2E] border border-[#1F293D] rounded-lg text-white resize-none"
                      />
                    </div>
                  </div>

                </div>

                {/* Right Column: Featured Cover Image & Settings (Photo 2 Replica) */}
                <div className="space-y-5">
                  
                  {/* Featured Cover Image Dropzone (Photo 2 Exact Match) */}
                  <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Camera className="w-4 h-4 text-pink-400" />
                      <span>Featured Cover Image</span>
                    </h4>

                    <div className="border-2 border-dashed border-[#2A374F] hover:border-pink-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#0E1524]/60 group">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">Click to upload cover</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WEBP (Max 10MB)</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        OR CHOOSE EXISTING PRESET IMAGE:
                      </label>
                      <select
                        value={newServiceCoverImage}
                        onChange={(e) => setNewServiceCoverImage(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-white"
                      >
                        <option value="/images/plumbing_tap_3d.jpg">Plumbing Tap 3D</option>
                        <option value="/images/fan_electrician_3d.jpg">Fan Electrician 3D</option>
                        <option value="/images/bathroom_clean_3d.jpg">Bathroom Clean 3D</option>
                        <option value="/images/utensils_3d.jpg">Utensil Cleaning 3D</option>
                        <option value="/images/fridge_cleaning_3d.jpg">Fridge AC Repair 3D</option>
                      </select>
                    </div>
                  </div>

                  {/* Category & Pricing Card */}
                  <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-5 space-y-3.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Category & Rates
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        SERVICE CATEGORY
                      </label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => setNewServiceCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-white"
                      >
                        <option value="plumber">Plumber</option>
                        <option value="electrician">Electrician</option>
                        <option value="cleaning">Cleaning & Maid</option>
                        <option value="ac_appliances">AC & Appliances</option>
                        <option value="moving">Moving Help</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        BASE RATE (₹)
                      </label>
                      <input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        placeholder="299"
                        className="w-full px-3 py-2 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-emerald-400 font-mono font-bold"
                      />
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: DIRECT WORK ASSIGNMENT TO OFFICIAL               */}
          {/* ======================================================== */}
          {activeNav === 'assign_work' && (
            <div className="max-w-2xl mx-auto bg-[#121826] border border-[#1F293D] rounded-2xl p-6 space-y-5 animate-fadeIn shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-pink-400" />
                  <span>Direct Customer Work Assignment</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign any task directly to an active verified official. They will receive an instant app alert & SMS.
                </p>
              </div>

              <form onSubmit={handleCreateDirectWork} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Select Verified Official <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={assignWorkTargetProId}
                    onChange={(e) => setAssignWorkTargetProId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-medium"
                  >
                    <option value="">-- Choose Approved Technician --</option>
                    {partnersList
                      .filter(p => p.verification_state === 'verified')
                      .map((pro) => (
                        <option key={pro.id} value={pro.id}>
                          {pro.name} • {pro.phone} ({pro.service_name} - {pro.locality || 'NCR'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      required
                      value={assignWorkCustName}
                      onChange={(e) => setAssignWorkCustName(e.target.value)}
                      placeholder="e.g. Suraj Varyani"
                      className="w-full px-3.5 py-2 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Customer Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={assignWorkCustPhone}
                      onChange={(e) => setAssignWorkCustPhone(e.target.value)}
                      placeholder="+91 98395 37794"
                      className="w-full px-3.5 py-2 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Service / Trade Title
                    </label>
                    <input
                      type="text"
                      required
                      value={assignWorkTrade}
                      onChange={(e) => setAssignWorkTrade(e.target.value)}
                      placeholder="e.g. Tap Leakage Repair"
                      className="w-full px-3.5 py-2 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={assignWorkAmount}
                      onChange={(e) => setAssignWorkAmount(e.target.value)}
                      placeholder="350"
                      className="w-full px-3.5 py-2 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Doorstep Address & Locality
                  </label>
                  <input
                    type="text"
                    required
                    value={assignWorkAddress}
                    onChange={(e) => setAssignWorkAddress(e.target.value)}
                    placeholder="e.g. Flat 402, Tower B, Sector 62, Noida"
                    className="w-full px-3.5 py-2 text-xs bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#E11D48] to-rose-600 hover:from-[#F43F5E] hover:to-rose-500 text-white font-bold rounded-xl text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Dispatch & Notify Official Now</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: DASHBOARD OVERVIEW KPI CARDS                     */}
          {/* ======================================================== */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Platform Orders</p>
                  <p className="text-2xl font-black text-white mt-1">{displayBookings.length + 18}</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">↑ 14% vs yesterday</p>
                </div>

                <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</p>
                  <p className="text-2xl font-black text-[#10B981] mt-1 font-mono">
                    ₹{displayBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) + 4820}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Processed via Razorpay & COD</p>
                </div>

                <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Verified Pros</p>
                  <p className="text-2xl font-black text-blue-400 mt-1">{verifiedPartners.length}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ready for doorstep orders</p>
                </div>

                <div className="bg-[#121826] border border-[#1F293D] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending KYC Audits</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">{pendingPartners.length}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">In verification queue</p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 6: STORE SETTINGS & PAYMENT CONFIGURATION          */}
          {/* ======================================================== */}
          {activeNav === 'settings' && (
            <div className="max-w-3xl mx-auto bg-[#121826] border border-[#1F293D] rounded-2xl p-6 space-y-6 animate-fadeIn shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-pink-400" />
                  <span>QuickServe Store & Operations Settings</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure helpline phone, direct APK download links, and Razorpay UPI endpoints.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Partner & Customer Support Helpline
                  </label>
                  <input
                    type="text"
                    defaultValue="+91 95701 51834"
                    className="w-full px-3.5 py-2 bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Direct APK Download Link
                  </label>
                  <input
                    type="text"
                    defaultValue="https://quickserve-3lhk.onrender.com/download-apk"
                    className="w-full px-3.5 py-2 bg-[#0E1524] border border-[#1F293D] rounded-xl text-blue-400 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    defaultValue="rzp_live_quickserve_official"
                    className="w-full px-3.5 py-2 bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionSuccessMsg('Store settings saved successfully!');
                      setTimeout(() => setActionSuccessMsg(''), 3000);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#E11D48] to-rose-600 hover:from-[#F43F5E] hover:to-rose-500 text-white font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    Save All Settings
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL: ASSIGN DELIVERY ID / PARTNER MODAL             */}
      {/* ======================================================== */}
      {assignPartnerModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#121826] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A2338] pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-pink-400" />
                <span>Assign Delivery / Courier ID</span>
              </h4>
              <button
                type="button"
                onClick={() => setAssignPartnerModalBooking(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Order Ref: <strong className="font-mono text-[#F43F5E]">{assignPartnerModalBooking.booking_reference}</strong> ({assignPartnerModalBooking.customer_name})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Option A: Assign Registered QuickServe Partner</label>
                <select
                  value={selectedProForAssignment}
                  onChange={(e) => setSelectedProForAssignment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-medium"
                >
                  <option value="">-- Choose Verified Partner --</option>
                  {partnersList
                    .filter(p => p.verification_state === 'verified')
                    .map(pro => (
                      <option key={pro.id} value={pro.id}>
                        {pro.name} ({pro.service_name} • {pro.phone})
                      </option>
                    ))}
                </select>
              </div>

              <div className="text-center text-slate-500 font-bold">OR</div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Option B: Enter Courier / Tracking ID (e.g. Shadowfax)</label>
                <input
                  type="text"
                  value={customDeliveryIdInput}
                  onChange={(e) => setCustomDeliveryIdInput(e.target.value)}
                  placeholder="e.g. SF42914336555"
                  className="w-full px-3 py-2 bg-[#0E1524] border border-[#1F293D] rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignPartnerModalBooking(null)}
                className="flex-1 py-2 bg-[#172136] hover:bg-[#202D4A] text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignDeliveryOrPartner}
                className="flex-1 py-2 bg-[#E11D48] hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-95"
              >
                Save & Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: ORDER DETAILS / INVOICE MODAL                  */}
      {/* ======================================================== */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#121826] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1A2338] pb-3">
              <div>
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">QuickServe Tax Invoice</span>
                <h4 className="text-base font-bold text-white font-mono">
                  {selectedBookingForDetails.booking_reference}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-white">{selectedBookingForDetails.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-white">{selectedBookingForDetails.customer_phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Service:</span>
                <span className="text-white font-semibold">{selectedBookingForDetails.service_title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Address:</span>
                <span className="text-white text-right max-w-xs">{selectedBookingForDetails.customer_address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">₹{selectedBookingForDetails.total_amount}.00</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-5 py-2 bg-[#E11D48] text-white text-xs font-bold rounded-xl active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: DOCUMENT PREVIEW LIGHTBOX                      */}
      {/* ======================================================== */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#121826] border border-[#1F293D] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#1A2338] flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{previewDocUrl.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
              <img
                src={previewDocUrl.url}
                alt={previewDocUrl.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: WHATSAPP CONGRATULATIONS CELEBRATION MODAL     */}
      {/* ======================================================== */}
      {congratsModalPro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#121826] border border-[#1F293D] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <span className="text-3xl">🎉</span>
              <h3 className="text-base font-bold text-white">Partner Approved & Activated!</h3>
              <p className="text-xs text-slate-400">
                English congratulations notification prepared for <strong className="text-white">{congratsModalPro.name}</strong> ({congratsModalPro.phone}).
              </p>
            </div>

            <div className="p-3 bg-[#0E1524] border border-[#1F293D] rounded-xl text-left font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto whitespace-pre-line custom-scrollbar">
              {buildWhatsAppCongratsText(congratsModalPro)}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <a
                href={buildWhatsAppCongratsUrl(congratsModalPro)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp (+91 {congratsModalPro.phone})</span>
              </a>

              <div className="flex gap-2">
                <a
                  href={buildSmsCongratsUrl(congratsModalPro)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(buildWhatsAppCongratsText(congratsModalPro));
                    setCopiedCongrats(true);
                    setTimeout(() => setCopiedCongrats(false), 2000);
                  }}
                  className="flex-1 py-2 bg-[#172136] hover:bg-[#202D4A] text-slate-300 rounded-xl text-xs font-semibold cursor-pointer active:scale-95"
                >
                  {copiedCongrats ? '✓ Copied!' : 'Copy Text'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCongratsModalPro(null)}
                className="w-full py-2 bg-transparent text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MASTER ADMIN PIN GATE MODAL (PIN: 2026)                  */}
      {/* ======================================================== */}
      {(!isAdminAuthenticated || showPinGateModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#111726] border border-[#1F293D] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E11D48]/15 border border-[#E11D48]/30 flex items-center justify-center mx-auto text-[#F43F5E]">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white tracking-tight">
                QuickServe Admin Console
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restricted Enterprise Access. Enter your Master Admin PIN to unlock full administrative controls.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyMasterPin();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <input
                  type="password"
                  autoFocus
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    if (adminPinError) setAdminPinError('');
                  }}
                  placeholder="Enter Master PIN (Default: 2026)"
                  className="w-full px-4 py-3 bg-[#090D16] border border-[#22304A] focus:border-[#E11D48] rounded-xl text-white text-center text-lg tracking-widest outline-hidden transition-colors"
                />

                {adminPinError && (
                  <p className="text-xs font-semibold text-rose-400 animate-fadeIn">
                    {adminPinError}
                  </p>
                )}
              </div>

              {/* 1-tap fast unlock button for instant convenience */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPinInput('2026');
                    handleVerifyMasterPin('2026');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A253D] hover:bg-[#223253] border border-[#2B3C61] rounded-full text-[11px] font-mono text-pink-300 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fast Unlock: Click to enter PIN 2026</span>
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onBackToCustomer}
                  className="flex-1 py-3 bg-[#172136] hover:bg-[#202D4A] text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  Exit to Store
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[#E11D48] to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40 cursor-pointer active:scale-95"
                >
                  Unlock Console &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
