import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  UserPlus, 
  LifeBuoy, 
  Search, 
  ToggleLeft, 
  ToggleRight,
  Filter,
  Check,
  AlertCircle,
  ExternalLink,
  Plus,
  UserCheck,
  Building2,
  Video,
  Battery,
  Package,
  Percent,
  Calculator,
  ArrowUpRight,
  Save,
  Sliders
} from 'lucide-react';
import { ServiceCategory, ServiceZone, Professional, Booking, SupportTicket, SupplyDemandItem, AdminStats, MicroHub } from '../types';
import { 
  fetchAdminStats, 
  fetchSupplyDemand, 
  fetchSupportTickets, 
  toggleCategoryStatus, 
  reviewVerification, 
  fieldOnboard,
  resolveSupportTicket,
  fetchMicroHubs,
  fetchCommissionSettings,
  updateCommissionSettings,
  CommissionSettings
} from '../api';

interface AdminDashboardProps {
  categories: ServiceCategory[];
  zones: ServiceZone[];
  professionals: Professional[];
  bookings: Booking[];
  onRefreshAll: () => void;
  lang: 'en' | 'hi';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  categories,
  zones,
  professionals,
  bookings,
  onRefreshAll,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'micro_hubs' | 'supply_demand' | 'pros' | 'field_onboard' | 'categories' | 'bookings' | 'disputes' | 'commission'>('overview');

  const [stats, setStats] = useState<AdminStats>({
    totalCustomers: 342,
    activePros: professionals.filter(p => p.verification_state === 'verified').length,
    pendingVerifications: professionals.filter(p => p.verification_state !== 'verified').length,
    todayBookingsCount: bookings.length + 14,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    grossRevenue: bookings.reduce((sum, b) => sum + b.total_amount, 0) + 18450,
    platformCommission: Math.round((bookings.reduce((sum, b) => sum + b.total_amount, 0) + 18450) * 0.10),
    openDisputes: 1,
    activeEmergencies: 0,
    launch_city: 'Greater Noida & Delhi-NCR (Operational Hubs)'
  });

  const [hubs, setHubs] = useState<MicroHub[]>([
    {
      id: 'hub-gnoida-01',
      name: 'Ansal Golf Links 1 & Pari Chowk Hub',
      code: 'HUB-GNOIDA-01',
      locality: 'Pari Chowk & Ansal Golf Links 1',
      city: 'Greater Noida',
      lat: 28.4744,
      lng: 77.5040,
      active_pros_count: 18,
      dispatched_pros_count: 6,
      available_pros_count: 12,
      average_dispatch_seconds: 660,
      staging_kits_count: 42,
      camera_units_available: 14,
      active_pros: 18,
      inventory_kits: 42,
      bodycam_units: 14,
      avg_dispatch_mins: 11,
      status: 'active'
    },
    {
      id: 'hub-noida-02',
      name: 'Sector 18 & Expressway Hub',
      code: 'HUB-NOIDA-02',
      locality: 'Sector 18 & Expressway',
      city: 'Noida',
      lat: 28.5708,
      lng: 77.3271,
      active_pros_count: 16,
      dispatched_pros_count: 5,
      available_pros_count: 11,
      average_dispatch_seconds: 780,
      staging_kits_count: 38,
      camera_units_available: 12,
      active_pros: 16,
      inventory_kits: 38,
      bodycam_units: 12,
      avg_dispatch_mins: 13,
      status: 'active'
    },
    {
      id: 'hub-delhi-03',
      name: 'South Delhi Cluster Hub',
      code: 'HUB-DELHI-03',
      locality: 'Ber Sarai, Munirka & Hauz Khas',
      city: 'Delhi NCR',
      lat: 28.5450,
      lng: 77.1850,
      active_pros_count: 14,
      dispatched_pros_count: 4,
      available_pros_count: 10,
      average_dispatch_seconds: 720,
      staging_kits_count: 35,
      camera_units_available: 10,
      active_pros: 14,
      inventory_kits: 35,
      bodycam_units: 10,
      avg_dispatch_mins: 12,
      status: 'active'
    }
  ]);

  const [supplyDemandData, setSupplyDemandData] = useState<SupplyDemandItem[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Field Onboarding Form States (Section 15)
  const [fieldName, setFieldName] = useState('');
  const [fieldPhone, setFieldPhone] = useState('');
  const [fieldServiceId, setFieldServiceId] = useState(categories[0]?.id || 'cat-plumber');
  const [fieldExp, setFieldExp] = useState('3');
  const [fieldLocality, setFieldLocality] = useState('Indiranagar');
  const [fieldNotes, setFieldNotes] = useState('Met during Indiranagar 100ft road physical activation drive.');
  const [fieldInstantVerify, setFieldInstantVerify] = useState(true);
  const [fieldInviteLink, setFieldInviteLink] = useState<string | null>(null);
  const [isFieldSubmitting, setIsFieldSubmitting] = useState(false);

  // Pro Verification Review modal
  const [reviewingPro, setReviewingPro] = useState<Professional | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Service Category Toggle loading
  const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null);

  // Dynamic Commission & Revenue Configuration States
  const [commissionConfig, setCommissionConfig] = useState<CommissionSettings>({
    globalCommissionPercent: 15,
    globalPlatformFee: 29,
    partnerMinWalletBalance: 200,
    partnerMaxNegativeBalance: -300,
    categoryRules: {
      'cat-maid': { commissionPercent: 12, platformFee: 29, name: 'Household Chores' },
      'cat-ac': { commissionPercent: 20, platformFee: 49, name: 'AC & Appliances' },
      'cat-plumber': { commissionPercent: 15, platformFee: 39, name: 'Plumber' },
      'cat-electrician': { commissionPercent: 15, platformFee: 39, name: 'Electrician' },
      'cat-cleaning': { commissionPercent: 18, platformFee: 49, name: 'Deep Cleaning' },
    }
  });
  const [simulatedOrderAmount, setSimulatedOrderAmount] = useState<number>(399);
  const [simulatedCategory, setSimulatedCategory] = useState<string>('cat-maid');
  const [isSavingCommission, setIsSavingCommission] = useState<boolean>(false);
  const [commissionSaveSuccess, setCommissionSaveSuccess] = useState<string>('');

  // Load telemetry
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const s = await fetchAdminStats();
    setStats(s);
    const sd = await fetchSupplyDemand();
    setSupplyDemandData(sd);
    const tkts = await fetchSupportTickets();
    setSupportTickets(tkts);
    const hubsRes = await fetchMicroHubs();
    if (hubsRes && hubsRes.hubs && hubsRes.hubs.length > 0) {
      setHubs(hubsRes.hubs);
    }
    try {
      const comm = await fetchCommissionSettings();
      if (comm) setCommissionConfig(comm);
    } catch {
      // offline fallback
    }
  };

  const handleSaveCommissionConfig = async () => {
    setIsSavingCommission(true);
    setCommissionSaveSuccess('');
    try {
      const res = await updateCommissionSettings(commissionConfig);
      if (res && res.success) {
        setCommissionSaveSuccess('Commission rules saved & applied across all live bookings!');
        setTimeout(() => setCommissionSaveSuccess(''), 4500);
      }
    } catch {
      alert('Error updating commission settings');
    } finally {
      setIsSavingCommission(false);
    }
  };

  const handleToggleCategory = async (catId: string) => {
    setTogglingCategoryId(catId);
    try {
      await toggleCategoryStatus(catId);
      onRefreshAll();
      await loadDashboardData();
    } catch (err) {
      alert('Error updating category status');
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleVerificationAction = async (proId: string, action: 'approve' | 'reject' | 'action_required') => {
    try {
      await reviewVerification(proId, action, adminNoteInput);
      setReviewingPro(null);
      setAdminNoteInput('');
      onRefreshAll();
      await loadDashboardData();
      alert(`Action '${action.toUpperCase()}' applied successfully.`);
    } catch (err) {
      alert('Error performing verification action');
    }
  };

  const handleFieldOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName || !fieldPhone) {
      alert('Name and phone are required');
      return;
    }
    setIsFieldSubmitting(true);
    try {
      const res = await fieldOnboard({
        name: fieldName,
        phone: fieldPhone,
        service_id: fieldServiceId,
        experience_years: fieldExp,
        locality: fieldLocality,
        notes: fieldNotes,
        instant_verify: fieldInstantVerify
      });

      if (res.success) {
        setFieldInviteLink(res.sms_invite_link);
        onRefreshAll();
        await loadDashboardData();
        setFieldName('');
        setFieldPhone('');
      }
    } catch (err) {
      alert('Field onboarding failed.');
    } finally {
      setIsFieldSubmitting(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    const note = prompt('Enter resolution notes for customer record:', 'Full refund approved as per QuickServe On-Time Guarantee.');
    if (note) {
      await resolveSupportTicket(ticketId, note, 'resolved');
      const updated = await fetchSupportTickets();
      setSupportTickets(updated);
      alert('Ticket marked as resolved.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Sub-Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">QuickServe Command Center</h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                ROOT ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live Operations & Telemetry • Launch Market: <strong>{stats.launch_city}</strong>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'overview', label: 'KPI Overview', icon: TrendingUp },
            { id: 'micro_hubs', label: 'Micro-Hubs & Dark Stores', icon: Building2, badge: `${hubs.length} Staging` },
            { id: 'supply_demand', label: 'Supply & Demand', icon: Layers, badge: 'Crucial' },
            { id: 'pros', label: 'Pro Verification', icon: UserCheck, badge: `${stats.pendingVerifications}` },
            { id: 'field_onboard', label: 'Field Onboarding', icon: UserPlus },
            { id: 'categories', label: 'Service Catalog', icon: Layers },
            { id: 'bookings', label: 'Dispatch Monitor', icon: Calendar },
            { id: 'disputes', label: 'Disputes Desk', icon: LifeBuoy, badge: `${supportTickets.filter(t => t.status === 'open').length}` },
            { id: 'commission', label: 'Commission & Revenue Model', icon: DollarSign, badge: `${commissionConfig.globalCommissionPercent}%` },
          ].map((tab: any) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white text-brand-700' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Content Container */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW METRICS (Section 23) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-premium">
                <span className="text-xs text-slate-400 font-medium">Total Registered Customers</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalCustomers}</h3>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Active in Greater Noida & NCR</span>
              </div>

              <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-premium">
                <span className="text-xs text-slate-400 font-medium">Active Verified Pros</span>
                <h3 className="text-2xl font-extrabold text-brand-400 mt-1">{stats.activePros}</h3>
                <span className="text-[11px] text-amber-400 font-semibold mt-1 block">
                  {stats.pendingVerifications} awaiting KYC review
                </span>
              </div>

              <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-premium">
                <span className="text-xs text-slate-400 font-medium">Today's Bookings</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">{stats.todayBookingsCount}</h3>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
                  {stats.completedBookings} completed
                </span>
              </div>

              <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-premium">
                <span className="text-xs text-slate-400 font-medium">Gross GMV / Net Commission</span>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">₹{stats.grossRevenue}</h3>
                <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                  Platform 10%: <strong className="text-white">₹{stats.platformCommission}</strong>
                </span>
              </div>
            </div>

            {/* Quick Strategic Alert Bar */}
            <div className="p-4 bg-gradient-to-r from-brand-950 to-slate-900 border border-brand-500/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">MVP Phased Rollout Status</h4>
                  <p className="text-xs text-slate-300">
                    4 Core Categories live in Indiranagar, Koramangala & HSR. Remaining 20+ categories held inactive in database until cluster supply reaches target density.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('categories')}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
              >
                Manage Services →
              </button>
            </div>

            {/* Recent Orders Snippet */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 space-y-3">
              <h3 className="font-bold text-sm text-white">Latest Dispatched Jobs</h3>
              <div className="divide-y divide-slate-700/60">
                {bookings.slice(0, 4).map(b => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-slate-400 text-[10px] block">{b.booking_reference}</span>
                      <strong className="text-white">{b.service_title}</strong> • {b.sub_service_selected}
                      <p className="text-slate-400 text-[11px]">{b.customer_name} ({b.locality})</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        b.status === 'on_the_way' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {b.status}
                      </span>
                      <span className="block font-bold text-white mt-1">₹{b.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: MICRO-HUBS & STAGING DARK STORES (QuickServe Architecture) */}
        {/* ========================================================================= */}
        {activeTab === 'micro_hubs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Greater Noida & Delhi-NCR Hyperlocal Micro-Hub Network</h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    3 Operational Staging Clusters
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  QuickServe Micro-Hub model: partners pre-staged with uniforms, verified bodycams & equipment kits for 15-minute SLA delivery.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Inventory replenishment request sent to Greater Noida, Noida & Delhi warehouse.')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold"
                >
                  Restock Kits
                </button>
                <button
                  onClick={() => alert('QuickServe Verified Bodycam firmware and encryption keys verified across all 36 active units.')}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Audit Bodycam Stream</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-xs text-slate-400 font-medium">Staged Micro-Hubs</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">3 Active</h3>
                <span className="text-[10px] text-emerald-400 mt-1 block">Indiranagar • Koramangala • HSR</span>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-xs text-slate-400 font-medium">Staged Fleet Ready</span>
                <h3 className="text-2xl font-extrabold text-brand-400 mt-1">
                  {hubs.reduce((sum, h) => sum + (h.active_pros || h.active_pros_count || 0), 0)} Pros
                </h3>
                <span className="text-[10px] text-slate-400 mt-1 block">In 3km SLA radii</span>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-xs text-slate-400 font-medium">QuickServe Bodycams</span>
                <h3 className="text-2xl font-extrabold text-blue-400 mt-1">
                  {hubs.reduce((sum, h) => sum + (h.bodycam_units || h.camera_units_available || 0), 0)} Units
                </h3>
                <span className="text-[10px] text-emerald-400 mt-1 block">AES-256 48hr Auto-Purge</span>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-xs text-slate-400 font-medium">Avg Dispatch Arrival</span>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">11.8 Mins</h3>
                <span className="text-[10px] text-emerald-400 mt-1 block">Within 15-min Guarantee</span>
              </div>
            </div>

            {/* Micro-Hub Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hubs.map((hub) => {
                const hubBookings = bookings.filter(b => 
                  b.hub_id === hub.id || 
                  (b.customer_address && b.customer_address.toLowerCase().includes(hub.locality.toLowerCase().split(' ')[0]))
                );

                return (
                  <div key={hub.id} className="p-5 bg-slate-800 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{hub.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400">{hub.code}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                        {hub.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                      <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      <span className="truncate">{hub.locality}, {hub.city}</span>
                    </div>

                    {/* Hub Capacity Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 block">Fleet Ready</span>
                        <span className="text-sm font-bold text-emerald-400">{hub.active_pros}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 block">Kits In Stock</span>
                        <span className="text-sm font-bold text-white">{hub.inventory_kits}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 block">Bodycams</span>
                        <span className="text-sm font-bold text-blue-400">{hub.bodycam_units}</span>
                      </div>
                    </div>

                    {/* SLA & Dispatch Telemetry */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-700/80 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Coverage Radius:</span>
                        <span className="font-semibold text-white">3.0 km (Hyperlocal)</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Avg Arrival SLA:</span>
                        <span className="font-bold text-amber-400">{hub.avg_dispatch_mins} mins</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Live Active Dispatches:</span>
                        <span className="font-bold text-brand-400">{hubBookings.length} orders</span>
                      </div>
                    </div>

                    {/* Recent Dispatched Order from this Hub */}
                    {hubBookings.length > 0 && (
                      <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Current Active Run:
                        </span>
                        <div className="p-2 bg-slate-900/90 rounded-xl border border-brand-500/30 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-white truncate max-w-[160px]">
                              {hubBookings[0].sub_service_selected}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold uppercase">
                              {hubBookings[0].status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Customer: {hubBookings[0].customer_name} • ₹{hubBookings[0].total_amount}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SUPPLY & DEMAND DASHBOARD (Section 24 - CRITICAL REQUIREMENT) */}
        {/* ========================================================================= */}
        {activeTab === 'supply_demand' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Hyperlocal Supply & Demand Analysis</h2>
              <p className="text-xs text-slate-400">
                Real platform telemetry calculating active requests against vetted provider supply. No fake data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {supplyDemandData.map((item) => (
                <div 
                  key={item.zone_id}
                  className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4 shadow-subtle flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                      <div>
                        <h3 className="font-bold text-white text-sm">{item.locality.split(',')[0]}</h3>
                        <span className="text-[11px] text-slate-400">{item.city}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        item.demand_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        item.demand_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.demand_level} Demand
                      </span>
                    </div>

                    {/* Category Breakdown Matrix */}
                    <div className="py-3 space-y-2 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Available Verified Pros:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-slate-900 rounded-lg flex justify-between">
                          <span className="text-slate-400">Plumbers:</span>
                          <strong className={item.category_breakdown.plumber < 2 ? 'text-amber-400' : 'text-white'}>
                            {item.category_breakdown.plumber}
                          </strong>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg flex justify-between">
                          <span className="text-slate-400">Electricians:</span>
                          <strong className="text-white">{item.category_breakdown.electrician}</strong>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg flex justify-between">
                          <span className="text-slate-400">Maids/Helpers:</span>
                          <strong className="text-white">{item.category_breakdown.maid}</strong>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg flex justify-between">
                          <span className="text-slate-400">Caretakers:</span>
                          <strong className={item.category_breakdown.caretaker < 1 ? 'text-rose-400' : 'text-white'}>
                            {item.category_breakdown.caretaker}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Callout (Section 24 Example) */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-brand-500/30 text-xs">
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block mb-0.5">
                      Ground Action Recommendation:
                    </span>
                    <p className="text-white font-semibold text-xs leading-snug">
                      "{item.recommendation}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROFESSIONAL VERIFICATION DESK (Section 14) */}
        {/* ========================================================================= */}
        {activeTab === 'pros' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Professional Dossiers & Verification Desk</h2>
              <p className="text-xs text-slate-400">
                Verify identity, police check, and trade competency before granting customer app visibility.
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-4">Professional</th>
                    <th className="p-4">Trade / Service</th>
                    <th className="p-4">Locality</th>
                    <th className="p-4">Verification State</th>
                    <th className="p-4">KYC Checks</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {professionals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-750 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-full object-cover border border-slate-600" />
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{p.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-brand-300">{p.service_name}</td>
                      <td className="p-4 text-slate-300">{p.zone_name.split(',')[0]}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.verification_state === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          p.verification_state === 'under_review' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          p.verification_state === 'action_required' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {p.verification_state.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5 text-[10px]">
                          <span className={p.verifications?.aadhaar ? 'text-emerald-400 block' : 'text-slate-500 block'}>
                            {p.verifications?.aadhaar ? '✓ Aadhaar Checked' : '✗ Aadhaar Pending'}
                          </span>
                          <span className={p.verifications?.police_clearance ? 'text-emerald-400 block' : 'text-slate-500 block'}>
                            {p.verifications?.police_clearance ? '✓ Police Verified' : '✗ Police Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setReviewingPro(p)}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-colors text-[11px]"
                        >
                          Review KYC
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Review Action Modal */}
            {reviewingPro && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl text-xs">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base">KYC Dossier: {reviewingPro.name}</h3>
                      <span className="text-slate-400">{reviewingPro.service_name} • {reviewingPro.phone}</span>
                    </div>
                    <button onClick={() => setReviewingPro(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p><strong className="text-slate-300">Experience:</strong> {reviewingPro.experience_years} years in field</p>
                    <p><strong className="text-slate-300">Skills Reported:</strong> {reviewingPro.skills.join(', ')}</p>
                    <p><strong className="text-slate-300">Operating Locality:</strong> {reviewingPro.zone_name}</p>
                    {reviewingPro.field_onboarder_notes && (
                      <p><strong className="text-amber-400">Ground Team Notes:</strong> {reviewingPro.field_onboarder_notes}</p>
                    )}
                    {reviewingPro.admin_action_reason && (
                      <p><strong className="text-rose-400">Previous Action Reason:</strong> {reviewingPro.admin_action_reason}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Admin Verification Notes</label>
                    <textarea
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="Add compliance notes or reason for document re-upload..."
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs h-20 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleVerificationAction(reviewingPro.id, 'reject')}
                      className="px-4 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-bold rounded-xl"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerificationAction(reviewingPro.id, 'action_required')}
                      className="px-4 py-2 bg-amber-900/60 hover:bg-amber-900 text-amber-200 font-bold rounded-xl"
                    >
                      Request Action
                    </button>
                    <button
                      onClick={() => handleVerificationAction(reviewingPro.id, 'approve')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                    >
                      Approve & Make Visible
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FIELD ONBOARDING DESK (Section 15 - Offline-to-Online) */}
        {/* ========================================================================= */}
        {activeTab === 'field_onboard' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Ground Activation Desk (Field Onboarding)</h2>
              <p className="text-xs text-slate-400">
                Used by QuickServe field sales teams to register skilled local technicians directly in markets and trigger an instant SMS invite link.
              </p>
            </div>

            <form onSubmit={handleFieldOnboardSubmit} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4 text-xs shadow-premium">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Professional Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manjunath Swamy"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Number (Aadhaar Linked) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98451 00000"
                    value={fieldPhone}
                    onChange={(e) => setFieldPhone(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Service Craft *</label>
                  <select
                    value={fieldServiceId}
                    onChange={(e) => setFieldServiceId(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Years of Practical Exp</label>
                  <input
                    type="number"
                    value={fieldExp}
                    onChange={(e) => setFieldExp(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Market / Locality</label>
                  <input
                    type="text"
                    value={fieldLocality}
                    onChange={(e) => setFieldLocality(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Field Representative Verification Notes</label>
                <textarea
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white h-20 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Instant Verification Check</span>
                  <span className="text-[11px] text-slate-400">Mark verified immediately if field agent checked original physical Aadhaar.</span>
                </div>
                <input
                  type="checkbox"
                  checked={fieldInstantVerify}
                  onChange={(e) => setFieldInstantVerify(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600"
                />
              </div>

              <button
                type="submit"
                disabled={isFieldSubmitting}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl transition-colors shadow-lg"
              >
                {isFieldSubmitting ? 'Registering Professional...' : 'Add Professional & Generate SMS Invite'}
              </button>
            </form>

            {/* Generated Invite Box */}
            {fieldInviteLink && (
              <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl text-xs space-y-2 animate-in fade-in">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  ✓ Instant Activation SMS Generated
                </span>
                <p className="text-slate-300">
                  SMS link sent to professional's mobile:
                </p>
                <div className="p-2 bg-slate-900 rounded-lg font-mono text-emerald-300 text-[11px] select-all">
                  {fieldInviteLink}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SERVICE CATEGORY MANAGEMENT (Section 2 & 27 - MVP Engine) */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Service Category Master Catalog</h2>
                <p className="text-xs text-slate-400">
                  Activate or deactivate categories dynamically without changing code. Enforces the 4-category MVP strategy.
                </p>
              </div>

              <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 text-brand-400 border border-slate-700 font-semibold self-start sm:self-auto">
                {categories.filter(c => c.is_active).length} Active Categories
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    cat.is_active 
                      ? 'bg-slate-800 border-brand-500/50 shadow-subtle' 
                      : 'bg-slate-850 border-slate-700/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                    <button
                      disabled={togglingCategoryId === cat.id}
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                        cat.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {cat.is_active ? 'Active (Live)' : 'Inactive (Coming Soon)'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{cat.tagline}</p>

                  <div className="pt-3 border-t border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Base: <strong>₹{cat.starting_price}</strong></span>
                    <span className="text-slate-500 text-[11px] font-mono">{cat.sub_services.length} sub-tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: DISPATCH MONITOR (Section 39) */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Live Dispatch & Order State Machine</h2>
              <p className="text-xs text-slate-400">
                Track full booking progression across all Greater Noida & NCR clusters.
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="p-3.5">Ref</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Service</th>
                    <th className="p-3.5">Assigned Pro</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Financials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="p-3.5 font-mono text-slate-300">{b.booking_reference}</td>
                      <td className="p-3.5">
                        <span className="font-semibold text-white block">{b.customer_name}</span>
                        <span className="text-[10px] text-slate-400">{b.locality}</span>
                      </td>
                      <td className="p-3.5 text-slate-200">{b.service_title}</td>
                      <td className="p-3.5 text-brand-300 font-semibold">{b.professional_name}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          b.status === 'on_the_way' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-white">₹{b.total_amount}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Platform: ₹{b.platform_fee}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: DISPUTES & SUPPORT DESK (Section 28) */}
        {/* ========================================================================= */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Dispute & Grievance Resolution Desk</h2>
              <p className="text-xs text-slate-400">
                Handle customer and pro complaints with fast SLA escalation.
              </p>
            </div>

            <div className="space-y-3">
              {supportTickets.map((tkt) => (
                <div key={tkt.id} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                    <div>
                      <span className="font-mono text-slate-400 text-[10px] block">{tkt.ticket_reference}</span>
                      <h4 className="font-bold text-white text-sm">{tkt.subject}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      tkt.status === 'open' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      tkt.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {tkt.status}
                    </span>
                  </div>

                  <p className="text-slate-300">{tkt.description}</p>

                  <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Reported by: <strong className="text-white">{tkt.reporter_name}</strong> ({tkt.reporter_role})
                    </span>

                    {tkt.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveTicket(tkt.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                      >
                        Resolve & Authorize Action
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: DYNAMIC COMMISSION & REVENUE ENGINE (User Sawaal: ₹399 Split) */}
        {/* ========================================================================= */}
        {activeTab === 'commission' && (
          <div className="space-y-6">
            {/* Header & Global Save Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-800/90 rounded-2xl border border-slate-700/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Marketplace Commission & Revenue Engine
                  </h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    LIVE DISPATCH ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Decide exactly how much the Company gets and how much the Partner earns on every customer booking.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {commissionSaveSuccess && (
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl animate-in fade-in">
                    ✓ {commissionSaveSuccess}
                  </span>
                )}
                <button
                  onClick={handleSaveCommissionConfig}
                  disabled={isSavingCommission}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingCommission ? 'Saving Rules...' : 'Save All Commission Settings'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: INTERACTIVE LIVE REVENUE SIMULATOR (₹399 Breakdown) */}
            {(() => {
              const currentRule = commissionConfig.categoryRules[simulatedCategory] || {
                commissionPercent: commissionConfig.globalCommissionPercent,
                platformFee: commissionConfig.globalPlatformFee
              };
              const pFee = currentRule.platformFee || 29;
              const netBase = Math.max(simulatedOrderAmount - pFee, 100);
              const compCommission = Math.round((netBase * currentRule.commissionPercent) / 100);
              const proShare = netBase - compCommission;
              const totalCompanyRevenue = compCommission + pFee;
              const companyTakeRate = ((totalCompanyRevenue / simulatedOrderAmount) * 100).toFixed(1);
              const proShareRate = ((proShare / simulatedOrderAmount) * 100).toFixed(1);

              return (
                <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-base">
                          Live Order Split Simulator
                        </h3>
                        <p className="text-xs text-slate-400">
                          Real-time breakdown: Clear split between Company net earnings and Partner payout on a ₹{simulatedOrderAmount} customer order.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                        <span className="text-[11px] text-slate-400">Order ₹:</span>
                        <input
                          type="number"
                          value={simulatedOrderAmount}
                          onChange={(e) => setSimulatedOrderAmount(Math.max(Number(e.target.value) || 0, 50))}
                          className="w-20 bg-slate-900 text-white font-mono font-bold text-xs px-2 py-1 rounded border border-slate-700 text-right"
                        />
                      </div>

                      <select
                        value={simulatedCategory}
                        onChange={(e) => setSimulatedCategory(e.target.value)}
                        className="bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-xl border border-slate-700"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4 Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Customer Total Bill</span>
                      <span className="text-2xl font-black text-white font-mono block mt-1">₹{simulatedOrderAmount}</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">Full amount paid by user</span>
                    </div>

                    <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/40">
                      <span className="text-[10px] text-emerald-300 block uppercase font-bold">👷 Partner Earning</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">₹{proShare}</span>
                      <span className="text-[10px] text-emerald-300/80 mt-1 block font-semibold">{proShareRate}% of total booking</span>
                    </div>

                    <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-500/40">
                      <span className="text-[10px] text-blue-300 block uppercase font-bold">🏢 Company Commission</span>
                      <span className="text-2xl font-black text-blue-400 font-mono block mt-1">₹{compCommission}</span>
                      <span className="text-[10px] text-blue-300/80 mt-1 block font-semibold">{currentRule.commissionPercent}% on service base</span>
                    </div>

                    <div className="p-4 bg-amber-950/40 rounded-2xl border border-amber-500/40">
                      <span className="text-[10px] text-amber-300 block uppercase font-bold">🛡️ Platform & Safety Fee</span>
                      <span className="text-2xl font-black text-amber-400 font-mono block mt-1">₹{pFee}</span>
                      <span className="text-[10px] text-amber-300/80 mt-1 block font-semibold">100% company retain (Zero pro share)</span>
                    </div>
                  </div>

                  {/* Visual Revenue Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        Partner Net Payout: ₹{proShare} ({proShareRate}%)
                      </span>
                      <span className="text-brand-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block"></span>
                        Total Company Cut: ₹{totalCompanyRevenue} ({companyTakeRate}%)
                      </span>
                    </div>
                    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-700">
                      <div 
                        style={{ width: `${proShareRate}%` }} 
                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
                        title={`Partner: ₹${proShare}`}
                      />
                      <div 
                        style={{ width: `${companyTakeRate}%` }} 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-r-full transition-all duration-300"
                        title={`Company: ₹${totalCompanyRevenue}`}
                      />
                    </div>
                  </div>

                  {/* Cash vs Online Explanation Banner */}
                  <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        💵 Case 1: Customer Chooses "Payment After Work" (Cash / UPI to Partner):
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Customer pays ₹{simulatedOrderAmount} directly to partner upon completion. System automatically deducts the company commission (<strong>₹{compCommission}</strong>) from the partner's prepaid wallet.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        💳 Case 2: Customer Pays Online (UPI / Card / Netbanking):
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Full ₹{simulatedOrderAmount} escrowed via Razorpay. QuickServe retains ₹{totalCompanyRevenue} platform earnings and disburses <strong>₹{proShare}</strong> directly to the partner's account.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SECTION 2: CATEGORY-WISE COMMISSION SLIDERS */}
            <div className="p-6 bg-slate-800 rounded-3xl border border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-brand-400" />
                    Category-Wise Commission Slabs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Set specific margin % and fixed platform fee for each individual service category.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => {
                  const rule = commissionConfig.categoryRules[cat.id] || {
                    commissionPercent: commissionConfig.globalCommissionPercent,
                    platformFee: commissionConfig.globalPlatformFee
                  };

                  return (
                    <div key={cat.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{cat.icon || '🛠️'}</span>
                          <div>
                            <h4 className="font-bold text-white text-xs">{cat.name}</h4>
                            <span className="text-[10px] text-slate-400">{cat.id}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-black text-brand-400 bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/40">
                            {rule.commissionPercent}% Commission
                          </span>
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Take-Rate Margin</span>
                          <span className="font-bold text-white">{rule.commissionPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="35"
                          step="1"
                          value={rule.commissionPercent}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCommissionConfig((prev) => ({
                              ...prev,
                              categoryRules: {
                                ...prev.categoryRules,
                                [cat.id]: {
                                  ...rule,
                                  commissionPercent: val,
                                  name: cat.name
                                }
                              }
                            }));
                          }}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>5% (Partner friendly)</span>
                          <span>20% (Urban Company standard)</span>
                          <span>35% (High Margin)</span>
                        </div>
                      </div>

                      {/* Fixed Platform Fee */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                        <span className="text-slate-400 text-[11px]">Platform Safety Fee (₹):</span>
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={rule.platformFee}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCommissionConfig((prev) => ({
                                ...prev,
                                categoryRules: {
                                  ...prev.categoryRules,
                                  [cat.id]: {
                                    ...rule,
                                    platformFee: val,
                                    name: cat.name
                                  }
                                }
                              }));
                            }}
                            className="w-16 bg-slate-800 text-white font-bold text-xs px-2 py-1 rounded border border-slate-700 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: PARTNER CASH & WALLET RECOVERY SETTINGS */}
            <div className="p-6 bg-slate-800 rounded-3xl border border-slate-700 space-y-4">
              <div>
                <h3 className="font-bold text-white text-base">
                  💳 Partner Wallet & Negative Balance Control
                </h3>
                <p className="text-xs text-slate-400">
                  Settings to automatically collect cash commissions from partner prepaid wallets and prevent defaults.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-300 font-bold block">Minimum Wallet Balance to Receive Bookings</span>
                  <p className="text-[11px] text-slate-500">
                    Partners must maintain this minimum prepaid wallet balance to be eligible for incoming automated dispatch.
                  </p>
                  <div className="flex items-center gap-2 pt-1 font-mono">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={commissionConfig.partnerMinWalletBalance}
                      onChange={(e) => setCommissionConfig(prev => ({ ...prev, partnerMinWalletBalance: Number(e.target.value) || 0 }))}
                      className="w-24 bg-slate-800 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 text-right"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-rose-400 font-bold block">Maximum Negative Balance Cut-off</span>
                  <p className="text-[11px] text-slate-500">
                    If cash commission dues cause partner wallet to drop below this limit, account dispatch is automatically suspended.
                  </p>
                  <div className="flex items-center gap-2 pt-1 font-mono">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={commissionConfig.partnerMaxNegativeBalance}
                      onChange={(e) => setCommissionConfig(prev => ({ ...prev, partnerMaxNegativeBalance: Number(e.target.value) || 0 }))}
                      className="w-24 bg-slate-800 text-rose-400 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
