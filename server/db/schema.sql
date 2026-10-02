-- ============================================================================
-- QUICKSERVE DATABASE SCHEMA (PostgreSQL DDL)
-- "Help, right when you need it."
-- Designed for scalable on-demand service marketplace expansion across Indian metros
-- ============================================================================

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographic locality radius calculations

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'professional', 'admin', 'field_agent');
    CREATE TYPE verification_state AS ENUM ('pending', 'under_review', 'verified', 'action_required', 'suspended');
    CREATE TYPE booking_status_enum AS ENUM (
        'requested', 'searching', 'professional_assigned', 'confirmed', 
        'on_the_way', 'started', 'completed', 'cancelled', 'disputed', 'refunded'
    );
    CREATE TYPE payment_method_enum AS ENUM ('upi', 'card', 'netbanking', 'wallet', 'cash');
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded');
    CREATE TYPE ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'emergency');
    CREATE TYPE ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    language_preference VARCHAR(10) DEFAULT 'en', -- 'en' or 'hi'
    is_phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SERVICE CATEGORIES (Admin toggleable for phased expansion)
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(60) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE, -- MVP launch sets only 4 to true!
    is_mvp_launch BOOLEAN DEFAULT FALSE, -- 4 MVP launch categories
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SERVICES & PRICING RULES
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    title_hi VARCHAR(150),
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 299.00,
    platform_fee_percent NUMERIC(5, 2) DEFAULT 10.00,
    estimated_duration_minutes INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    sub_service_options JSONB DEFAULT '[]'::jsonb, -- e.g. ["Tap repair", "Pipe leakage", "Flush tank"]
    emergency_eligible BOOLEAN DEFAULT FALSE,
    non_medical_care_disclaimer BOOLEAN DEFAULT FALSE, -- Mandatory distinction for Caretaker services
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SERVICE ZONES & LOCALITIES (Locality-by-locality launch strategy)
CREATE TABLE IF NOT EXISTS service_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city VARCHAR(80) NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    locality VARCHAR(120) NOT NULL,
    pincode VARCHAR(10),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    radius_km NUMERIC(5, 2) DEFAULT 7.5,
    is_launch_zone BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PROFESSIONALS & SERVICE PROVIDER PROFILES
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    category_ids UUID[] DEFAULT '{}',
    primary_zone_id UUID REFERENCES service_zones(id),
    operating_zones UUID[] DEFAULT '{}',
    working_radius_km NUMERIC(5, 2) DEFAULT 8.0,
    experience_years INT NOT NULL DEFAULT 1,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    preferred_language VARCHAR(20) DEFAULT 'hi',
    verification_state verification_state DEFAULT 'pending',
    is_available BOOLEAN DEFAULT FALSE,
    is_field_onboarded BOOLEAN DEFAULT FALSE,
    field_onboarder_notes TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    total_reviews_count INT DEFAULT 0,
    completed_jobs_count INT DEFAULT 0,
    cancelled_jobs_count INT DEFAULT 0,
    available_balance NUMERIC(10, 2) DEFAULT 0.00,
    pending_payout NUMERIC(10, 2) DEFAULT 0.00,
    total_lifetime_earnings NUMERIC(12, 2) DEFAULT 0.00,
    upi_id VARCHAR(100),
    emergency_available BOOLEAN DEFAULT FALSE,
    non_medical_care_declaration BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PROFESSIONAL VERIFICATION & KYC (Identity, Skills, Background)
CREATE TABLE IF NOT EXISTS professional_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    aadhaar_verified BOOLEAN DEFAULT FALSE,
    aadhaar_masked_number VARCHAR(20),
    pan_verified BOOLEAN DEFAULT FALSE,
    pan_masked_number VARCHAR(20),
    skill_certification_verified BOOLEAN DEFAULT FALSE,
    police_clearance_verified BOOLEAN DEFAULT FALSE,
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(15),
    training_qualification_details TEXT,
    admin_verification_notes TEXT,
    verified_by_user_id UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CUSTOMER SAVED ADDRESSES
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_label VARCHAR(50) DEFAULT 'Home', -- 'Home', 'Office', 'Other'
    house_flat_no VARCHAR(100) NOT NULL,
    street_area VARCHAR(200) NOT NULL,
    landmark VARCHAR(150),
    locality VARCHAR(100) NOT NULL,
    city VARCHAR(80) NOT NULL,
    pincode VARCHAR(10),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. BOOKINGS (Core Order Lifecycle)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL, -- e.g. QS-BLR-8492
    customer_id UUID NOT NULL REFERENCES users(id),
    professional_id UUID REFERENCES professionals(id),
    service_id UUID NOT NULL REFERENCES services(id),
    zone_id UUID REFERENCES service_zones(id),
    status booking_status_enum NOT NULL DEFAULT 'requested',
    booking_type VARCHAR(20) DEFAULT 'instant', -- 'instant' or 'scheduled'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    address_snapshot JSONB NOT NULL,
    sub_service_selected VARCHAR(120),
    customer_notes TEXT,
    service_start_otp VARCHAR(6) NOT NULL,
    service_completion_otp VARCHAR(6) NOT NULL,
    
    -- Financials breakdown (Transparent pricing rule)
    base_charge NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL,
    taxes NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    emergency_surcharge NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    professional_earning NUMERIC(10, 2) NOT NULL,
    
    payment_status payment_status_enum DEFAULT 'pending',
    payment_method payment_method_enum DEFAULT 'upi',
    
    -- Live dispatch telemetry
    professional_current_lat NUMERIC(10, 7),
    professional_current_lng NUMERIC(10, 7),
    eta_minutes INT,
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. PAYMENTS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    gateway_name VARCHAR(50) DEFAULT 'Razorpay',
    transaction_reference VARCHAR(120) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    method payment_method_enum NOT NULL,
    status payment_status_enum NOT NULL,
    gateway_response JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. PROFESSIONAL PAYOUTS
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id),
    amount NUMERIC(10, 2) NOT NULL,
    payout_method VARCHAR(30) DEFAULT 'instant_upi',
    upi_id VARCHAR(100),
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'paid', -- 'processing', 'paid', 'failed'
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. REVIEWS & RATINGS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    professional_id UUID NOT NULL REFERENCES professionals(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_tags TEXT[] DEFAULT '{}',
    review_text TEXT,
    is_problem_reported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. SUPPORT TICKETS & DISPUTES
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_reference VARCHAR(30) UNIQUE NOT NULL,
    reporter_user_id UUID NOT NULL REFERENCES users(id),
    reporter_role user_role NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    category VARCHAR(60) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ticket_priority_enum DEFAULT 'medium',
    status ticket_status_enum DEFAULT 'open',
    resolution_notes TEXT,
    resolved_by_admin_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 14. SUPPLY & DEMAND SNAPSHOTS (Real platform telemetry)
CREATE TABLE IF NOT EXISTS supply_demand_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES service_zones(id),
    category_id UUID NOT NULL REFERENCES service_categories(id),
    demand_level VARCHAR(20) NOT NULL, -- 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'
    active_requests_count INT DEFAULT 0,
    available_pros_count INT DEFAULT 0,
    unfulfilled_requests_count INT DEFAULT 0,
    action_recommendation TEXT,
    snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. AUDIT LOGS (Compliance & Security)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id),
    action_type VARCHAR(80) NOT NULL,
    target_entity VARCHAR(80) NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDICES FOR HIGH PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_pros_service ON professionals(service_id);
CREATE INDEX IF NOT EXISTS idx_pros_zone ON professionals(primary_zone_id);
CREATE INDEX IF NOT EXISTS idx_pros_verification ON professionals(verification_state);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pro ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_support_booking ON support_tickets(booking_id);
