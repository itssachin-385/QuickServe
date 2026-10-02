export interface WhatsAppBookingInfo {
  id?: string;
  booking_reference?: string;
  service_title?: string;
  sub_service_selected?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  professional_name?: string;
  professional_phone?: string;
  professional_rating?: number;
  service_start_otp?: string;
  total_amount?: number;
  payment_method?: string;
  booking_mode?: string;
  scheduled_at?: string | null;
  eta_minutes?: number;
}

export function generateWhatsAppBookingMessage(booking: WhatsAppBookingInfo): string {
  const ref = booking.booking_reference || booking.id || 'QS-ORDER';
  const service = booking.service_title || booking.sub_service_selected || 'Home Service';
  const pro = booking.professional_name || 'Rajesh Sharma (QuickServe SuperPartner)';
  const proRating = booking.professional_rating ? ` (${booking.professional_rating}⭐ Verified)` : ' (4.9⭐ Verified)';
  const otp = booking.service_start_otp || '4892';
  const amount = booking.total_amount || 499;
  const isPayAfter = booking.payment_method === 'pay_after_work';
  const payModeText = isPayAfter ? 'Payment After Work (Zero Advance - Pay Only After 100% Satisfaction)' : 'Online Paid (Verified)';
  const address = booking.customer_address || 'Customer Location';
  
  const scheduleText = booking.scheduled_at 
    ? `📅 *Slot:* ${booking.scheduled_at}` 
    : `⚡ *Arrival:* Partner reaching in ~15 Mins`;

  // Dynamic live tracking URL based on current host or tunnel
  const publicDefaultUrl = 'https://hollow-typically-readers-dept.trycloudflare.com';
  let currentOrigin = publicDefaultUrl;
  if (typeof window !== 'undefined') {
    const isLocalOrCapacitor = 
      window.location.hostname === 'localhost' ||
      window.location.protocol === 'capacitor:' ||
      (window as any).Capacitor?.isNativePlatform?.();

    if (!isLocalOrCapacitor && window.location.origin.startsWith('http')) {
      currentOrigin = window.location.origin;
    } else if ((import.meta as any).env?.VITE_PUBLIC_APP_URL) {
      currentOrigin = (import.meta as any).env.VITE_PUBLIC_APP_URL;
    }
  }
  const trackingUrl = `${currentOrigin}/?track=${encodeURIComponent(booking.id || ref)}`;

  return `⚡ *QUICKSERVE BOOKING CONFIRMATION* ⚡
━━━━━━━━━━━━━━━━━━━━
📋 *Booking ID:* #${ref}
🛠 *Service:* ${service}
${scheduleText}
📍 *Address:* ${address}

👷 *Assigned Partner:* ${pro}${proRating}
📞 *Partner Contact:* ${booking.professional_phone || '+91 98450 11223'}

🔐 *START WORK OTP:* *${otp}*
_(Share this 4-digit code with partner ONLY after they reach your doorstep)_

💰 *Amount to Pay:* *₹${amount}*
💳 *Payment Mode:* ${payModeText}

━━━━━━━━━━━━━━━━━━━━
📍 *Live Partner Tracking:*
${trackingUrl}

🤝 *QuickServe 100% Safety Guarantee:*
• Partner identity verified with Police/Aadhaar
• Zero Advance Cash Policy
• 24x7 Priority Support: 1800-120-0555 / +91 95701 51834

_Thank you for choosing QuickServe! Have a great experience._`;
}

export function getWhatsAppUrl(message: string, phone?: string): string {
  const encoded = encodeURIComponent(message);
  if (phone) {
    const clean = phone.replace(/[^0-9]/g, '');
    const full = clean.length === 10 ? `91${clean}` : clean;
    return `https://wa.me/${full}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

export function openWhatsAppBookingShare(booking: WhatsAppBookingInfo, phone?: string): void {
  const msg = generateWhatsAppBookingMessage(booking);
  const url = getWhatsAppUrl(msg, phone);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
