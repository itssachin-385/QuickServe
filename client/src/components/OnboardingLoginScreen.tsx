import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Check, 
  X, 
  ShieldCheck, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { CustomerUser } from '../types';
import { sendOtp, verifyOtp } from '../api';

interface OnboardingLoginScreenProps {
  onSuccess: (user: CustomerUser) => void;
  onSkip: () => void;
}

export const OnboardingLoginScreen: React.FC<OnboardingLoginScreenProps> = ({
  onSuccess,
  onSkip
}) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    if (error) setError(null);
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await sendOtp(phone);
      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setStatusMessage(res.message || `OTP sent to +91 ${phone}`);

      if (res.demo_otp) {
        setDemoOtpCode(res.demo_otp);
        // Split demo OTP into 4 boxes
        const digits = res.demo_otp.slice(0, 4).split('');
        setOtp(digits);
      } else {
        setOtp(['', '', '', '']);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanDigit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (cleanDigit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (error) setError(null);

    // If 4 digits entered, auto-verify
    const completeCode = newOtp.join('');
    if (completeCode.length === 4) {
      submitVerify(completeCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const submitVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (code.length < 4) {
      setError('Please enter the 4-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyOtp(phone, code);
      if (res && res.user) {
        localStorage.setItem('quickserve_user', JSON.stringify(res.user));
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col justify-between font-sans relative overflow-x-hidden select-none">
      {/* Top Emerald Green Header with Convex Curve */}
      <div className="bg-[#1ca064] text-white pt-10 sm:pt-12 pb-7 px-5 rounded-b-[40px] shadow-lg shadow-emerald-900/10 relative z-20 flex flex-col items-center">
        {/* Top Right "Skip login" Pill Button */}
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="bg-[#05683c] hover:bg-[#04522e] active:scale-95 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all shadow-sm cursor-pointer"
          >
            Skip login
          </button>
        </div>

        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center gap-2.5 mt-1 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md">
            <img 
              src="/images/quickserve_app_icon.png" 
              alt="QuickServe" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-3xl sm:text-[34px] font-black tracking-tight text-white font-sans">
            Quick<span className="text-amber-300">Serve</span>
          </span>
        </div>

        {/* Tagline / Subtitle */}
        <h1 className="text-[21px] sm:text-2xl font-black text-white text-center leading-snug tracking-tight mt-1">
          Get professional<br />house help in minutes!
        </h1>
      </div>

      {/* Middle Household Chores Showcase Grid */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-2 relative overflow-hidden">
        <div className="w-full max-w-md relative flex items-center justify-center">
          <img 
            src="/images/chores_grid_banner.jpg" 
            alt="Household Chores Showcase" 
            className="w-full h-auto object-cover max-h-[290px] rounded-2xl select-none pointer-events-none drop-shadow-xs"
          />
          {/* Subtle fade gradient at bottom of the grid */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/70 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Bottom White Action Sheet */}
      <div className="bg-white w-full max-w-md mx-auto rounded-t-[32px] sm:rounded-b-[32px] shadow-2xl border-t border-slate-100 px-6 pt-5 pb-8 relative z-20">
        {step === 'phone' ? (
          <div>
            {/* Title */}
            <h2 className="text-[23px] sm:text-2xl font-black text-slate-900 tracking-tight mb-4">
              Log in or Sign up
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Phone Input Box */}
            <div 
              className={`w-full rounded-2xl border transition-all duration-200 flex items-center px-4 py-3.5 bg-white ${
                isFocused 
                  ? 'border-[#1ca064] ring-2 ring-emerald-500/20 shadow-xs' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-base font-bold text-slate-900 tracking-wide select-none mr-2.5">
                +91
              </span>
              <div className="h-5 w-px bg-slate-200 mr-3" />
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full text-base font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none tracking-wider"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && phone.length === 10) {
                    handleSendOtp();
                  }
                }}
              />
              {phone.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPhone('')}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* WhatsApp Updates Checkbox */}
            <label className="flex items-center gap-2.5 mt-3.5 cursor-pointer select-none group">
              <div 
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  whatsappUpdates 
                    ? 'bg-[#1ca064] border-[#1ca064]' 
                    : 'border-slate-300 group-hover:border-slate-400 bg-white'
                }`}
              >
                {whatsappUpdates && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </div>
              <input
                type="checkbox"
                checked={whatsappUpdates}
                onChange={(e) => setWhatsappUpdates(e.target.checked)}
                className="sr-only"
              />
              <span className="text-xs font-semibold text-slate-700">
                Get updates on WhatsApp
              </span>
            </label>

            {/* Continue Button */}
            <button
              type="button"
              disabled={phone.length !== 10 || loading}
              onClick={handleSendOtp}
              className={`w-full py-4 mt-5 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 select-none ${
                phone.length === 10 && !loading
                  ? 'bg-[#1ca064] hover:bg-[#168a54] active:scale-[0.99] text-white shadow-lg shadow-emerald-600/25 cursor-pointer'
                  : 'bg-[#cbd5e1] text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Continue'
              )}
            </button>

            {/* Legal / Policy Disclaimer */}
            <p className="text-[11px] text-slate-500 text-center mt-3.5 font-normal leading-normal">
              By continuing, you agree to our{' '}
              <button 
                type="button" 
                onClick={() => setShowTermsModal(true)} 
                className="underline font-semibold text-slate-700 hover:text-emerald-700 cursor-pointer"
              >
                Terms of Service
              </button>
              {' '}&{' '}
              <button 
                type="button" 
                onClick={() => setShowTermsModal(true)} 
                className="underline font-semibold text-slate-700 hover:text-emerald-700 cursor-pointer"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        ) : (
          /* Step 2: OTP Verification */
          <div>
            {/* Header with back button */}
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Enter Verification Code
                </h2>
                <p className="text-xs text-slate-500">
                  Sent to <span className="font-bold text-slate-800">+91 {phone}</span>
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Status Message */}
            {statusMessage && !error && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <span>💬 {statusMessage}</span>
              </div>
            )}

            {/* 4 Digit OTP Inputs */}
            <div className="flex justify-center gap-3 my-4">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpInputRefs.current[idx] = el; }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[idx] || ''}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-14 h-14 text-center text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#1ca064] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              ))}
            </div>

            {/* Demo OTP Tap-to-Fill Shortcut */}
            {demoOtpCode && (
              <div className="mb-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const digits = demoOtpCode.slice(0, 4).split('');
                    setOtp(digits);
                    submitVerify(demoOtpCode);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Auto-fill demo OTP: <b>{demoOtpCode}</b>
                </button>
              </div>
            )}

            {/* Resend Timer & Button */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mt-2 px-1">
              <span>Didn't receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-[#1ca064] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Resend OTP
                </button>
              ) : (
                <span className="text-slate-400">
                  Resend in {resendTimer}s
                </span>
              )}
            </div>

            {/* Verify & Proceed Button */}
            <button
              type="button"
              disabled={otp.join('').length !== 4 || loading}
              onClick={() => submitVerify()}
              className={`w-full py-4 mt-5 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 select-none ${
                otp.join('').length === 4 && !loading
                  ? 'bg-[#1ca064] hover:bg-[#168a54] active:scale-[0.99] text-white shadow-lg shadow-emerald-600/25 cursor-pointer'
                  : 'bg-[#cbd5e1] text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Verify & Continue'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Terms of Service & Privacy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Terms & Privacy
              </h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <b>1. QuickServe Service Guarantee:</b> Verified background-checked professionals reach your doorstep with 15-minute express availability across active clusters.
              </p>
              <p>
                <b>2. Pricing & Payments:</b> Transparent hourly rates and chore stacking with no hidden surcharges. All transactions are securely processed.
              </p>
              <p>
                <b>3. Privacy Policy:</b> Your mobile number is used strictly for authentication, booking updates, and partner coordination. We never share your data with unauthorized third parties.
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full mt-5 py-3 bg-[#1ca064] text-white font-bold rounded-xl text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
