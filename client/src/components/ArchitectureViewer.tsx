import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  Layers, 
  ShieldCheck, 
  Code, 
  GitBranch, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'database' | 'state_machine' | 'api' | 'scaling'>('database');
  const [copied, setCopied] = useState(false);

  const tables = [
    {
      name: 'users',
      purpose: 'Core identity record for customers, professionals, admins & ground agents with phone OTP auth and language preference.',
      fields: ['id UUID PK', 'phone_number VARCHAR(15) UNIQUE', 'full_name VARCHAR(120)', 'email VARCHAR(255)', 'role user_role', 'language_preference', 'is_phone_verified']
    },
    {
      name: 'service_categories',
      purpose: 'Enforces the MVP strategy: allows admin to toggle is_active without code modifications.',
      fields: ['id UUID PK', 'name VARCHAR(100)', 'slug VARCHAR(100) UNIQUE', 'icon VARCHAR(60)', 'is_active BOOLEAN (MVP: 4 True)', 'display_order INT', 'starting_price NUMERIC']
    },
    {
      name: 'services',
      purpose: 'Granular sub-service tasks with dynamic pricing rules and mandatory caretaker non-medical safety flag.',
      fields: ['id UUID PK', 'category_id UUID FK', 'title VARCHAR(150)', 'base_price NUMERIC', 'platform_fee_percent NUMERIC', 'non_medical_care_disclaimer BOOLEAN']
    },
    {
      name: 'service_zones',
      purpose: 'Locality-by-locality launch boundary (Bengaluru Indiranagar, Koramangala, HSR Layout, etc.).',
      fields: ['id UUID PK', 'city VARCHAR(80)', 'zone_name VARCHAR(100)', 'locality VARCHAR(120)', 'latitude NUMERIC', 'longitude NUMERIC', 'radius_km NUMERIC', 'is_launch_zone BOOLEAN']
    },
    {
      name: 'professionals',
      purpose: 'Service provider dossier: verification state, trade skills, ratings, earnings balance, and availability.',
      fields: ['id UUID PK', 'user_id UUID FK', 'service_id UUID FK', 'primary_zone_id UUID FK', 'verification_state ENUM', 'experience_years INT', 'rating NUMERIC', 'available_balance NUMERIC', 'upi_id VARCHAR']
    },
    {
      name: 'professional_verifications',
      purpose: 'Compliance KYC table: Aadhaar hash, police verification certificate, skill trade test results, and admin notes.',
      fields: ['id UUID PK', 'professional_id UUID FK', 'aadhaar_verified BOOLEAN', 'police_clearance_verified BOOLEAN', 'skill_certification_verified BOOLEAN', 'admin_verification_notes TEXT']
    },
    {
      name: 'bookings',
      purpose: 'Core order lifecycle with transparent financial split (base + 10% platform fee), dual OTPs, and dispatch telemetry.',
      fields: ['id UUID PK', 'booking_reference VARCHAR(20) UNIQUE', 'customer_id UUID FK', 'professional_id UUID FK', 'status booking_status_enum', 'service_start_otp VARCHAR(6)', 'service_completion_otp VARCHAR(6)', 'base_charge NUMERIC', 'platform_fee NUMERIC', 'total_amount NUMERIC']
    },
    {
      name: 'payments',
      purpose: 'Transaction audit log: Razorpay gateway responses, UPI transaction references, and fee breakdowns.',
      fields: ['id UUID PK', 'booking_id UUID FK', 'transaction_reference VARCHAR', 'amount NUMERIC', 'method ENUM', 'status ENUM', 'paid_at TIMESTAMP']
    },
    {
      name: 'payouts',
      purpose: 'Instant UPI payout records to professional partner bank accounts.',
      fields: ['id UUID PK', 'professional_id UUID FK', 'amount NUMERIC', 'payout_method VARCHAR', 'upi_id VARCHAR', 'status VARCHAR']
    },
    {
      name: 'support_tickets',
      purpose: 'Disputes, grievances, and emergency safety escalations for both customers and professionals.',
      fields: ['id UUID PK', 'ticket_reference VARCHAR', 'reporter_user_id UUID FK', 'reporter_role ENUM', 'booking_id UUID FK', 'priority ENUM', 'status ENUM', 'resolution_notes TEXT']
    }
  ];

  const copySqlSchema = () => {
    navigator.clipboard.writeText(`-- View server/db/schema.sql for the complete 15-table DDL script.`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold mb-2 border border-brand-500/20">
              <Cpu className="w-3.5 h-3.5" />
              <span>Production Architecture Specification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Scalable Tech Stack & PostgreSQL Data Models
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Built according to Sections 36, 37, 38 & 39 of the QuickServe Master Blueprint.
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'database' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              PostgreSQL Schema (15 Tables)
            </button>
            <button
              onClick={() => setActiveTab('state_machine')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'state_machine' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Booking State Machine
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'api' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              REST API Endpoints
            </button>
            <button
              onClick={() => setActiveTab('scaling')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'scaling' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Indian Metro Expansion
            </button>
          </div>
        </div>

        {/* TAB 1: DATABASE SCHEMA EXPLORER */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-400" />
                  <span>Relational Schema (Normalized 3NF)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Located at <code className="text-brand-300 font-mono">server/db/schema.sql</code> with indices, foreign keys, and ENUM types.
                </p>
              </div>

              <button
                onClick={copySqlSchema}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Reference' : 'Copy DDL Reference'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map(t => (
                <div key={t.name} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-mono font-bold text-brand-400 text-sm">public.{t.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">PostgreSQL</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{t.purpose}</p>
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Key Fields:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.fields.map((f, idx) => (
                        <span key={idx} className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BOOKING STATE MACHINE (Section 39) */}
        {activeTab === 'state_machine' && (
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Order State Progression</h3>
              <p className="text-xs text-slate-400">
                Guarantees zero ambiguity for customers, partners, and admin dispatchers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {[
                { step: '1. REQUESTED', desc: 'Customer selects service, address & time.' },
                { step: '2. SEARCHING', desc: 'Geo-radius query finds available verified pros in cluster.' },
                { step: '3. ASSIGNED', desc: 'Partner notified via audible push alert (Accept/Decline timer).' },
                { step: '4. CONFIRMED', desc: 'Job locked. Transparent price breakdown shown.' },
                { step: '5. ON THE WAY', desc: 'Live map tracking with ETA (~8-15 mins in cluster).' },
                { step: '6. STARTED', desc: 'Unlocked only upon entry of Customer 4-digit Start OTP.' },
                { step: '7. COMPLETED', desc: 'Unlocked upon entry of Customer Completion OTP.' },
                { step: '8. PAID & RATED', desc: 'Direct UPI split (90% to Pro, 10% platform fee).' },
                { step: '9. DISPUTED', desc: 'Optional customer problem report triggers Admin ticket.' },
                { step: '10. REFUNDED', desc: 'Instant gateway reversal if pro cancels or fails check.' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-mono font-bold text-brand-400 text-xs">{item.step}</span>
                  <p className="text-slate-400 text-[11px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: REST API ENDPOINTS */}
        {activeTab === 'api' && (
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 text-xs font-mono">
            <h3 className="font-bold text-white text-sm font-sans">Live Express REST Endpoints</h3>
            <div className="space-y-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold mr-2">GET</span>
                  <span className="text-slate-200">/api/search/smart?q=I+need+a+plumber</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">NLP intent & category matching</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold mr-2">GET</span>
                  <span className="text-slate-200">/api/categories (filtered by is_active for MVP)</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">Enforces 4 launch services</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold mr-2">POST</span>
                  <span className="text-slate-200">/api/admin/categories/:id/toggle</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">Dynamic expansion trigger</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold mr-2">POST</span>
                  <span className="text-slate-200">/api/bookings/:id/verify-start-otp</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">Customer OTP security check</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold mr-2">GET</span>
                  <span className="text-slate-200">/api/admin/supply-demand</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">Real-time telemetry & matrix</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold mr-2">POST</span>
                  <span className="text-slate-200">/api/admin/field-onboard</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans">Ground offline-to-online activation</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: METRO EXPANSION PLAYBOOK */}
        {activeTab === 'scaling' && (
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-white text-base">QuickServe Controlled Expansion Playbook</h3>
            <p className="text-slate-300 leading-relaxed">
              How QuickServe expands locality-by-locality across Bengaluru, Delhi NCR, and Mumbai without risking service quality or overwhelming the consumer:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-brand-400 font-bold text-xs uppercase block">Phase 1: Hyperlocal Supply</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Field activation teams onboard 15-20 verified plumbers, electricians, maids, and caretakers within a 5km radius (e.g. Indiranagar). In-person trade & background checks are performed.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-emerald-400 font-bold text-xs uppercase block">Phase 2: Customer Bookings</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Open booking gates for the 4 core launch categories. Monitor supply-demand matrix. Keep ETA under 25 minutes. All other 20+ services stay marked "Coming Soon".
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-teal-400 font-bold text-xs uppercase block">Phase 3: Category Expansion</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  As trust and order frequency build, admin toggles "Active" on AC repair, painting, deep cleaning, or moving services without requiring code redeployments or app store updates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
