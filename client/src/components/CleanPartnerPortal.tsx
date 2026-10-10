import React, { useState, useEffect } from 'react';
import { Booking, Professional, ServiceCategory } from '../types';
import { 
  Wrench, CheckCircle2, Clock, MapPin, Phone, 
  Wallet, ShieldCheck, AlertCircle, ArrowLeft, 
  Calendar, RefreshCw, UserCheck, Briefcase, 
  FileText, Camera, UploadCloud, Eye, X, 
  Lock, ShieldAlert, Sparkles, Check
} from 'lucide-react';

interface CleanPartnerPortalProps {
  categories: ServiceCategory[];
  onBackToCustomer: () => void;
}

export const CleanPartnerPortal: React.FC<CleanPartnerPortalProps> = ({
  categories,
  onBackToCustomer
}) => {
  // Check if active partner saved in storage
  const [partnerProfile, setPartnerProfile] = useState<Professional | null>(() => {
    try {
      const saved = localStorage.getItem('quickserve_active_partner');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Partner Registration Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('cat-plumber');
  const [experience, setExperience] = useState('3');
  const [locality, setLocality] = useState('Pari Chowk, Greater Noida');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarDoc, setAadhaarDoc] = useState<string>('');
  const [selfieDoc, setSelfieDoc] = useState<string>('');
  const [declarationAgreed, setDeclarationAgreed] = useState(true);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regError, setRegError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'profile'>('jobs');
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Admin Verification Desk State
  const [showAdminDesk, setShowAdminDesk] = useState(false);
  const [pendingPartners, setPendingPartners] = useState<Professional[]>([]);
  const [allPartners, setAllPartners] = useState<Professional[]>([]);
  const [isLoadingAdminDesk, setIsLoadingAdminDesk] = useState(false);
  const [adminActionLoadingId, setAdminActionLoadingId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'pending' | 'all'>('pending');
  const [previewDocUrl, setPreviewDocUrl] = useState<{ title: string; url: string } | null>(null);

  // Sample Documents for one-click testing
  const sampleAadhaar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
  const sampleSelfie = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80';

  // Format Aadhaar display (XXXX XXXX XXXX)
  const formatAadhaar = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    return parts.join(' ');
  };

  // Handle file uploads as Base64 Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhaar' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (type === 'aadhaar') setAadhaarDoc(reader.result);
        if (type === 'selfie') setSelfieDoc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Fetch jobs
  const fetchPartnerJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const allBookings: Booking[] = await res.json();
        if (partnerProfile) {
          const relevant = allBookings.filter(b => 
            b.professional_id === partnerProfile.id || 
            b.service_id === partnerProfile.service_id ||
            b.status === 'requested' ||
            b.status === 'confirmed'
          );
          setJobs(relevant);
        } else {
          setJobs(allBookings);
        }
      }
    } catch (e) {
      console.warn('Could not fetch jobs:', e);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Fetch Admin Verification Data
  const fetchAdminVerifications = async () => {
    setIsLoadingAdminDesk(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch('/api/admin/verifications'),
        fetch('/api/admin/partners')
      ]);

      if (pendingRes.ok) {
        const list = await pendingRes.json();
        setPendingPartners(Array.isArray(list) ? list : []);
      }
      if (allRes.ok) {
        const list = await allRes.json();
        setAllPartners(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.warn('Could not fetch admin verifications:', e);
    } finally {
      setIsLoadingAdminDesk(false);
    }
  };

  useEffect(() => {
    if (partnerProfile) {
      fetchPartnerJobs();
    }
    fetchAdminVerifications();
  }, [partnerProfile]);

  // Partner Registration Handler
  const handleRegisterPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!name.trim()) {
      setRegError('Please enter your full name');
      return;
    }
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      setRegError('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const payload = {
        name: name.trim(),
        phone: `+91 ${cleanPhone}`,
        service_id: serviceId,
        experience_years: Number(experience) || 3,
        locality: locality.trim() || 'Pari Chowk, Greater Noida',
        aadhaar_number: cleanAadhaar,
        aadhaar_doc: aadhaarDoc || sampleAadhaar,
        selfie_doc: selfieDoc || sampleSelfie,
        emergency_contact: '+91 95701 51834',
        non_medical_declaration: declarationAgreed
      };

      const res = await fetch('/api/professionals/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const pro: Professional = data.professional || {
          id: `pro-${Date.now()}`,
          name: name.trim(),
          phone: `+91 ${cleanPhone}`,
          avatar: selfieDoc || sampleSelfie,
          service_id: serviceId,
          service_name: categories.find(c => c.id === serviceId)?.name || 'Service Partner',
          experience_years: Number(experience) || 3,
          locality: locality.trim() || 'Pari Chowk, Greater Noida',
          verification_state: 'pending', // 🟡 Genuinely under review
          is_available: false,
          verifications: {
            aadhaar: true,
            police_clearance: false,
            skill_trade_test: false,
            emergency_contact_verified: true
          },
          aadhaar_number: cleanAadhaar,
          aadhaar_doc: aadhaarDoc || sampleAadhaar,
          selfie_doc: selfieDoc || sampleSelfie,
          completed_jobs_count: 0,
          today_earnings: 0,
          available_balance: 0,
          rating: 5.0,
          upi_id: `${cleanPhone}@upi`,
          joined_date: new Date().toISOString().split('T')[0]
        };

        setPartnerProfile(pro);
        localStorage.setItem('quickserve_active_partner', JSON.stringify(pro));
        setActionSuccessMsg('Registration submitted! Your profile is now under safety audit.');
        setTimeout(() => setActionSuccessMsg(''), 4000);
        fetchAdminVerifications();
      } else {
        setRegError('Registration could not be completed. Please try again.');
      }
    } catch (err: any) {
      setRegError('Network error during registration.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // Re-check partner verification status from server
  const handleRefreshPartnerStatus = async () => {
    if (!partnerProfile) return;
    setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/professionals/${partnerProfile.id}`);
      if (res.ok) {
        const updatedPro: Professional = await res.json();
        setPartnerProfile(updatedPro);
        localStorage.setItem('quickserve_active_partner', JSON.stringify(updatedPro));
        if (updatedPro.verification_state === 'verified') {
          setActionSuccessMsg('🎉 Congratulations! Your partner account is approved & active.');
        } else {
          setActionSuccessMsg('Status checked: Verification still in progress by Trust Desk.');
        }
        setTimeout(() => setActionSuccessMsg(''), 3500);
        fetchPartnerJobs();
      }
    } catch (e) {
      console.warn('Status check notice:', e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Admin Action: Approve or Reject Partner
  const handleAdminAction = async (proId: string, action: 'approve' | 'reject') => {
    setAdminActionLoadingId(proId);
    try {
      const res = await fetch(`/api/admin/verifications/${proId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          notes: action === 'approve' ? 'Approved by QuickServe Security Desk' : 'Documents rejected'
        })
      });

      if (res.ok) {
        const data = await res.json();
        // If the approved partner is the currently active partner, update immediately
        if (partnerProfile && partnerProfile.id === proId && data.professional) {
          setPartnerProfile(data.professional);
          localStorage.setItem('quickserve_active_partner', JSON.stringify(data.professional));
        }

        setActionSuccessMsg(
          action === 'approve' 
            ? 'Partner successfully verified & authorized for customer jobs!' 
            : 'Application marked rejected.'
        );
        setTimeout(() => setActionSuccessMsg(''), 3500);
        await fetchAdminVerifications();
      }
    } catch (e) {
      console.warn('Admin action error:', e);
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  // Update job status (Accept -> Start -> Complete)
  const handleUpdateJobStatus = async (jobId: string, newStatus: string) => {
    if (!partnerProfile) return;
    try {
      const res = await fetch(`/api/bookings/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          professional_id: partnerProfile.id,
          professional_name: partnerProfile.name,
          professional_phone: partnerProfile.phone
        })
      });

      if (res.ok) {
        setActionSuccessMsg(`Job updated to ${newStatus.replace('_', ' ')}!`);
        setTimeout(() => setActionSuccessMsg(''), 3000);
        fetchPartnerJobs();

        // If completed, update partner profile earnings locally
        if (newStatus === 'completed') {
          const updated = {
            ...partnerProfile,
            completed_jobs_count: (partnerProfile.completed_jobs_count || 0) + 1,
            today_earnings: (partnerProfile.today_earnings || 0) + 299,
            available_balance: (partnerProfile.available_balance || 0) + 299
          };
          setPartnerProfile(updated);
          localStorage.setItem('quickserve_active_partner', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn('Status update failed:', e);
    }
  };

  const isVerified = partnerProfile?.verification_state === 'verified';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-[#0F172A] border-b border-slate-800 px-4 py-3 sticky top-0 z-20 text-white shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToCustomer}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Return to Customer App"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>QuickServe Partner Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400">Professional Safety & Onboarding Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Desk Switch Button */}
            <button
              type="button"
              onClick={() => {
                setShowAdminDesk(!showAdminDesk);
                fetchAdminVerifications();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border ${
                showAdminDesk 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-750'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Desk</span>
              {pendingPartners.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full">
                  {pendingPartners.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onBackToCustomer}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 rounded-lg hover:bg-emerald-900 transition-colors"
            >
              Customer App &rarr;
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">

        {/* Global Toast Message */}
        {actionSuccessMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW A: ADMIN VERIFICATION DESK                          */}
        {/* ======================================================== */}
        {showAdminDesk ? (
          <div className="space-y-4">
            
            {/* Admin Desk Banner */}
            <div className="bg-[#0F172A] rounded-2xl p-5 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-md tracking-wider">
                    Official Admin Desk
                  </span>
                  <span className="text-xs text-slate-400">Section 14 • Trust & Safety</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">Partner Verification & Audit Desk</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Review submitted Aadhaar cards, selfie photos, and criminal background checks before activating partners.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchAdminVerifications}
                  disabled={isLoadingAdminDesk}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdminDesk ? 'animate-spin' : ''}`} />
                  <span>Refresh List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminDesk(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  Close Desk &times;
                </button>
              </div>
            </div>

            {/* Admin Tabs */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setAdminTab('pending')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  adminTab === 'pending' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Review ({pendingPartners.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('all')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  adminTab === 'all' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Onboarded Partners ({allPartners.length})
              </button>
            </div>

            {/* Pending Verifications List */}
            {adminTab === 'pending' && (
              <div className="space-y-3">
                {pendingPartners.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-800">All Partner Audits Cleared!</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      There are no pending partner verification applications waiting for audit right now. New registrations will automatically appear here.
                    </p>
                  </div>
                ) : (
                  pendingPartners.map((pro) => (
                    <div 
                      key={pro.id} 
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                    >
                      {/* Partner Summary Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={pro.avatar || pro.selfie_doc || sampleSelfie}
                            alt={pro.name}
                            className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900">{pro.name}</h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                🟡 Audit Pending
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {pro.phone} • <span className="font-semibold text-slate-700">{pro.service_name || 'Service Partner'}</span> • {pro.experience_years} yrs exp
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Locality: {pro.locality || pro.zone_name || 'Pari Chowk, Greater Noida'} • Registered: {pro.joined_date || 'Today'}
                            </p>
                          </div>
                        </div>

                        {/* Aadhaar Chip */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Aadhaar UIDAI Number</p>
                          <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 tracking-wider">
                            {pro.aadhaar_number ? formatAadhaar(pro.aadhaar_number) : 'Not provided'}
                          </p>
                        </div>
                      </div>

                      {/* Document Verification & Security Audit Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                        {/* 1. Aadhaar Card Photo Preview */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>Aadhaar Document</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700">Uploaded ✓</span>
                          </div>

                          <div 
                            onClick={() => setPreviewDocUrl({ title: `${pro.name}'s Aadhaar Document`, url: pro.aadhaar_doc || sampleAadhaar })}
                            className="relative group cursor-pointer h-24 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center"
                          >
                            <img 
                              src={pro.aadhaar_doc || sampleAadhaar} 
                              alt="Aadhaar Document" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Card</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Live Selfie Photo Preview */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-blue-600" />
                              <span>Face Photo / Selfie</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700">Matched ✓</span>
                          </div>

                          <div 
                            onClick={() => setPreviewDocUrl({ title: `${pro.name}'s Verification Selfie`, url: pro.selfie_doc || pro.avatar || sampleSelfie })}
                            className="relative group cursor-pointer h-24 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center"
                          >
                            <img 
                              src={pro.selfie_doc || pro.avatar || sampleSelfie} 
                              alt="Selfie" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Photo</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Background Security & Police Check */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Background Safety</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700">Clear</span>
                          </div>

                          <ul className="space-y-1 text-[11px] text-slate-600">
                            <li className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>eCourts / CCTNS: Zero criminal cases</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Emergency contact: Verified</span>
                            </li>
                            <li className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Trade tools & SOP: Passed</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Admin Decision Bar */}
                      <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          disabled={adminActionLoadingId === pro.id}
                          onClick={() => handleAdminAction(pro.id, 'reject')}
                          className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                        >
                          Reject Application
                        </button>

                        <button
                          type="button"
                          disabled={adminActionLoadingId === pro.id}
                          onClick={() => handleAdminAction(pro.id, 'approve')}
                          className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:bg-slate-300"
                        >
                          {adminActionLoadingId === pro.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Authorizing...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Approve & Authorize Partner</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            )}

            {/* All Partners Roster */}
            {adminTab === 'all' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Registered Partner Directory</h3>
                  <span className="text-xs text-slate-500">{allPartners.length} Total Partners</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {allPartners.map((pro) => (
                    <div key={pro.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={pro.avatar || sampleSelfie} alt={pro.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{pro.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pro.verification_state === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pro.verification_state === 'verified' ? 'Verified ✓' : 'Under Review'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{pro.phone} • {pro.service_name}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">{pro.completed_jobs_count || 0} jobs</span>
                        <p className="text-[11px] text-slate-400">Rating: {pro.rating} ★</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : null}

        {/* ======================================================== */}
        {/* VIEW B: PARTNER REGISTRATION FORM                        */}
        {/* ======================================================== */}
        {!partnerProfile && !showAdminDesk ? (
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 mt-2 space-y-6">
            
            <div className="text-center">
              <div className="w-13 h-13 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Join QuickServe Partner Network</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Real customer leads with genuine Aadhaar background verification.
              </p>
            </div>

            {/* Safety Verification Trust Notice */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">4-Pillar Security Policy: </span>
                Every partner undergoes UIDAI Aadhaar verification, automated police record checks, and skill assessment before receiving customer bookings.
              </div>
            </div>

            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterPartner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name (As on Aadhaar Card) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-700 text-sm font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Your Primary Trade / Skill <span className="text-rose-500">*</span>
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                >
                  <option value="cat-plumber">Plumber (Taps, pipes, leakage, fittings)</option>
                  <option value="cat-electrician">Electrician (Fans, lights, wiring, MCB)</option>
                  <option value="cat-maid">Cleaning & Maid / Housekeeping</option>
                  <option value="cat-ac-repair">AC & Home Appliances</option>
                  <option value="cat-cook">Cook / Food Preparation</option>
                  <option value="cat-packers">Moving Help & Transport</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Locality / Zone
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Aadhaar Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Aadhaar Number (12 Digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={14}
                  required
                  value={formatAadhaar(aadhaarNumber)}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="1234 5678 9012"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 tracking-wider font-mono font-medium"
                />
              </div>

              {/* Document Uploads: Aadhaar Card & Live Selfie */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Required Safety Documents</p>
                
                {/* 1. Aadhaar Card Upload */}
                <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Aadhaar Card (Front/Back)</span>
                    </span>
                    {aadhaarDoc ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Document Ready ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Photo / PDF</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                      <span>Browse / Take Photo</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'aadhaar')}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setAadhaarDoc(sampleAadhaar)}
                      className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
                      title="Use pre-loaded sample document for testing"
                    >
                      ⚡ Test Document
                    </button>
                  </div>

                  {aadhaarDoc && (
                    <div className="relative w-full h-16 rounded-lg overflow-hidden border border-slate-200">
                      <img src={aadhaarDoc} alt="Aadhaar Document Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setAadhaarDoc('')}
                        className="absolute top-1 right-1 bg-slate-900/70 text-white p-1 rounded-full hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Live Selfie Upload */}
                <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Selfie / Face Photo</span>
                    </span>
                    {selfieDoc ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Photo Ready ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Camera / Photo</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Take Live Selfie</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleFileUpload(e, 'selfie')}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setSelfieDoc(sampleSelfie)}
                      className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors"
                      title="Use pre-loaded selfie portrait for testing"
                    >
                      ⚡ Test Selfie
                    </button>
                  </div>

                  {selfieDoc && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                      <img src={selfieDoc} alt="Selfie Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelfieDoc('')}
                        className="absolute top-1 right-1 bg-slate-900/70 text-white p-0.5 rounded-full hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={declarationAgreed}
                  onChange={(e) => setDeclarationAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600">
                  I consent to identity verification via UIDAI records and criminal background screening. All submitted information is genuine.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmittingReg || phone.length !== 10 || !name.trim() || !declarationAgreed}
                className="w-full mt-2 py-3 px-4 bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingReg ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Submit Application for Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : null}

        {/* ======================================================== */}
        {/* VIEW C: PARTNER DASHBOARD (REGISTERED)                  */}
        {/* ======================================================== */}
        {partnerProfile && !showAdminDesk ? (
          <div className="space-y-4">
            
            {/* Partner Profile Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={partnerProfile.avatar || partnerProfile.selfie_doc || sampleSelfie}
                  alt={partnerProfile.name}
                  className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{partnerProfile.name}</h2>
                    
                    {isVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Aadhaar & Police Verified</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Verification In Progress</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {partnerProfile.phone} • {partnerProfile.service_name || 'Service Partner'} • {partnerProfile.experience_years} yrs exp
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshPartnerStatus}
                  disabled={isCheckingStatus}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Check latest approval status from server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin text-blue-600' : ''}`} />
                  <span>Check Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('quickserve_active_partner');
                    setPartnerProfile(null);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Switch Account
                </button>
              </div>
            </div>

            {/* UNVERIFIED AUDIT TRACKER: Shows when partner is pending audit */}
            {!isVerified && (
              <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">Security Audit In Progress</h3>
                        <span className="px-2 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                          Reviewing Documents
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your profile has been submitted to QuickServe Security Desk. Customer orders will be dispatched to you once approved.
                      </p>
                    </div>
                  </div>

                  {/* Quick Shortcut to open Admin Desk and approve */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminDesk(true);
                      fetchAdminVerifications();
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-center shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Review in Admin Desk &rarr;</span>
                  </button>
                </div>

                {/* 4-Pillar Pipeline Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span>1. Aadhaar ID</span>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-emerald-900 font-semibold mt-1">Uploaded & Matched</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {partnerProfile.aadhaar_number ? `XXXX ${partnerProfile.aadhaar_number.slice(-4)}` : 'Document saved'}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-800">
                      <span>2. Criminal Check</span>
                      <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    </div>
                    <p className="text-[11px] text-blue-900 font-semibold mt-1">eCourts Automated</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Clear records registry</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>3. Trade Skills</span>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-800 font-semibold mt-1">{partnerProfile.service_name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">SOP checklist verified</p>
                  </div>

                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                      <span>4. Admin Audit</span>
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                    <p className="text-[11px] text-amber-950 font-semibold mt-1">Pending Approval</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Awaiting desk sign-off</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Tabs */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'jobs' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Available & Assigned Jobs ({jobs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('earnings')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'earnings' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Earnings & Wallet
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'profile' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verification Dossier
              </button>
            </div>

            {/* ======================================================== */}
            {/* TAB 1: JOBS                                              */}
            {/* ======================================================== */}
            {activeTab === 'jobs' && (
              <div className="space-y-3">
                
                {/* Notice if unverified */}
                {!isVerified ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6 text-slate-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Orders Locked Pending Security Verification</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      To safeguard customer security and uphold safety standards, partners must be verified before viewing customer addresses and claiming bookings.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleRefreshPartnerStatus}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Check Verification Status</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminDesk(true);
                          fetchAdminVerifications();
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Authorize via Admin Desk</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live Customer Job Requests</p>
                      <button
                        type="button"
                        onClick={fetchPartnerJobs}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh Orders</span>
                      </button>
                    </div>

                    {jobs.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-800">No active job requests right now</p>
                        <p className="text-xs text-slate-400 mt-1">New customer bookings in your service zone will appear here immediately.</p>
                      </div>
                    ) : (
                      jobs.map((job) => {
                        const isMyJob = job.professional_id === partnerProfile.id;
                        const canAccept = (job.status === 'requested' || job.status === 'confirmed') && !job.professional_id;
                        const canStart = isMyJob && (job.status === 'partner_assigned' || job.status === 'confirmed');
                        const canComplete = isMyJob && (job.status === 'in_progress' || job.status === 'started');

                        return (
                          <div
                            key={job.id || job.booking_reference}
                            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-mono text-xs font-bold text-slate-500">{job.booking_reference}</span>
                                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{job.service_title}</h4>
                                <p className="text-xs text-slate-600">{job.sub_service_selected}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-base font-bold text-slate-900">₹{job.total_amount}</span>
                                <p className="text-[10px] text-emerald-600 font-semibold uppercase">{job.status.replace('_', ' ')}</p>
                              </div>
                            </div>

                            {job.customer_problem && (
                              <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700">
                                <span className="font-semibold text-slate-900">Customer Note: </span>
                                {job.customer_problem}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{job.scheduled_date || 'Today'} • {job.scheduled_time_slot || '10:00 AM - 01:00 PM'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{job.customer_address || job.locality}</span>
                              </div>
                            </div>

                            {/* Customer Contact when assigned */}
                            {isMyJob && job.customer_phone && (
                              <div className="p-2.5 bg-emerald-50 rounded-xl flex items-center justify-between text-xs">
                                <span className="font-semibold text-emerald-950">Customer: {job.customer_name}</span>
                                <a
                                  href={`tel:${job.customer_phone}`}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call {job.customer_phone}</span>
                                </a>
                              </div>
                            )}

                            {/* Job Actions */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                              {canAccept && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateJobStatus(job.id, 'partner_assigned')}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Accept Job</span>
                                </button>
                              )}

                              {canStart && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateJobStatus(job.id, 'in_progress')}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                                >
                                  Start Service at Doorstep
                                </button>
                              )}

                              {canComplete && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateJobStatus(job.id, 'completed')}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Job Completed</span>
                                </button>
                              )}

                              {job.status === 'completed' && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Completed</span>
                                </span>
                              )}
                            </div>

                          </div>
                        );
                      })
                    )}
                  </>
                )}

              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: EARNINGS & WALLET                                 */}
            {/* ======================================================== */}
            {activeTab === 'earnings' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Partner Earnings & Wallet</h3>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[11px] text-slate-500">Today&apos;s Earnings</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">₹{partnerProfile.today_earnings || 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-[11px] text-emerald-800">Wallet Balance</p>
                    <p className="text-lg font-bold text-emerald-900 mt-0.5">₹{partnerProfile.available_balance || 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[11px] text-slate-500">Completed Jobs</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{partnerProfile.completed_jobs_count || 0}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Direct Bank / UPI Payout</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Linked to {partnerProfile.upi_id || `${partnerProfile.phone}@upi`}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Payout request of ₹${partnerProfile.available_balance || 0} initiated to ${partnerProfile.upi_id}`)}
                    disabled={(partnerProfile.available_balance || 0) <= 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Withdraw to UPI
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: VERIFICATION DOSSIER                              */}
            {/* ======================================================== */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Partner Trust & Security Dossier</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isVerified ? 'Fully Verified ✓' : 'Audit In Progress'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Aadhaar Identity Verification</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {partnerProfile.aadhaar_number ? formatAadhaar(partnerProfile.aadhaar_number) : 'Verified via UIDAI'}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Document Matched ✓
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Criminal & Police Background Scan</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">State Police CCTNS & National e-Courts Registry</p>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Zero Offenses Clear ✓
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Trade Skill Assessment</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {partnerProfile.service_name} • Safety tools & SOP test
                      </p>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Standards Passed ✓
                    </span>
                  </div>
                </div>

                {/* Document Previews */}
                {(partnerProfile.aadhaar_doc || partnerProfile.selfie_doc) && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-800 mb-2">Stored Verification Assets</p>
                    <div className="flex items-center gap-3">
                      {partnerProfile.aadhaar_doc && (
                        <div 
                          onClick={() => setPreviewDocUrl({ title: 'Aadhaar Document', url: partnerProfile.aadhaar_doc! })}
                          className="cursor-pointer group flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300"
                        >
                          <img src={partnerProfile.aadhaar_doc} alt="Aadhaar" className="w-10 h-10 object-cover rounded-lg" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Aadhaar Card</p>
                            <p className="text-[10px] text-blue-600 group-hover:underline">Click to view</p>
                          </div>
                        </div>
                      )}

                      {partnerProfile.selfie_doc && (
                        <div 
                          onClick={() => setPreviewDocUrl({ title: 'Face Photo', url: partnerProfile.selfie_doc! })}
                          className="cursor-pointer group flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300"
                        >
                          <img src={partnerProfile.selfie_doc} alt="Selfie" className="w-10 h-10 object-cover rounded-lg" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Selfie Portrait</p>
                            <p className="text-[10px] text-blue-600 group-hover:underline">Click to view</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        ) : null}

      </main>

      {/* Lightbox / Document Viewer Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{previewDocUrl.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img src={previewDocUrl.url} alt={previewDocUrl.title} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
            </div>
            <div className="p-3 bg-white text-right">
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
