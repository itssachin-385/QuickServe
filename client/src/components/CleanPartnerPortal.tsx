import React, { useState, useEffect } from 'react';
import { Booking, Professional, ServiceCategory } from '../types';
import { updateBookingStatus } from '../api';
import { 
  Wrench, CheckCircle2, Clock, MapPin, Phone, 
  Wallet, ShieldCheck, AlertCircle, ArrowLeft, 
  Calendar, RefreshCw, UserCheck, Briefcase, ChevronRight 
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
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regError, setRegError] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'profile'>('jobs');
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Fetch jobs
  const fetchPartnerJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const allBookings: Booking[] = await res.json();
        // If partner registered, show matching category or assigned bookings
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

  useEffect(() => {
    if (partnerProfile) {
      fetchPartnerJobs();
    }
  }, [partnerProfile]);

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
    if (aadhaarNumber.replace(/\D/g, '').length !== 12) {
      setRegError('Please enter a valid 12-digit Aadhaar number for identity verification');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const payload = {
        name: name.trim(),
        phone: `+91 ${cleanPhone}`,
        service_id: serviceId,
        experience_years: Number(experience) || 3,
        locality,
        aadhaar_number: aadhaarNumber.replace(/\D/g, ''),
        emergency_contact: '+91 95701 51834',
        non_medical_declaration: true
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
          service_id: serviceId,
          service_name: categories.find(c => c.id === serviceId)?.name || 'Service Partner',
          experience_years: Number(experience) || 3,
          verification_state: 'verified', // Auto verified for clean demo
          is_available: true,
          completed_jobs_count: 0,
          today_earnings: 0,
          available_balance: 0,
          rating: 5.0,
          upi_id: `${cleanPhone}@upi`,
          joined_date: new Date().toISOString().split('T')[0]
        };

        // Ensure partner has verified status for demo testing
        pro.verification_state = 'verified';
        pro.is_available = true;

        setPartnerProfile(pro);
        localStorage.setItem('quickserve_active_partner', JSON.stringify(pro));
      } else {
        setRegError('Registration could not be completed. Please try again.');
      }
    } catch (err: any) {
      setRegError('Network error during registration.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToCustomer}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>QuickServe Partner Portal</span>
              </h1>
              <p className="text-[11px] text-slate-500">Service Professional Dashboard</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToCustomer}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Customer App &rarr;
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4">
        
        {/* If Partner NOT Registered: Show Clean Registration Form */}
        {!partnerProfile ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 mt-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Partner Onboarding</h2>
              <p className="text-xs text-slate-500 mt-1">Register your trade and start getting local customer requests</p>
            </div>

            {regError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterPartner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
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
                  <option value="cat-plumber">Plumber (Taps, pipes, leakage)</option>
                  <option value="cat-electrician">Electrician (Fans, lights, wiring)</option>
                  <option value="cat-maid">Cleaning & Maid / Chores</option>
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
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Aadhaar Number (12 Digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={12}
                  required
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="1234 5678 9012"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 tracking-wider font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used exclusively for safety background verification.</p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingReg || phone.length !== 10 || !name.trim()}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingReg ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Register as Partner</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Partner DASHBOARD */
          <div className="space-y-4">
            
            {/* Partner Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  {partnerProfile.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{partnerProfile.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{partnerProfile.phone} • {partnerProfile.service_name || 'Service Partner'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

            {actionSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* Dashboard Tabs */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'jobs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Available & Assigned Jobs ({jobs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('earnings')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'earnings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Earnings & Wallet
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verification Details
              </button>
            </div>

            {/* TAB 1: JOBS */}
            {activeTab === 'jobs' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live Customer Job Requests</p>
                  <button
                    type="button"
                    onClick={fetchPartnerJobs}
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
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
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
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
              </div>
            )}

            {/* TAB 2: EARNINGS */}
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

            {/* TAB 3: VERIFICATION */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Partner Trust & Verification</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span className="font-medium text-emerald-900">Aadhaar Identity Verification</span>
                    <span className="font-bold text-emerald-700">Verified ✓</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span className="font-medium text-emerald-900">Trade Skill Assessment</span>
                    <span className="font-bold text-emerald-700">Passed ✓</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span className="font-medium text-emerald-900">Background Safety Check</span>
                    <span className="font-bold text-emerald-700">Clean ✓</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
};
