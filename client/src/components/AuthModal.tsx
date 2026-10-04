import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw,
  User,
  AlertCircle,
  Smartphone,
  Mail,
  MapPin,
  Check,
  MessageSquare
} from 'lucide-react';
import { CustomerUser } from '../types';
import { sendOtp, verifyOtp, updateUserProfile } from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CustomerUser) => void;
  lang?: 'en' | 'hi';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang = 'en'
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userGender, setUserGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [userCity, setUserCity] = useState('Greater Noida');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [verifiedUser, setVerifiedUser] = useState<CustomerUser | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isHindi = lang === 'hi';

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setStatusMessage(null);
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError(isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      setStep('otp');
      setStatusMessage(res.message || `OTP sent to +91 ${cleanPhone}`);

      // If backend provides demo_otp (simulation fallback), autofill for smooth testing
      if (res.demo_otp && !res.has_real_key) {
        setOtp(res.demo_otp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!otp.trim()) {
      setError(isHindi ? 'कृपया 4 अंकों का OTP कोड दर्ज करें' : 'Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await verifyOtp(cleanPhone, otp.trim());
      if (res.user) {
        localStorage.setItem('quickserve_user', JSON.stringify(res.user));
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect OTP. Please enter the correct 4-digit code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifiedUser) return;

    if (!userName.trim()) {
      setError(isHindi ? 'कृपया अपना नाम दर्ज करें' : 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const updatedUser: CustomerUser = {
        ...verifiedUser,
        name: userName.trim(),
        email: userEmail.trim() || undefined,
        gender: userGender || undefined,
        city: userCity || undefined,
        whatsapp_updates: whatsappConsent
      };

      await updateUserProfile(updatedUser);
      onSuccess(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipProfile = () => {
    if (verifiedUser) {
      localStorage.setItem('quickserve_user', JSON.stringify(verifiedUser));
      onSuccess(verifiedUser);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col font-sans max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 sm:p-6 text-white relative border-b border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#04b565] text-white flex items-center justify-center font-black text-base shadow-md shadow-emerald-500/20">
                Q
              </div>
              <span className="text-base font-extrabold tracking-tight">Quick<span className="text-[#04b565]">Serve</span></span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            {step === 'phone' 
              ? (isHindi ? 'लॉगिन या साइन अप' : 'Login or Sign Up')
              : step === 'otp'
              ? (isHindi ? 'मोबाइल OTP सत्यापित करें' : 'Verify Mobile OTP')
              : (isHindi ? 'अपनी प्रोफ़ाइल पूरी करें' : 'Complete Your Profile')}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {step === 'phone' 
              ? (isHindi ? 'सत्यापित घरेलू सेवाएं बुक करने के लिए अपना नंबर दर्ज करें।' : 'Enter your mobile number to access verified household help.')
              : step === 'otp'
              ? (isHindi ? `+91 ${phone} पर भेजा गया 4-अंकों का कोड दर्ज करें` : `Enter the 4-digit code sent to +91 ${phone}`)
              : (isHindi ? 'बुकिंग इनवॉइस और सेवा अपडेट्स के लिए विवरण भरें।' : 'Enter your name and details for booking updates & invoices.')}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && step === 'otp' && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{statusMessage}</span>
            </div>
          )}

          {/* STEP 1: PHONE NUMBER */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}
                </label>
                <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-emerald-500 transition-colors overflow-hidden bg-slate-50 focus-within:bg-white">
                  <span className="px-3.5 py-3.5 text-sm font-bold text-slate-700 border-r border-slate-200 flex items-center gap-1.5 bg-slate-100">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-4 py-3.5 text-base font-bold text-slate-900 focus:outline-none bg-transparent font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full py-4 bg-[#04b565] hover:bg-[#039e57] disabled:opacity-50 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>{loading ? (isHindi ? 'OTP भेजा जा रहा है...' : 'Sending OTP SMS...') : (isHindi ? 'आगे बढ़ें →' : 'Continue with OTP →')}</span>
              </button>

              <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Safe • Carrier verified OTP</span>
              </div>
            </form>
          )}

          {/* STEP 2: 4-DIGIT OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isHindi ? '4 अंकों का OTP कोड' : 'Enter 4-Digit Code'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError(null);
                      setStatusMessage(null);
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold"
                  >
                    {isHindi ? 'नंबर बदलें' : 'Change Phone'}
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={4}
                  placeholder="• • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-3.5 text-center font-mono text-2xl font-black text-slate-900 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl tracking-[0.5em] focus:outline-none bg-slate-50 focus:bg-white"
                  autoFocus
                />
                
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Code sent to <strong>+91 {phone}</strong></span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <span>{loading ? (isHindi ? 'सत्यापित हो रहा है...' : 'Verifying...') : (isHindi ? 'OTP सत्यापित करें →' : 'Verify Code →')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1.5 pt-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isHindi ? 'OTP नहीं मिला? दोबारा भेजें' : 'Didn\'t receive code? Resend SMS OTP'}</span>
              </button>
            </form>
          )}

          {/* STEP 3: DEDICATED PROFILE CREATION (NAME, OPTIONAL EMAIL, CITY) */}
          {step === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5 animate-in fade-in">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#04b565] text-white flex items-center justify-center font-black text-sm">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    +91 {phone}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    ✓ {isHindi ? 'मोबाइल नंबर सत्यापित हो गया' : 'Mobile Number Verified'}
                  </span>
                </div>
              </div>

              {/* Salutation / Title (Optional) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {isHindi ? 'संबोधन (वैकल्पिक)' : 'Title / Salutation (Optional)'}
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'male', label: 'Mr.' },
                    { id: 'female', label: 'Ms. / Mrs.' },
                    { id: 'other', label: 'Other' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUserGender(item.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        userGender === item.id
                          ? 'border-[#04b565] bg-emerald-50 text-[#04b565]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHindi ? 'आपका पूरा नाम *' : 'Full Name *'}
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#04b565] transition-colors">
                  <User className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sachin Kumar"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="flex-1 text-xs text-slate-900 bg-transparent focus:outline-none font-semibold"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email Address (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isHindi ? 'ईमेल आईडी' : 'Email Address'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isHindi ? 'वैकल्पिक (Optional)' : 'Optional'}
                  </span>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#04b565] transition-colors">
                  <Mail className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="e.g. sachin@gmail.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="flex-1 text-xs text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isHindi ? 'डिजिटल टैक्स इनवॉइस और रसीद इस ईमेल पर भेजी जाएगी।' : 'Digital tax invoices and service receipts will be sent here.'}
                </p>
              </div>

              {/* City / Locality Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHindi ? 'शहर / इलाका' : 'City / Locality'}
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#04b565] transition-colors">
                  <MapPin className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <select
                    value={userCity}
                    onChange={(e) => setUserCity(e.target.value)}
                    className="flex-1 text-xs text-slate-800 bg-transparent focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="Greater Noida">Greater Noida</option>
                    <option value="Noida">Noida</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Gurugram">Gurugram</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp Notification Consent */}
              <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="whatsappAlerts"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="whatsappAlerts" className="text-xs text-slate-800 cursor-pointer">
                  <span className="font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isHindi ? 'व्हाट्सएप पर अपडेट्स पाएं' : 'Get service updates on WhatsApp'}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {isHindi ? 'टेक्निशियन का आगमन और OTP सीधे व्हाट्सएप पर प्राप्त करें।' : 'Technician arrival alerts and booking OTP sent to your WhatsApp.'}
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || !userName.trim()}
                  className="w-full py-3.5 bg-[#04b565] hover:bg-[#039e57] disabled:opacity-50 text-white font-black rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <span>{loading ? (isHindi ? 'सेव हो रहा है...' : 'Saving...') : (isHindi ? 'प्रोफ़ाइल सेव करें और जारी रखें →' : 'Complete Profile & Continue →')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipProfile}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-700 py-1"
                >
                  {isHindi ? 'अभी छोड़ें (बाद में भरें)' : 'Skip for now'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
