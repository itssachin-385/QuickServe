import React, { useState } from 'react';
import { CustomerUser, Booking } from '../types';
import { HomeServiceCard } from '../data/homeServices';
import { createBooking } from '../api';
import { 
  X, Calendar, Clock, MapPin, Camera, Trash2, 
  CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, 
  CreditCard, Banknote, Smartphone, QrCode, ArrowRight 
} from 'lucide-react';
import { RazorpayModal } from './RazorpayModal';

interface CleanBookingModalProps {
  service: HomeServiceCard;
  currentUser: CustomerUser;
  activeCityZone: string;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  onOpenLocationModal: () => void;
}

export const CleanBookingModal: React.FC<CleanBookingModalProps> = ({
  service,
  currentUser,
  activeCityZone,
  onClose,
  onSuccess,
  onOpenLocationModal
}) => {
  // Date options
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const dayAfter = new Date(Date.now() + 172800000);

  const formatDateLabel = (d: Date) => {
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const [selectedDate, setSelectedDate] = useState<string>('Today');
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM - 01:00 PM');
  const [problemDescription, setProblemDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'pay_after_work'>('upi');
  const [showUpiModal, setShowUpiModal] = useState(false);
  
  // Doorstep address from local storage
  const [savedAddress, setSavedAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('quickserve_doorstep_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.fullCompleteAddress || activeCityZone;
      }
    } catch (e) {}
    return activeCityZone;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pricing
  const basePrice = service.startingPrice;
  const platformFee = 29;
  const totalPrice = basePrice + platformFee;

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Please select a photo under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInitiateBooking = () => {
    if (paymentMethod === 'upi') {
      setShowUpiModal(true);
    } else {
      handleCreateBookingFinal('pay_after_work', 'pending');
    }
  };

  const handleUpiPaymentSuccess = async (paymentId: string) => {
    setShowUpiModal(false);
    await handleCreateBookingFinal('upi', 'paid', paymentId);
  };

  const handleCreateBookingFinal = async (
    method: 'upi' | 'pay_after_work',
    pStatus: 'paid' | 'pending',
    paymentId?: string
  ) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const defaultProblem = service.subServiceName || service.title || 'Standard doorstep service';
      const bookingData: Partial<Booking> = {
        customer_name: currentUser.name,
        customer_phone: currentUser.phone,
        customer_address: savedAddress,
        locality: activeCityZone,
        service_id: service.categoryId,
        service_title: service.title,
        sub_service_selected: service.subServiceName || service.title,
        base_charge: basePrice,
        platform_fee: platformFee,
        total_amount: totalPrice,
        payment_method: method,
        payment_status: pStatus,
        payment_id: paymentId,
        status: 'requested',
        booking_mode: 'instant',
        customer_notes: defaultProblem,
        customer_problem: defaultProblem,
        scheduled_date: selectedDate,
        scheduled_time_slot: selectedSlot
      };

      const res = await createBooking(bookingData);
      if (res.success && res.booking) {
        onSuccess(res.booking);
        onClose();
      } else {
        setErrorMsg('Failed to place booking. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {service.image && (
              <img
                src={service.image}
                alt={service.title}
                className="w-12 h-12 rounded-xl object-cover border border-[#E2E8F0] shrink-0 shadow-2xs"
                loading="lazy"
              />
            )}
            <div>
              <h2 className="text-base font-bold text-[#0F172A] leading-snug">Book {service.title}</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Estimated time: ~{service.duration_mins} mins • Starts at ₹{service.startingPrice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Date & Time Slot */}
          <div>
            <label className="block text-xs font-semibold text-[#1F121C] uppercase tracking-wider mb-2">
              1. Select Date & Time Slot
            </label>
            
            {/* Date chips */}
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              {[
                { key: 'Today', label: `Today (${formatDateLabel(today).split(' ')[1]} ${formatDateLabel(today).split(' ')[2]})` },
                { key: 'Tomorrow', label: `Tomorrow (${formatDateLabel(tomorrow).split(' ')[1]} ${formatDateLabel(tomorrow).split(' ')[2]})` },
                { key: 'DayAfter', label: formatDateLabel(dayAfter) }
              ].map(d => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedDate(d.key)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                    selectedDate === d.key
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-600 text-white font-bold shadow-xs'
                      : 'bg-white border-pink-100 text-[#1F121C] hover:bg-pink-50/50 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className={`w-3 h-3 ${selectedDate === d.key ? 'text-pink-100' : 'text-pink-600'}`} />
                    <span className="truncate">{d.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Time Slot Radio Chips */}
            <div className="grid grid-cols-2 gap-2">
              {[
                '09:00 AM - 12:00 PM',
                '12:00 PM - 03:00 PM',
                '03:00 PM - 06:00 PM',
                '06:00 PM - 08:30 PM'
              ].map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2.5 text-xs rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedSlot === slot
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-600 text-white font-bold shadow-xs'
                      : 'bg-white border-pink-100 text-[#1F121C] hover:bg-pink-50/50 hover:border-pink-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className={`w-3 h-3 ${selectedSlot === slot ? 'text-pink-100' : 'text-slate-400'}`} />
                    <span>{slot}</span>
                  </span>
                  {selectedSlot === slot && <CheckCircle2 className="w-3.5 h-3.5 text-pink-100 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Doorstep Service Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1F121C] uppercase tracking-wider">
                2. Service Address
              </label>
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="text-xs font-semibold text-pink-600 hover:text-pink-700 hover:underline cursor-pointer"
              >
                Change Address
              </button>
            </div>
            <div className="p-3 bg-pink-50/40 border border-pink-100 rounded-xl flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
              <div className="text-xs text-[#1F121C]">
                <p className="font-semibold">{currentUser.name} ({currentUser.phone})</p>
                <p className="text-[#705869] mt-0.5">{savedAddress}</p>
              </div>
            </div>
          </div>

          {/* 3. Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-[#1F121C] uppercase tracking-wider mb-2">
              3. Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  paymentMethod === 'upi'
                    ? 'bg-pink-50/90 border-pink-500 text-[#1F121C] shadow-sm'
                    : 'bg-white border-pink-100 text-[#705869] hover:bg-pink-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className={`w-4 h-4 ${paymentMethod === 'upi' ? 'text-pink-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-extrabold text-[#1F121C]">Pay via UPI</span>
                  </div>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md">
                    Instant
                  </span>
                </div>
                <p className="text-[11px] text-[#705869] mt-1.5 font-medium leading-tight">GPay, PhonePe, Paytm, QR</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('pay_after_work')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'pay_after_work'
                    ? 'bg-pink-50/90 border-pink-500 text-[#1F121C] shadow-sm'
                    : 'bg-white border-pink-100 text-[#705869] hover:bg-pink-50/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Banknote className={`w-4 h-4 ${paymentMethod === 'pay_after_work' ? 'text-pink-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-extrabold text-[#1F121C]">Pay After Service</span>
                </div>
                <p className="text-[11px] text-[#705869] mt-1.5 font-medium leading-tight">Cash or UPI upon visit</p>
              </button>
            </div>
          </div>

          {/* 4. Transparent Price Breakdown */}
          <div className="p-3.5 bg-pink-50/30 border border-pink-100 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-[#705869]">
              <span>Service Estimate ({service.title})</span>
              <span className="font-medium text-[#1F121C]">₹{basePrice}</span>
            </div>
            <div className="flex justify-between text-[#705869]">
              <span>Safety & Convenience Fee</span>
              <span className="font-medium text-[#1F121C]">₹{platformFee}</span>
            </div>
            <div className="flex justify-between text-[#705869]">
              <span>Taxes & Doorstep Visit</span>
              <span className="text-pink-700 font-semibold">Free</span>
            </div>
            <div className="pt-2 border-t border-pink-100 flex justify-between font-bold text-[#1F121C] text-sm">
              <span>Total Amount</span>
              <span className="text-pink-600 font-extrabold">₹{totalPrice}</span>
            </div>
          </div>

          {/* Cancellation Policy footnote */}
          <div className="flex items-center gap-2 text-xs text-[#705869]">
            <ShieldCheck className="w-4 h-4 text-pink-600 shrink-0" />
            <span>Free cancellation anytime before partner arrives. Zero advance risk.</span>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-pink-100 bg-white flex items-center justify-between">
          <div>
            <p className="text-xs text-pink-900/60 font-bold uppercase tracking-wider">Total Payable</p>
            <p className="text-lg font-extrabold text-[#1F121C]">₹{totalPrice}</p>
          </div>
          <button
            type="button"
            onClick={handleInitiateBooking}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-pink-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirming Order...</span>
              </>
            ) : paymentMethod === 'upi' ? (
              <>
                <QrCode className="w-4 h-4" />
                <span>Pay ₹{totalPrice} via UPI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Real Live UPI Gateway Modal */}
      {showUpiModal && (
        <RazorpayModal
          amount={totalPrice}
          serviceTitle={service.title}
          customerName={currentUser.name}
          customerPhone={currentUser.phone}
          onSuccess={handleUpiPaymentSuccess}
          onClose={() => setShowUpiModal(false)}
        />
      )}

    </div>
  );
};
