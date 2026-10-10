import React, { useState } from 'react';
import { CustomerUser, Booking } from '../types';
import { HomeServiceCard } from '../data/homeServices';
import { createBooking } from '../api';
import { X, Calendar, Clock, MapPin, Camera, Trash2, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, CreditCard, Banknote } from 'lucide-react';

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
  const [paymentMethod, setPaymentMethod] = useState<'pay_after_work' | 'online'>('pay_after_work');
  
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

  const handleSubmitBooking = async () => {
    setErrorMsg('');
    if (!problemDescription.trim()) {
      setErrorMsg('Please briefly describe the service requirement or problem');
      return;
    }

    setIsSubmitting(true);
    try {
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
        payment_method: paymentMethod === 'pay_after_work' ? 'pay_after_work' : 'upi',
        payment_status: paymentMethod === 'pay_after_work' ? 'pending' : 'paid',
        status: 'requested',
        booking_mode: 'instant',
        customer_notes: problemDescription,
        customer_problem: problemDescription,
        customer_photo: photoPreview || undefined,
        scheduled_date: selectedDate,
        scheduled_time_slot: selectedSlot
      };

      // If online test payment is selected, simulate genuine gateway verification
      if (paymentMethod === 'online') {
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalPrice,
            method: 'upi_test_mode',
            payment_id: `pay_test_${Date.now()}`
          })
        }).catch(() => null);
        
        if (verifyRes && verifyRes.ok) {
          bookingData.payment_status = 'paid';
        }
      }

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
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Book {service.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Estimated time: ~{service.duration_mins} mins</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
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

          {/* 1. Problem / Requirements */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. What needs to be done? <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="e.g. Tap leaking continuously in the guest bathroom, or need 2 bedrooms swept & mopped..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* 2. Photo attachment (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Add Photo (Optional)
            </label>
            {photoPreview ? (
              <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden">
                <img src={photoPreview} alt="Issue preview" className="w-32 h-24 object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer border border-slate-200 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Upload photo of problem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 3. Date & Time Slot */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              3. Select Date & Time Slot
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
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-colors ${
                    selectedDate === d.key
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-600" />
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
                  className={`p-2 text-xs rounded-xl border text-left flex items-center justify-between transition-colors ${
                    selectedSlot === slot
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{slot}</span>
                  </span>
                  {selectedSlot === slot && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Doorstep Service Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                4. Service Address
              </label>
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Change Address
              </button>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-800">
                <p className="font-semibold">{currentUser.name} ({currentUser.phone})</p>
                <p className="text-slate-600 mt-0.5">{savedAddress}</p>
              </div>
            </div>
          </div>

          {/* 5. Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              5. Payment Option
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('pay_after_work')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  paymentMethod === 'pay_after_work'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Pay After Service</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Cash or UPI after job completion</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  paymentMethod === 'online'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Pay Online</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">UPI / Card test gateway verified</p>
              </button>
            </div>
          </div>

          {/* 6. Transparent Price Breakdown */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Service Estimate ({service.title})</span>
              <span>₹{basePrice}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Safety & Convenience Fee</span>
              <span>₹{platformFee}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes & Doorstep Visit</span>
              <span className="text-emerald-600 font-medium">Free</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Amount</span>
              <span className="text-emerald-600">₹{totalPrice}</span>
            </div>
          </div>

          {/* Cancellation Policy footnote */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Free cancellation anytime before partner arrives. Zero advance risk.</span>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total Payable</p>
            <p className="text-base font-bold text-slate-900">₹{totalPrice}</p>
          </div>
          <button
            type="button"
            onClick={handleSubmitBooking}
            disabled={isSubmitting || !problemDescription.trim()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirming Order...</span>
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
    </div>
  );
};
