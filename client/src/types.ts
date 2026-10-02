// TypeScript definitions for QuickServe Platform

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other' | string;
  address_line?: string;
  locality?: string;
  flat?: string;
  area?: string;
  city?: string;
  landmark?: string;
  pincode?: string;
  is_default?: boolean;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  wallet_balance?: number;
  saved_addresses?: SavedAddress[];
  default_address_id?: string;
  gender?: 'male' | 'female' | 'other' | string;
  city?: string;
  whatsapp_updates?: boolean;
  notifications_enabled?: boolean;
  quickcoins?: number;
  membership_tier?: 'standard' | 'vip' | 'plus';
  dob?: string;
  gstin?: string;
  company_name?: string;
}

export interface SubService {
  id: string;
  name: string;
  price: number;
  duration?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  name_hi?: string;
  slug: string;
  icon: string;
  tagline: string;
  description: string;
  is_active: boolean;
  is_mvp_launch: boolean;
  display_order: number;
  starting_price: number;
  group?: string;
  non_medical_disclaimer?: string;
  sub_services: SubService[];
}

export interface ServiceZone {
  id: string;
  city: string;
  zone_name: string;
  locality: string;
  pincode: string;
  lat: number;
  lng: number;
  radius_km: number;
  is_launch_zone: boolean;
  is_active: boolean;
  demand_index: string;
  unmet_demand_category?: string;
}

export interface Professional {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  service_id: string;
  service_name: string;
  primary_zone_id: string;
  zone_name: string;
  experience_years: number;
  skills: string[];
  bio: string;
  verification_state: 'pending' | 'under_review' | 'verified' | 'action_required' | 'suspended';
  verifications: {
    aadhaar: boolean;
    police_clearance: boolean;
    skill_trade_test: boolean;
    emergency_contact_verified: boolean;
  };
  is_available: boolean;
  is_field_onboarded: boolean;
  field_onboarder_notes?: string;
  admin_action_reason?: string;
  admin_notes?: string;
  rating: number;
  completed_jobs_count: number;
  available_balance: number;
  today_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
  pending_payout: number;
  starting_from: number;
  upi_id: string;
  current_lat?: number;
  current_lng?: number;
  joined_date: string;
  non_medical_declaration?: boolean;
}

export type BookingStatus =
  | 'requested'
  | 'searching'
  | 'professional_assigned'
  | 'confirmed'
  | 'on_the_way'
  | 'arrived'
  | 'started'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export interface StackedChore {
  id: string;
  title: string;
  name?: string;
  title_hi?: string;
  price: number;
  duration_mins: number;
  image?: string;
  is_completed?: boolean;
  completed?: boolean;
}

export interface MicroHub {
  id: string;
  name: string;
  code?: string;
  locality: string;
  city: string;
  lat: number;
  lng: number;
  active_pros_count: number;
  dispatched_pros_count: number;
  available_pros_count: number;
  average_dispatch_seconds: number;
  staging_kits_count: number;
  camera_units_available?: number;
  active_pros?: number;
  inventory_kits?: number;
  bodycam_units?: number;
  avg_dispatch_mins?: number;
  status?: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_locality?: string;
  sub_service_id?: string;
  locality: string;
  zone_id: string;
  service_id: string;
  service_title: string;
  sub_service_selected: string;
  status: BookingStatus;
  booking_type: 'instant' | 'scheduled';
  booking_mode?: 'instant' | 'scheduled' | 'recurring';
  recurring_cadence?: 'daily' | 'weekdays' | 'alternate' | 'weekends';
  scheduled_at?: string | null;
  wallet_applied?: number;
  professional_id: string;
  professional_name: string;
  professional_phone: string;
  professional_rating: number;
  professional_avatar?: string;
  eta_minutes?: number;
  service_start_otp: string;
  service_completion_otp: string;
  base_charge: number;
  platform_fee: number;
  taxes: number;
  total_amount: number;
  professional_earning?: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_method: 'upi' | 'card' | 'cash' | 'pay_after_work' | 'wallet' | string;
  customer_notes?: string;
  created_at: string;
  completed_at?: string;
  cancellation_reason?: string;
  review_rating?: number;
  review_comment?: string;
  is_problem_reported?: boolean;
  // QuickServe mechanics
  stacked_chores?: StackedChore[];
  is_verified_recording?: boolean;
  recording_consent_given?: boolean;
  service_duration_mins?: number;
  service_started_at?: string;
  hub_id?: string;
  hub_name?: string;
}

export interface SupportTicket {
  id: string;
  ticket_reference: string;
  reporter_name: string;
  reporter_role: 'customer' | 'professional';
  reporter_phone: string;
  booking_reference: string;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_notes?: string;
  created_at: string;
}

export interface SupplyDemandItem {
  zone_id: string;
  city: string;
  zone_name: string;
  locality: string;
  is_launch_zone: boolean;
  demand_level: string;
  available_pros: number;
  category_breakdown: {
    plumber: number;
    electrician: number;
    maid: number;
    caretaker: number;
  };
  active_orders_count: number;
  recommendation: string;
}

export interface AdminStats {
  totalCustomers: number;
  activePros: number;
  pendingVerifications: number;
  todayBookingsCount: number;
  completedBookings: number;
  grossRevenue: number;
  platformCommission: number;
  openDisputes: number;
  activeEmergencies: number;
  launch_city: string;
}
