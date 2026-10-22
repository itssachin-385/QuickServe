import React, { useState, useEffect, useRef } from 'react';
import { CustomerUser } from '../types';
import { sendOtp, sendWhatsAppOtp, verifyOtp } from '../api';
import { 
  ShieldCheck, Phone, User, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertCircle, RefreshCw, Check, Sparkles,
  MessageCircle
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface CleanAuthScreenProps {
  onSuccess: (user: CustomerUser) => void;
  initialPhone?: string;
  onCancel?: () => void;
}

export const CleanAuthScreen: React.FC<CleanAuthScreenProps> = ({
  onSuccess,
  initialPhone = '',
  onCancel
}) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState(initialPhone.replace(/\D/g, '').slice(-10));
  const [name, setName] = useState(() => {
    try {
      const savedUser = localStorage.getItem('quickserve_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.name && u.name !== 'QuickServe Customer' && !u.name.includes('Guest')) return u.name;
      }
      return localStorage.getItem('quickserve_user_name') || '';
    } catch (e) {
      return '';
    }
  });
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendSeconds, setResendSeconds] = useState(30);
  const [hintOtp, setHintOtp] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppOpened, setWhatsAppOpened] = useState(false);
  const [isAutomatedSent, setIsAutomatedSent] = useState(false);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Collage images from local assets matching Photo 1
  const collageImages = [
    { src: '/images/bathroom_clean_3d.jpg', alt: 'Bathroom Cleaning' },
    { src: '/images/sweeping_mopping_3d.jpg', alt: 'Floor Mopping' },
    { src: '/images/dusting_wiping_3d.jpg', alt: 'Kitchen Dusting' },
    { src: '/images/utensils_3d.jpg', alt: 'Utensil Washing' },
    { src: '/images/kitchen_prep_3d.jpg', alt: 'Kitchen Prep' },
    { src: '/images/hourly_bookings_3d.jpg', alt: 'Helper Mopping' },
    { src: '/images/washing_machine_3d.jpg', alt: 'Appliance Care' },
    { src: '/images/fan_electrician_3d.jpg', alt: 'Fan & Electrician' },
  ];

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendSeconds > 0) {
      timer = setInterval(() => setResendSeconds(s => s - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendSeconds]);

  const handleSkipLogin = () => {
    // Allows instant clean guest browsing with no dummy phone numbers
    const guestUser: CustomerUser = {
      id: `guest-${Date.now()}`,
      name: name.trim() || 'Guest',
      phone: phone.trim() ? `+91 ${phone.replace(/\D/g, '').slice(-10)}` : ''
    };
    onSuccess(guestUser);
  };

  // WhatsApp OTP Submission
  const handleWhatsAppSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    localStorage.setItem('quickserve_user_name', trimmedName);
    setIsSendingWhatsApp(true);
    try {
      const res = await sendWhatsAppOtp(cleanPhone);
      if (res && res.otp) {
        setHintOtp(res.otp);
      }
      setStep('otp');
      setResendSeconds(30);

      if (res && res.automated) {
        setIsAutomatedSent(true);
      } else {
        setIsAutomatedSent(false);
        setWhatsAppOpened(true);
        if (res && res.whatsapp_url) {
          window.open(res.whatsapp_url, '_blank');
        }
      }

      setTimeout(() => {
        otpInputRefs[0]?.current?.focus();
      }, 200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send WhatsApp OTP. Please use SMS.');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Standard SMS Submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    localStorage.setItem('quickserve_user_name', trimmedName);
    setIsLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      if (res && res.demo_otp) {
        setHintOtp(res.demo_otp);
      }
      setStep('otp');
      setResendSeconds(30);
      setTimeout(() => {
        otpInputRefs[0]?.current?.focus();
      }, 150);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto move to next input
    if (digit && index < 3) {
      otpInputRefs[index + 1]?.current?.focus();
    }

    // Auto submit if full 4 digits entered
    if (digit && index === 3 && newOtp.every(d => d.length === 1)) {
      handleOtpVerify(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs[index - 1]?.current?.focus();
    }
  };

  const handleOtpVerify = async (codeToVerify?: string) => {
    const fullOtp = codeToVerify || otp.join('');
    setErrorMessage('');

    if (fullOtp.length !== 4) {
      setErrorMessage('Please enter the complete 4-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const customerName = name.trim() || 'QuickServe Customer';
      const res = await verifyOtp(phone, fullOtp, customerName);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Invalid OTP code');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect verification code. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendSeconds > 0 || isLoading) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res && res.demo_otp) {
        setHintOtp(res.demo_otp);
      }
      setResendSeconds(30);
      setOtp(['', '', '', '']);
      otpInputRefs[0]?.current?.focus();
    } catch (err: any) {
      setErrorMessage('Could not resend OTP right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetWhatsAppOtp = async () => {
    setIsSendingWhatsApp(true);
    setErrorMessage('');
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await sendWhatsAppOtp(cleanPhone);
      if (res && res.whatsapp_url) {
        setWhatsAppOpened(true);
        if (res.otp) {
          setHintOtp(res.otp);
        }
        window.open(res.whatsapp_url, '_blank');
      }
    } catch (err: any) {
      setErrorMessage('Could not open WhatsApp. Please use SMS code.');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };


  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#EAEFF5] flex flex-col justify-between max-w-md mx-auto relative overflow-y-auto selection:bg-pink-100">
      
      {/* 1. TOP STATUS BAR BAND & BORDER (Separates Android status bar icons from content) */}
      <div className="w-full bg-pink-700 h-8 sm:h-2 border-t-2 border-pink-400/60 shrink-0" />

      {/* TOP CURVED BRAND BANNER */}
      <div 
        className="relative bg-gradient-to-b from-pink-600 via-rose-600 to-pink-700 text-white pb-6 sm:pb-8 px-5 rounded-b-[36px] shadow-lg shadow-pink-600/20 shrink-0 pt-2"
      >
        
        {/* Skip login button in top right */}
        <div className="flex justify-end mb-2 sm:mb-3">
          <button
            type="button"
            onClick={handleSkipLogin}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-black/25 hover:bg-black/35 active:scale-95 backdrop-blur-md rounded-full border border-white/20 transition-all cursor-pointer shadow-xs"
          >
            Skip login
          </button>
        </div>

        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center mb-2.5 sm:mb-3">
          <BrandLogo size="lg" theme="dark" />
        </div>

        {/* Hero Tagline */}
        <h2 className="text-center text-lg sm:text-xl font-extrabold text-white leading-snug px-2">
          Get professional house help in minutes!
        </h2>
      </div>

      {/* 2. MIDDLE PHOTO COLLAGE (Photo 1 8-Tile Rounded Grid) */}
      <div className="px-4 py-2 sm:py-3 flex-1 flex flex-col justify-center my-auto min-h-0">
        <div className="grid grid-cols-4 gap-2">
          {collageImages.map((img, i) => (
            <div
              key={i}
              className="relative aspect-4/3 rounded-xl overflow-hidden border border-pink-100 shadow-2xs group bg-pink-100"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  // Fallback pleasant pastel background if image not found
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. BOTTOM SHEET LOGIN / SIGNUP CARD (Universal Safe-Area Clearance for 3-Button Nav & Gesture Bars) */}
      <div 
        className="bg-white rounded-t-[32px] px-6 sm:px-7 pt-6 shadow-[0_-8px_30px_rgba(219,39,119,0.12)] border-t border-pink-100 shrink-0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 64px)' }}
      >
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Name & Phone Entry */}
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-3.5">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-[#1F121C] tracking-tight font-heading">
                Log in or Sign up
              </h3>
              <span className="text-[11px] font-bold text-pink-600 bg-pink-50 border border-pink-100 px-2.5 py-0.5 rounded-full">
                Instant 1-Click
              </span>
            </div>

            {/* 1. Full Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center bg-white border-2 border-slate-200 hover:border-pink-300 focus-within:border-pink-600 rounded-2xl px-4 py-3 transition-colors shadow-2xs">
                <User className="w-4 h-4 text-pink-600 mr-2.5 shrink-0" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name (e.g. Rahul Kumar)"
                  className="w-full text-sm font-medium text-[#1F121C] placeholder-slate-400 bg-transparent focus:outline-none tracking-wide"
                />
              </div>
            </div>

            {/* 2. Mobile Number Input with +91 Separator */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center bg-white border-2 border-slate-200 hover:border-pink-300 focus-within:border-pink-600 rounded-2xl px-4 py-3 transition-colors shadow-2xs">
                <span className="text-sm font-extrabold text-[#1F121C] pr-3 border-r border-slate-300">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-3 text-sm font-medium text-[#1F121C] placeholder-slate-400 bg-transparent focus:outline-none tracking-wide"
                />
              </div>
            </div>

            {/* WhatsApp Updates Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none pt-0.5">
              <input
                type="checkbox"
                checked={whatsappUpdates}
                onChange={(e) => setWhatsappUpdates(e.target.checked)}
                className="w-4 h-4 rounded text-pink-600 border-slate-300 focus:ring-pink-500 accent-pink-600 cursor-pointer"
              />
              <span className="font-medium text-[#1F121C]">Get booking & service updates on WhatsApp</span>
            </label>

            {/* 3. Action Buttons: Get OTP on WhatsApp + SMS Option */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={handleWhatsAppSubmit}
                disabled={isLoading || isSendingWhatsApp || phone.length !== 10 || !name.trim()}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] active:scale-98 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-white shrink-0 fill-white/20" />
                <span>{isSendingWhatsApp ? 'Opening WhatsApp...' : 'Get OTP on WhatsApp'}</span>
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Or
                </span>
                <div className="border-t border-slate-200 w-full"></div>
              </div>

              {/* Get OTP via SMS Button */}
              <button
                type="submit"
                disabled={isLoading || isSendingWhatsApp || phone.length !== 10 || !name.trim()}
                className="w-full py-3 px-4 bg-pink-50/80 hover:bg-pink-100/80 border border-pink-200 text-pink-700 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-pink-600" />
                    <span>Sending SMS OTP...</span>
                  </>
                ) : (
                  <span>Get OTP via SMS</span>
                )}
              </button>
            </div>

            {/* Terms & Privacy Note */}
            <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
              By continuing, you agree to our{' '}
              <a href="#terms" className="underline font-semibold text-slate-700 hover:text-pink-600">
                Terms of Service
              </a>{' '}
              &{' '}
              <a href="#privacy" className="underline font-semibold text-slate-700 hover:text-pink-600">
                Privacy Policy
              </a>
            </p>

          </form>
        ) : (
          /* STEP 2: OTP Verification */
          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#1F121C] tracking-tight">Enter Verification Code</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hello <strong className="text-slate-800">{name || 'User'}</strong>, code sent to <strong>+91 {phone}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setStep('phone'); setErrorMessage(''); }}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            {/* Delivery Status Indicator */}
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">
                {isAutomatedSent ? (
                  <>Direct WhatsApp OTP sent to <strong>+91 {phone}</strong></>
                ) : (
                  <>Verification code sent to <strong>+91 {phone}</strong></>
                )}
              </span>
            </div>

            {/* 1-Click WhatsApp OTP Option */}
            <button
              type="button"
              onClick={handleGetWhatsAppOtp}
              disabled={isSendingWhatsApp}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isSendingWhatsApp ? 'Opening WhatsApp...' : '💬 Send OTP on WhatsApp'}</span>
            </button>

            {/* Auto-fill Helper Banner */}
            {hintOtp && (
              <div className="p-2.5 bg-pink-50 border border-pink-200 rounded-xl flex items-center justify-between text-xs text-pink-900">
                <span>Code: <strong className="font-mono text-sm tracking-wider font-bold">{hintOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = hintOtp.split('');
                    setOtp(digits);
                    handleOtpVerify(hintOtp);
                  }}
                  className="px-2.5 py-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 cursor-pointer shadow-xs"
                >
                  Auto-fill
                </button>
              </div>
            )}


            {/* 4 Digit OTP Inputs */}
            <div className="flex justify-center gap-3 py-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpInputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-white border-2 border-pink-200 rounded-xl focus:border-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-[#1F121C] shadow-2xs"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleOtpVerify()}
              disabled={isLoading || otp.some(d => !d)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-md shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Login</span>
              )}
            </button>

            <div className="text-center pt-1">
              {resendSeconds > 0 ? (
                <p className="text-xs text-slate-500">
                  Resend code in <span className="font-bold text-pink-600">{resendSeconds}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-xs font-bold text-pink-600 hover:underline cursor-pointer"
                >
                  Resend verification code
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
