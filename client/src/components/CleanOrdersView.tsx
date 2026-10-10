import React, { useState } from 'react';
import { Booking } from '../types';
import { updateBookingStatus } from '../api';
import { playDoorbellChime, playSuccessPing } from '../utils/sound';
import { 
  Calendar, Clock, MapPin, Phone, User, 
  CheckCircle2, XCircle, AlertCircle, Ban, 
  ChevronRight, RefreshCw, FileText, Image as ImageIcon, 
  ShieldCheck, Star, MessageCircle, Download, Printer, 
  X, Sparkles, Volume2, Check
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

  // Feature 1: Rating & Review Modal State
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedReviewTags, setSelectedReviewTags] = useState<string[]>(['On Time', 'Clean Work']);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Feature 3: Official Invoice / Bill Modal State
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);

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

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview) return;
    setIsSubmittingReview(true);
    try {
      const fullComment = [
        reviewComment.trim(),
        selectedReviewTags.length > 0 ? `(${selectedReviewTags.join(', ')})` : ''
      ].filter(Boolean).join(' ');

      const res = await fetch(`/api/bookings/${selectedBookingForReview.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: ratingStars,
          comment: fullComment
        })
      });

      if (res.ok) {
        playSuccessPing();
        setSelectedBookingForReview(null);
        setReviewComment('');
        onRefresh();
      }
    } catch (e) {
      console.error('Review submission failed:', e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const stepsList: CleanStatusKey[] = [
    'Booking Requested',
    'Confirmed',
    'Partner Assigned',
    'Service In Progress',
    'Completed'
  ];

  const quickReviewTags = ['On Time', 'Polite', 'Clean Work', 'Reasonable Price', 'Expert Fix', 'Will Book Again'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-heading">My Orders</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">Track your ongoing and past home service bookings</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sound Test Button */}
          <button
            type="button"
            onClick={() => playDoorbellChime()}
            className="p-2 sm:px-3 sm:py-2 text-slate-700 hover:text-blue-600 bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Test Doorstep Chime Sound"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Doorbell Sound</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 sm:px-3 sm:py-2 text-[#0F172A] hover:text-[#2563EB] bg-white border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
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

            // Clean clean phone numbers for WhatsApp
            const partnerPhoneRaw = (b.professional_phone || '').replace(/\D/g, '').slice(-10);

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

                  {/* Partner Details Card if assigned + Feature 2: 1-Click WhatsApp Connect */}
                  {b.professional_name && !isCancelled && (
                    <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* 1-Click Direct WhatsApp Connect */}
                        {partnerPhoneRaw && (
                          <a
                            href={`https://wa.me/91${partnerPhoneRaw}?text=${encodeURIComponent(`Hi ${b.professional_name}, I am reaching out regarding my QuickServe order #${b.booking_reference} for ${b.service_title}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                            title="Chat with partner on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {/* Call Partner Button */}
                        {b.professional_phone && (
                          <a
                            href={`tel:${b.professional_phone}`}
                            className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                            title="Call Partner"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Call</span>
                          </a>
                        )}
                      </div>
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

                  {/* Review Banner for Completed Booking (Feature 1) */}
                  {isCompleted && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {b.review_rating ? (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${star <= (b.review_rating || 5) ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-slate-900">{b.review_rating}.0 ★</span>
                          {b.review_comment && (
                            <span className="text-slate-600 italic line-clamp-1">"{b.review_comment}"</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-semibold text-slate-800">How was your service experience?</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Download Bill Button (Feature 3) */}
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForInvoice(b)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Download Bill</span>
                        </button>

                        {!b.review_rating && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingForReview(b);
                              setRatingStars(5);
                              setReviewComment('');
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors shadow-2xs"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>Rate Service</span>
                          </button>
                        )}
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

      {/* Feature 1: Rating & Review Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rate Service Quality</h3>
                <p className="text-xs text-slate-500">{selectedBookingForReview.service_title} • Partner: {selectedBookingForReview.professional_name || 'Professional'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= ratingStars ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs font-bold text-amber-700">
              {ratingStars === 5 ? 'Excellent 🌟🌟🌟🌟🌟' : ratingStars === 4 ? 'Very Good 👍' : ratingStars === 3 ? 'Good 🙂' : 'Needs Improvement'}
            </p>

            {/* Quick Review Feedback Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">What went well?</label>
              <div className="flex flex-wrap gap-1.5">
                {quickReviewTags.map((tag) => {
                  const isSelected = selectedReviewTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedReviewTags(selectedReviewTags.filter(t => t !== tag));
                        } else {
                          setSelectedReviewTags([...selectedReviewTags, tag]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tag} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Comment (Optional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with the service professional..."
                className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedBookingForReview(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmittingReview ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Submit Rating</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 3: Official Printable Service Invoice / Bill Modal */}
      {selectedBookingForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs print:p-0 print:bg-white">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none">
            
            {/* Invoice Header Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">Official Service Bill / Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForInvoice(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Paper Content */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible">
              
              {/* Brand Letterhead */}
              <div className="flex items-start justify-between border-b pb-4 border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">
                    Quick<span className="text-blue-600">Serve</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">QuickServe Technologies Private Limited</p>
                  <p className="text-[11px] text-slate-500">Greater Noida & NCR Service Cluster Hub</p>
                  <p className="text-[11px] text-slate-500 font-mono">GSTIN / Reg: 09AAACQ1234F1Z8</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                    PAID RECEIPT ✓
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                    INV-{selectedBookingForInvoice.booking_reference}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Date: {new Date(selectedBookingForInvoice.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Customer & Professional Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">Billed To (Customer):</p>
                  <p className="font-bold text-slate-900 mt-1">{selectedBookingForInvoice.customer_name}</p>
                  <p className="text-slate-600">{selectedBookingForInvoice.customer_phone}</p>
                  <p className="text-slate-500 mt-0.5">{selectedBookingForInvoice.customer_address || selectedBookingForInvoice.locality}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-slate-500">Fulfilled By (Partner):</p>
                  <p className="font-bold text-slate-900 mt-1">{selectedBookingForInvoice.professional_name || 'QuickServe Certified Pro'}</p>
                  <p className="text-slate-600">Phone: {selectedBookingForInvoice.professional_phone || 'Verified'}</p>
                  <p className="text-emerald-700 font-medium text-[11px]">✓ 100% Aadhaar & Police Verified</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                    <tr>
                      <th className="p-3">Service Description</th>
                      <th className="p-3 text-center">Type</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{selectedBookingForInvoice.service_title}</span>
                        <p className="text-[11px] text-slate-500">{selectedBookingForInvoice.sub_service_selected}</p>
                      </td>
                      <td className="p-3 text-center text-slate-600">Doorstep Work</td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        ₹{selectedBookingForInvoice.base_charge || (selectedBookingForInvoice.total_amount - 29)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3">
                        <span className="font-medium text-slate-800">QuickServe Safety & Platform Fee</span>
                        <p className="text-[11px] text-slate-500">Doorstep protection & background insurance</p>
                      </td>
                      <td className="p-3 text-center text-slate-600">Platform</td>
                      <td className="p-3 text-right font-semibold text-slate-900">
                        ₹{selectedBookingForInvoice.platform_fee || 29}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="p-3 text-right text-slate-700">Total Billed Amount:</td>
                      <td className="p-3 text-right text-base text-blue-600">₹{selectedBookingForInvoice.total_amount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Summary */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-950">Payment Method: </span>
                  <span className="capitalize text-emerald-800 font-semibold">{selectedBookingForInvoice.payment_method.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-900">Status: FULLY SETTLED ✓</span>
                </div>
              </div>

              {/* Footer Terms */}
              <div className="text-[10px] text-slate-400 text-center space-y-1 pt-2 border-t border-slate-100">
                <p>Thank you for choosing QuickServe. This is an electronically generated service receipt requiring no physical signature.</p>
                <p>Support Helpline: +91 95701 51834 • Email: support@quickserve.in • Greater Noida & NCR</p>
              </div>

            </div>

          </div>
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
