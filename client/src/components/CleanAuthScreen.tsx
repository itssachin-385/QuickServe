import React, { useState, useEffect, useRef } from 'react';
import { CustomerUser } from '../types';
import { sendOtp, verifyOtp } from '../api';
import { ShieldCheck, Phone, User, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendSeconds, setResendSeconds] = useState(30);
  const [hintOtp, setHintOtp] = useState<string | null>(null);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendSeconds > 0) {
      timer = setInterval(() => setResendSeconds(s => s - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendSeconds]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

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
      const res = await verifyOtp(phone, fullOtp, name.trim());
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_25px_rgba(15,23,42,0.06)] border border-[#E2E8F0] p-6 md:p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0F172A] text-white shadow-md border border-slate-800 mb-3">
            <span className="font-black text-xl"><span className="text-white">Q</span><span className="text-[#2563EB]">S</span></span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight font-heading">
            Quick<span className="text-[#2563EB]">Serve</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">Reliable on-demand home services at your doorstep</p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Phone & Name Input */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A] placeholder-slate-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="relative flex">
                <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-[#E2E8F0] bg-slate-50 text-slate-700 text-sm font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-r-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A] placeholder-slate-400 tracking-wider font-medium transition-all"
                />
              </div>
              <p className="text-xs text-[#64748B] mt-1.5">We will send a 4-digit one-time verification code.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.length !== 10 || !name.trim()}
              className="w-full mt-2 py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Verification Code</p>
                <p className="text-sm text-slate-500 mt-0.5">Sent to +91 {phone}</p>
              </div>
              <button
                type="button"
                onClick={() => { setStep('phone'); setErrorMessage(''); }}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>

            {/* OTP Hint if available */}
            {hintOtp && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <span>Verification code: <strong className="font-mono text-sm tracking-wider font-bold">{hintOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = hintOtp.split('');
                    setOtp(digits);
                    handleOtpVerify(hintOtp);
                  }}
                  className="px-2 py-1 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* 4 Digit OTP Inputs */}
            <div className="flex justify-center gap-3 my-2">
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
                  className="w-13 h-14 w-12 text-center text-xl font-bold bg-white border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleOtpVerify()}
              disabled={isLoading || otp.some(d => !d)}
              className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Login</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              {resendSeconds > 0 ? (
                <p className="text-xs text-[#64748B]">Resend code in <span className="font-semibold text-[#0F172A]">{resendSeconds}s</span></p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-xs font-semibold text-[#2563EB] hover:underline transition-colors cursor-pointer"
                >
                  Resend verification code
                </button>
              )}
            </div>
          </div>
        )}

        {/* Security Trust Footnote */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>QuickServe Secure Session • No spam calls</span>
        </div>

        {onCancel && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Back to main view
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
