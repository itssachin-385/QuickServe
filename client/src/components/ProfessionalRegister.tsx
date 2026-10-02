import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  Phone, 
  Upload,
  Briefcase,
  Check
} from 'lucide-react';
import { ServiceCategory, ServiceZone } from '../types';
import { registerProfessional } from '../api';

interface ProfessionalRegisterProps {
  categories: ServiceCategory[];
  zones: ServiceZone[];
  onComplete: () => void;
  lang: 'en' | 'hi';
}

export const ProfessionalRegister: React.FC<ProfessionalRegisterProps> = ({
  categories,
  zones,
  onComplete,
  lang
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [preferredLanguage, setPreferredLanguage] = useState('hi');
  const [selectedServiceId, setSelectedServiceId] = useState(categories[0]?.id || 'cat-plumber');
  const [experienceYears, setExperienceYears] = useState('4');
  const [skillsText, setSkillsText] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || 'zone-blr-indira');
  const [workingRadiusKm, setWorkingRadiusKm] = useState('8');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [nonMedicalDeclaration, setNonMedicalDeclaration] = useState(false);

  const selectedCategory = categories.find(c => c.id === selectedServiceId);

  const handleSubmitApplication = async () => {
    if (!fullName || !phone) {
      alert('Please fill out your name and phone number');
      return;
    }
    if (selectedCategory?.slug === 'caretaker' && !nonMedicalDeclaration) {
      alert('Please acknowledge the Caretaker Non-Medical Caregiving Declaration to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerProfessional({
        name: fullName,
        phone,
        service_id: selectedServiceId,
        primary_zone_id: selectedZoneId,
        experience_years: experienceYears,
        skills: skillsText || 'Professional trade skills',
        aadhaar_number: aadhaarNumber,
        emergency_contact: emergencyContact,
        non_medical_declaration: nonMedicalDeclaration
      });

      if (res.success) {
        setApplicationId(`QS-APP-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } catch (err) {
      alert('Failed to submit application. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Registration Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Join Bengaluru's Leading On-Demand Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Turn your skills into daily local opportunities.
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Direct customer bookings in your area, transparent instant UPI payouts, and complete respect for your craft.
          </p>
        </div>

        {/* Success View */}
        {applicationId ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Application Submitted Successfully!</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Your application reference is <strong className="font-mono text-brand-600">{applicationId}</strong>. Our Bengaluru Ground Onboarding Team will review your KYC documents and call you for an in-person trade check within 24 hours.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs max-w-md mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile:</span>
                <span className="font-mono text-slate-900">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-brand-600">{selectedCategory?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Status:</span>
                <span className="text-amber-600 font-bold">🟡 Pending Review</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={onComplete}
                className="px-6 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Go to QuickServe Portal
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Wizard Card */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-premium">
            {/* Progress Step Bar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 text-xs">
              {[
                { s: 1, label: 'Basic Info' },
                { s: 2, label: 'Service' },
                { s: 3, label: 'Experience' },
                { s: 4, label: 'Location' },
                { s: 5, label: 'KYC & Safety' }
              ].map(item => (
                <div 
                  key={item.s} 
                  className={`flex items-center gap-1.5 ${step === item.s ? 'text-brand-600 font-bold' : step > item.s ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                    step === item.s ? 'bg-brand-600 text-white' : step > item.s ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {step > item.s ? '✓' : item.s}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Step 1: Personal & Contact Information</h3>
                <p className="text-xs text-slate-500">Enter your official name as shown on your Government Aadhaar ID.</p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (for SMS & OTP) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Language for Orders</label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="en">English</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <div className="flex gap-4">
                    {['Male', 'Female', 'Other'].map(g => (
                      <label key={g} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={(e) => setGender(e.target.value)}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Choose Service */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Step 2: Choose Primary Service</h3>
                <p className="text-xs text-slate-500">
                  Select the craft or trade in which you have verifiable field experience:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedServiceId(c.id)}
                      className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedServiceId === c.id
                          ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-500 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.tagline}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-800">₹{c.starting_price} base</span>
                    </div>
                  ))}
                </div>

                {/* Caretaker Non-Medical Warning (Section 29) */}
                {selectedCategory?.slug === 'caretaker' && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Caretaker Service Policy & Legal Scope</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      QuickServe strictly connects clients with <strong>non-medical attendants</strong> (companionship, assisted walking, feeding, basic personal grooming). Caretakers are not permitted to administer clinical medical therapies without registered medical hospital supervision.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Experience & Skills */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Step 3: Experience & Technical Competencies</h3>
                <p className="text-xs text-slate-500">Provide details for your professional profile badge.</p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Practical Work Experience *</label>
                  <select
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="4">4 years</option>
                    <option value="5">5+ years (Senior Craftsman)</option>
                    <option value="8">8+ years (Master Technician)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Trade Skills / Specializations</label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="e.g. CPVC pipe joining, Flush tank rebuild, Pressure pump check"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Separate multiple skills with commas</span>
                </div>
              </div>
            )}

            {/* STEP 4: Location & Operating Radius */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Step 4: Operating Zone & Locality</h3>
                <p className="text-xs text-slate-500">Pick where you want to receive customer calls without excessive travel.</p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Operational Cluster (Bengaluru Launch)</label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.locality} ({z.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Preferred Travel Radius: {workingRadiusKm} km</label>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={workingRadiusKm}
                    onChange={(e) => setWorkingRadiusKm(e.target.value)}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>3 km (Hyperlocal)</span>
                    <span>8 km (Cluster)</span>
                    <span>15 km (Wide Metro)</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: KYC, Safety & Non-Medical Declaration */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Step 5: KYC Verification & Safety Declaration</h3>
                <p className="text-xs text-slate-500">Government identity verification is mandatory before jobs are routed to you.</p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar Number (Last 4 Digits or Masked) *</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="XXXX-XXXX-4892"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Encrypted. Never shared publicly with customers.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Person Name & Mobile</label>
                  <input
                    type="text"
                    placeholder="e.g. Suman (Spouse) - +91 98450 00000"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* Mandatory Caretaker Declaration Checkbox if Caretaker selected */}
                {selectedCategory?.slug === 'caretaker' && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="nonMedDec"
                      checked={nonMedicalDeclaration}
                      onChange={(e) => setNonMedicalDeclaration(e.target.checked)}
                      className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="nonMedDec" className="text-xs text-amber-950">
                      <span className="font-bold block">Mandatory Non-Medical Declaration (Section 29)</span>
                      <span>I hereby certify that I understand my role is strictly non-medical senior and patient support. I will not represent myself as a registered physician, MBBS doctor, or licensed clinical nurse.</span>
                    </label>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>By submitting, you agree to the QuickServe Partner Code of Conduct and background verification protocol.</span>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep((step - 1) as any)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : <div></div>}

              {step < 5 ? (
                <button
                  onClick={() => {
                    if (step === 1 && (!fullName || !phone)) {
                      alert('Please provide your name and phone number');
                      return;
                    }
                    setStep((step + 1) as any);
                  }}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmitApplication}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application for Verification'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
