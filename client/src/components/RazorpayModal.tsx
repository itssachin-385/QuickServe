import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  Smartphone, 
  X, 
  Copy, 
  Settings, 
  RefreshCw, 
  AlertCircle, 
  AlertTriangle,
  Wallet,
  Sparkles,
  Lock,
  ArrowRight,
  Clock,
  Upload,
  Image as ImageIcon,
  Trash2,
  Info
} from 'lucide-react';
import { createPaymentOrder, verifyPayment, fetchGatewayConfig, updateGatewayConfig } from '../api';

interface RazorpayModalProps {
  amount: number;
  serviceTitle: string;
  customerName?: string;
  customerPhone?: string;
  bookingId?: string;
  onSuccess: (paymentId: string, utr?: string, paymentProofPhoto?: string) => void;
  onClose: () => void;
  onSwitchToPayAfterService?: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  amount,
  serviceTitle,
  customerName = 'Customer',
  customerPhone = '',
  bookingId,
  onSuccess,
  onClose,
  onSwitchToPayAfterService
}) => {
  const [activeTab, setActiveTab] = useState<'upi_apps' | 'upi_qr' | 'settings'>('upi_apps');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [enteredUtr, setEnteredUtr] = useState('');
  const [utrError, setUtrError] = useState('');
  const [paymentProofPhoto, setPaymentProofPhoto] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');

  // Settings form state
  const [editFast2SmsKey, setEditFast2SmsKey] = useState('');
  const [editUpiVpa, setEditUpiVpa] = useState('');
  const [editMerchantPhone, setEditMerchantPhone] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Initialize payment order from server
  useEffect(() => {
    const initOrder = async () => {
      try {
        setIsLoadingOrder(true);
        const [ordRes, cfgRes] = await Promise.all([
          createPaymentOrder({
            amount,
            booking_id: bookingId,
            customer_name: customerName,
            customer_phone: customerPhone,
            service_title: serviceTitle
          }),
          fetchGatewayConfig().catch(() => null)
        ]);

        setOrderData(ordRes);
        if (cfgRes) {
          setGatewayConfig(cfgRes);
          setEditUpiVpa(cfgRes.upi?.vpa || 'sachinsb68741@nyes');
          setEditMerchantPhone(cfgRes.upi?.merchantPhone || '9570151834');
        }
      } catch (err) {
        console.error('Failed to create payment order:', err);
      } finally {
        setIsLoadingOrder(false);
      }
    };

    initOrder();
  }, [amount, bookingId]);

  const upiVpa = orderData?.upi_vpa || gatewayConfig?.upi?.vpa || 'sachinsb68741@nyes';
  const merchantPhone = orderData?.merchant_phone || gatewayConfig?.upi?.merchantPhone || '9570151834';
  const upiMerchantName = orderData?.upi_merchant_name || gatewayConfig?.upi?.merchantName || 'Sachin Kumar';
  const upiIntentUrl = orderData?.upi_intent_url || `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiMerchantName)}&am=${amount}&tn=QuickServe+Payment&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(upiIntentUrl)}`;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(merchantPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const validateUtrInput = (utr: string): { valid: boolean; error?: string } => {
    const clean = utr.replace(/\D/g, '').trim();
    if (!clean || clean.length !== 12) {
      return { 
        valid: false, 
        error: 'Kripya poora 12-digit UPI Reference (UTR) number enter karein.' 
      };
    }
    const uniqueDigits = new Set(clean.split('')).size;
    if (uniqueDigits < 4) {
      return { 
        valid: false, 
        error: 'Invalid UTR: Fake ya repeated numbers (jaise 111111111111, 555555555555) allow nahi hain. Asli UPI payment reference enter karein.' 
      };
    }
    const sequential = ['012345678901', '123456789012', '987654321098', '098765432109', '112233445566', '121212121212'];
    if (sequential.includes(clean)) {
      return { 
        valid: false, 
        error: 'Invalid UTR: Sequential / dummy number detect hua hai. Asli UTR enter karein.' 
      };
    }
    return { valid: true };
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUtrError('Payment screenshot size must be under 5MB');
        return;
      }
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPhoto(reader.result as string);
        if (utrError) setUtrError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmUpiPayment = async () => {
    const cleanUtr = enteredUtr.replace(/\D/g, '').trim();
    const validation = validateUtrInput(cleanUtr);
    if (!validation.valid) {
      setUtrError(validation.error || 'Invalid UTR');
      return;
    }

    if (!paymentProofPhoto) {
      setUtrError('Kripya UPI payment receipt ka screenshot (GPay / PhonePe / Paytm) upload karein taaki hum verify kar sakein.');
      return;
    }

    setUtrError('');
    setIsProcessing(true);
    const paymentId = `UTR-${cleanUtr}`;

    try {
      if (bookingId && bookingId !== 'bk-direct') {
        await verifyPayment({
          booking_id: bookingId,
          payment_id: paymentId,
          method: 'upi',
          amount,
          upi_utr: cleanUtr,
          payment_proof_photo: paymentProofPhoto
        });
      }
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(paymentId, cleanUtr, paymentProofPhoto);
      }, 1800);
    } catch (err: any) {
      setIsProcessing(false);
      setUtrError(err.message || 'Payment verification failed. Kripya sahi UTR aur payment receipt upload karein.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateGatewayConfig({
        fast2smsApiKey: editFast2SmsKey ? editFast2SmsKey : undefined,
        upiVpa: editUpiVpa ? editUpiVpa : undefined,
        merchantPhone: editMerchantPhone ? editMerchantPhone : undefined
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      const updated = await fetchGatewayConfig();
      setGatewayConfig(updated);
    } catch (err) {
      alert('Failed to save gateway settings');
    }
  };

  const renderUpiVerificationCard = () => (
    <div className="space-y-3 pt-2">
      {/* Anti-Fraud Security Notice Banner */}
      <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-left">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-rose-900 leading-snug">
          <strong className="font-bold block text-rose-950">Security & Anti-Fraud Notice:</strong>
          Fake ya dummy UTR submit karne par booking cancel hogi aur mobile number blacklist ho jayega. Har UPI payment bank account me credit check hota hai.
        </div>
      </div>

      {/* 1. Mandatory UPI UTR Reference Card */}
      <div className="bg-pink-50/70 p-3.5 rounded-2xl border border-pink-200 space-y-2 text-left shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-pink-950 flex items-center gap-1.5">
            <span>12-Digit UPI Ref / UTR Number</span>
            <span className="text-rose-600 font-bold text-[10px] bg-rose-100 px-1.5 py-0.2 rounded-full">*Mandatory</span>
          </label>
          <span className="text-[10px] font-mono text-pink-700 font-bold">
            {enteredUtr.replace(/\D/g, '').length}/12
          </span>
        </div>

        <input
          type="text"
          inputMode="numeric"
          maxLength={12}
          value={enteredUtr}
          onChange={(e) => {
            setEnteredUtr(e.target.value.replace(/\D/g, ''));
            if (utrError) setUtrError('');
          }}
          placeholder="e.g. 4289 1234 5678"
          className="w-full px-3.5 py-2.5 rounded-xl border border-pink-300 focus:border-pink-600 focus:ring-2 focus:ring-pink-200 font-mono text-sm tracking-wider font-extrabold text-slate-900 bg-white outline-none transition-all shadow-inner"
        />

        <p className="text-[10px] text-slate-600 leading-tight">
          📌 Payment hone par apne Google Pay, PhonePe ya Paytm app ke <strong>Transaction Details</strong> se 12-digit UPI Ref/UTR No. yahan enter karein.
        </p>
      </div>

      {/* 2. Mandatory Screenshot Proof Upload */}
      <div className="bg-white p-3.5 rounded-2xl border-2 border-dashed border-pink-300 space-y-2 text-left">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-pink-600" />
            <span>Upload Payment Screenshot</span>
            <span className="text-rose-600 font-bold text-[10px] bg-rose-100 px-1.5 py-0.2 rounded-full">*Proof</span>
          </label>
          {paymentProofPhoto && (
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ Attached
            </span>
          )}
        </div>

        {paymentProofPhoto ? (
          <div className="flex items-center gap-3 p-2 bg-pink-50/50 rounded-xl border border-pink-200">
            <img 
              src={paymentProofPhoto} 
              alt="Payment receipt preview" 
              className="w-12 h-12 object-cover rounded-lg border border-pink-200 shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate block">
                {screenshotName || 'Payment_Receipt.jpg'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Ready for verification</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPaymentProofPhoto('');
                setScreenshotName('');
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Remove screenshot"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-3 border border-pink-100 rounded-xl bg-pink-50/40 hover:bg-pink-50 cursor-pointer transition-colors group">
            <div className="flex items-center gap-2 text-pink-700 font-bold text-xs">
              <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Tap to attach GPay / PhonePe Receipt</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or Screenshot up to 5MB</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleScreenshotChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Error Message */}
      {utrError && (
        <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-medium text-left">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{utrError}</span>
        </div>
      )}

      {/* Action Confirm Button */}
      <button
        disabled={isProcessing}
        onClick={handleConfirmUpiPayment}
        className="w-full py-3.5 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Verifying UTR & Screenshot...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Submit UTR & Confirm Booking</span>
          </>
        )}
      </button>

      {/* Safe 1-Tap Alternative to Pay After Service */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={() => {
            if (onSwitchToPayAfterService) {
              onSwitchToPayAfterService();
            } else {
              onClose();
            }
          }}
          className="text-xs text-pink-700 hover:text-pink-800 font-bold py-1 px-3 rounded-full hover:bg-pink-50 transition-all cursor-pointer underline flex items-center justify-center gap-1 mx-auto"
        >
          <span>Abhi pay nahi kiya? Pay After Service (₹0 Advance) chunein</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 text-slate-900 font-sans flex flex-col max-h-[92vh]">
        {/* Gateway Header */}
        <div className="bg-gradient-to-r from-pink-700 via-rose-600 to-pink-800 text-white p-4 sm:p-5 flex items-center justify-between border-b border-pink-400/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-pink-600 flex items-center justify-center font-black text-lg shadow-lg shadow-pink-900/20">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-white/20 text-white border border-white/30 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider">
                  Instant UPI Payment
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white mt-0.5">
                QuickServe UPI Pay
              </h3>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-full text-pink-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Price Strip */}
        <div className="bg-pink-50/50 px-5 py-3 border-b border-pink-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Service Order</span>
            <span className="font-bold text-slate-800 line-clamp-1">{serviceTitle}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider block">Total Payable</span>
            <span className="text-xl font-black text-pink-600">₹{amount}</span>
          </div>
        </div>

        {/* Payment Methods Nav Tabs (UPI ONLY - NO CARDS) */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upi_apps')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upi_apps'
                ? 'bg-white text-pink-700 shadow-sm border border-pink-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-pink-600" />
            <span>1-Tap UPI Apps</span>
          </button>

          <button
            onClick={() => setActiveTab('upi_qr')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upi_qr'
                ? 'bg-white text-pink-700 shadow-sm border border-pink-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Scan QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Gateway Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Order Placed • Verification Pending</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Aapka 12-digit UTR <span className="font-mono font-black text-slate-900">({enteredUtr})</span> aur payment receipt screenshot submit ho gaya hai. Humare professional visit se pehle bank credit verify karenge.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 inline-block font-mono text-amber-900 font-bold text-xs">
                UTR: {enteredUtr} • Verification Pending ⏳
              </div>
              <p className="text-[10px] text-slate-400">
                Doorstep par agar amount bank me credit confirm nahi hua to cash ya QR se pay karna hoga.
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: SCAN UPI QR CODE */}
              {activeTab === 'upi_qr' && (
                <div className="space-y-4 text-center">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 shadow-sm relative">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                    </span>

                    {/* Dynamic Real QR Code */}
                    <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl border-2 border-slate-300 shadow-md flex items-center justify-center relative group">
                      <img 
                        src={qrCodeUrl} 
                        alt="UPI Payment QR" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                          Dynamic NPCI QR
                        </span>
                      </div>
                    </div>

                    {/* Merchant & UPI Details Badges */}
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Official UPI ID</span>
                          <span className="font-mono font-black text-xs text-emerald-800">{upiVpa}</span>
                        </div>
                        <button
                          onClick={handleCopyVpa}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy UPI VPA"
                        >
                          {copiedVpa ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedVpa ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Merchant Phone Number</span>
                          <span className="font-mono font-black text-xs text-slate-900">+91 {merchantPhone}</span>
                        </div>
                        <button
                          onClick={handleCopyPhone}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy Phone Number"
                        >
                          {copiedPhone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Render Shared Anti-Fraud UTR & Screenshot Verification Card */}
                  {renderUpiVerificationCard()}
                </div>
              )}

              {/* TAB 2: PAY VIA DIRECT UPI APP INTENT */}
              {activeTab === 'upi_apps' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                    <span className="font-extrabold text-blue-950 text-xs block">1-Tap Direct UPI Apps</span>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Tap any app below to open on your phone with ₹{amount} pre-filled.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={upiIntentUrl}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-3 transition-all shadow-xs group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                        <Smartphone className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-900 block">Google Pay</span>
                        <span className="text-[10px] text-slate-400">Direct Pay</span>
                      </div>
                    </a>

                    <a
                      href={upiIntentUrl}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-purple-500 hover:bg-purple-50/50 flex items-center gap-3 transition-all shadow-xs group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                        <Smartphone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-900 block">PhonePe</span>
                        <span className="text-[10px] text-slate-400">Direct Pay</span>
                      </div>
                    </a>

                    <a
                      href={upiIntentUrl}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-sky-500 hover:bg-sky-50/50 flex items-center gap-3 transition-all shadow-xs group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                        <Smartphone className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-900 block">Paytm UPI</span>
                        <span className="text-[10px] text-slate-400">Direct Pay</span>
                      </div>
                    </a>

                    <a
                      href={upiIntentUrl}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50/50 flex items-center gap-3 transition-all shadow-xs group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                        <Smartphone className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-900 block">BHIM / Any UPI</span>
                        <span className="text-[10px] text-slate-400">Direct Pay</span>
                      </div>
                    </a>
                  </div>

                  {/* Official UPI Details */}
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Official Payee VPA</span>
                      <span className="font-mono font-black text-xs text-slate-900">{upiVpa}</span>
                    </div>
                    <button
                      onClick={handleCopyVpa}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedVpa ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedVpa ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Render Shared Anti-Fraud UTR & Screenshot Verification Card */}
                  {renderUpiVerificationCard()}
                </div>
              )}

              {/* TAB 3: GATEWAY & FAST2SMS SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Gateway Credentials & VPA
                    </span>
                    {settingsSaved && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Saved ✓
                      </span>
                    )}
                  </div>

                  {/* Fast2SMS API Key */}
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">
                      Fast2SMS API Key (for Real Phone SMS):
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your Fast2SMS API Key here"
                      value={editFast2SmsKey}
                      onChange={(e) => setEditFast2SmsKey(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {gatewayConfig?.fast2sms?.hasKey ? '✅ Fast2SMS API Key is ACTIVE' : 'ℹ️ Fast2SMS not set (using test OTP simulation)'}
                    </p>
                  </div>

                  {/* UPI VPA (Merchant ID) */}
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">
                      Custom UPI VPA (for QR code):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okaxis or yourname@upi"
                      value={editUpiVpa}
                      onChange={(e) => setEditUpiVpa(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      When customers scan the QR with GPay/PhonePe, money is routed to this UPI ID.
                    </span>
                  </div>

                  {/* Merchant Phone Number */}
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">
                      Merchant Phone Number:
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9570151834"
                      value={editMerchantPhone}
                      onChange={(e) => setEditMerchantPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Merchant mobile number displayed to customers during checkout.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Save Gateway Settings</span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Security Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 px-5">
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>256-Bit SSL Encrypted • NPCI UPI & RBI Compliant</span>
          </div>
          <span className="font-mono text-slate-400">100% Cashless</span>
        </div>
      </div>
    </div>
  );
};
