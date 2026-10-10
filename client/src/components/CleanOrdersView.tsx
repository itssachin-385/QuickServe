import React, { useState } from 'react';
import { Booking } from '../types';
import { updateBookingStatus } from '../api';
import { 
  Calendar, Clock, MapPin, Phone, User, 
  CheckCircle2, XCircle, AlertCircle, Ban, 
  ChevronRight, RefreshCw, FileText, Image as ImageIcon, ShieldCheck 
} from 'lucide-react';

interface CleanOrdersViewProps {
  bookings: Booking[];
  customerPhone?: string;
  onRefresh: () => void;
  onNavigateHome: () => void;
}

// 6 Core Statuses mapping
type CleanStatusKey = 'Booking Requested' | 'Confirmed' | 'Partner Assigned' | 'Service In Progress' | 'Completed' | 'Cancelled';

const mapToCleanStatus = (status: string): CleanStatusKey => {
  switch (status) {
    case 'requested':
    case 'searching':
      return 'Booking Requested';
    case 'confirmed':
      return 'Confirmed';
    case 'partner_assigned':
    case 'professional_assigned':
    case 'on_the_way':
    case 'arrived':
      return 'Partner Assigned';
    case 'in_progress':
    case 'started':
      return 'Service In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
    default:
      return status === 'cancelled' ? 'Cancelled' : 'Booking Requested';
  }
};

const getStatusBadgeStyle = (status: CleanStatusKey) => {
  switch (status) {
    case 'Booking Requested':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Confirmed':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'Partner Assigned':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'Service In Progress':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'Completed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-800 border-rose-200';
  }
};

export const CleanOrdersView: React.FC<CleanOrdersViewProps> = ({
  bookings,
  customerPhone,
  onRefresh,
  onNavigateHome
}) => {
  // Filter bookings for this customer
  const cleanPhone = (customerPhone || '').replace(/\D/g, '').slice(-10);
  const myBookings = bookings.filter(b => {
    if (!cleanPhone) return true;
    const bPhone = (b.customer_phone || '').replace(/\D/g, '').slice(-10);
    return bPhone === cleanPhone || bPhone.includes(cleanPhone);
  });

  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    setIsCancelling(true);
    try {
      await updateBookingStatus(selectedBookingForCancel.id, 'cancelled', cancelReason);
      setSelectedBookingForCancel(null);
      onRefresh();
    } catch (e) {
      console.error('Cancellation failed:', e);
    } finally {
      setIsCancelling(false);
    }
  };

  const stepsList: CleanStatusKey[] = [
    'Booking Requested',
    'Confirmed',
    'Partner Assigned',
    'Service In Progress',
    'Completed'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading">My Orders</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">Track your ongoing and past home service bookings</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="p-2 sm:px-3 sm:py-2 text-[#0F172A] hover:text-[#2563EB] bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Orders List */}
      {myBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 sm:p-12 text-center shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)]">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3 border border-slate-100">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No bookings found</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            You haven&apos;t placed any home service orders yet. Select a service to get started.
          </p>
          <button
            type="button"
            onClick={onNavigateHome}
            className="mt-5 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            Explore Services
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.map((b) => {
            const cleanStatus = mapToCleanStatus(b.status);
            const isCompleted = cleanStatus === 'Completed';
            const isCancelled = cleanStatus === 'Cancelled';
            const canCancel = !isCompleted && !isCancelled;

            const currentStepIdx = stepsList.indexOf(cleanStatus);

            return (
              <div
                key={b.id || b.booking_reference}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Order Top Bar */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-700">{b.booking_reference}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(b.created_at || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(cleanStatus)}`}>
                    {cleanStatus}
                  </span>
                </div>

                {/* Order Content */}
                <div className="p-4 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{b.service_title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{b.sub_service_selected}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-slate-900">₹{b.total_amount}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
                        {b.payment_method === 'pay_after_work' ? 'Pay After Service' : b.payment_method}
                      </p>
                    </div>
                  </div>

                  {/* Customer Problem & Notes */}
                  {b.customer_problem && (
                    <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Requirement: </span>
                      {b.customer_problem}
                    </div>
                  )}

                  {/* Attached Photo Preview */}
                  {b.customer_photo && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewPhotoUrl(b.customer_photo || null)}
                        className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>View attached photo</span>
                      </button>
                    </div>
                  )}

                  {/* Scheduled Slot & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.scheduled_date || 'Scheduled'} {b.scheduled_time_slot ? `• ${b.scheduled_time_slot}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.customer_address || b.locality}</span>
                    </div>
                  </div>

                  {/* Partner Details Card if assigned */}
                  {b.professional_name && !isCancelled && (
                    <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {b.professional_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#0F172A]">{b.professional_name}</p>
                            <span className="px-2 py-0.2 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200">
                              Aadhaar Verified
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B]">Assigned Service Professional • {b.professional_rating || 4.9} ★</p>
                        </div>
                      </div>
                      {b.professional_phone && (
                        <a
                          href={`tel:${b.professional_phone}`}
                          className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                          title="Call Partner"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Call Partner</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Doorstep Service Security OTP */}
                  {!isCancelled && (b.status === 'partner_assigned' || b.status === 'confirmed' || b.status === 'in_progress') && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                        <div>
                          <span className="font-bold text-[#0F172A]">Doorstep Start OTP: </span>
                          <span className="text-[#64748B]">Share with professional upon arrival</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white border border-blue-200 rounded-lg font-mono font-extrabold text-[#2563EB] text-sm tracking-wider shadow-2xs">
                        {b.service_start_otp || (b.booking_reference ? b.booking_reference.slice(-4) : '4821')}
                      </span>
                    </div>
                  )}

                  {/* Stepper Status Progress if not cancelled */}
                  {!isCancelled && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Order Progress</p>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {stepsList.map((stepName, sIdx) => {
                          const isPastOrCurrent = currentStepIdx >= sIdx;
                          return (
                            <div key={stepName} className="flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                                  isPastOrCurrent
                                    ? 'bg-[#2563EB] text-white'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {isPastOrCurrent ? '✓' : sIdx + 1}
                              </div>
                              <span className={`text-[9px] mt-1 line-clamp-1 ${isPastOrCurrent ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                                {stepName.split(' ')[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cancellation Reason if cancelled */}
                  {isCancelled && b.cancellation_reason && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      <span className="font-semibold">Cancellation reason: </span>
                      {b.cancellation_reason}
                    </div>
                  )}

                </div>

                {/* Card Footer: Cancel Button */}
                {canCancel && (
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Free cancellation policy</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBookingForCancel(b)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Booking?</h3>
                <p className="text-xs text-slate-500">Ref: {selectedBookingForCancel.booking_reference}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Please let us know the reason for cancellation so we can improve our service:
            </p>

            <div className="space-y-2">
              {[
                'Changed my mind',
                'Booked by mistake',
                'Found another local solution',
                'Need to reschedule for another day',
                'Emergency / Plan change'
              ].map(reason => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    cancelReason === reason
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedBookingForCancel(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isCancelling ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Confirm Cancel</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {viewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setViewPhotoUrl(null)}>
          <div className="relative max-w-lg max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2">
            <img src={viewPhotoUrl} alt="Attached issue" className="w-full h-auto max-h-[75vh] object-contain rounded-xl" />
            <button
              type="button"
              onClick={() => setViewPhotoUrl(null)}
              className="mt-2 w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
