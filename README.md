# QuickServe 🚀
> *"Help, right when you need it."*

**QuickServe** is a production-quality, premium on-demand service marketplace platform built for Indian metro cities. It connects customers with trusted, verified local professionals for home, personal, repair, and care services.

---

## 🏛️ System Architecture

```
QuickServe/
├── client/                     # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Universal module switcher & Hindi/English toggle
│   │   │   ├── CustomerWebsite.tsx    # 11-section marketing portal with trust framework
│   │   │   ├── CustomerApp.tsx        # Mobile app with NLP search & 6-step booking flow
│   │   │   ├── ProfessionalApp.tsx    # Partner dashboard with live jobs & instant UPI payouts
│   │   │   ├── ProfessionalRegister.tsx# 5-step registration wizard with Caretaker safety declaration
│   │   │   ├── AdminDashboard.tsx     # Command center, supply & demand matrix, verification desk
│   │   │   └── ArchitectureViewer.tsx # PostgreSQL 15-table schema & state machine explorer
│   │   ├── api.ts                     # Typed REST API client
│   │   └── types.ts                   # Domain entities & status enums
│   └── dist/                          # Production-optimized web bundle
│
├── server/                     # Node.js + Express REST API Server
│   ├── data/
│   │   └── store.js                   # In-memory store with Bengaluru locality seed data
│   ├── db/
│   │   └── schema.sql                 # 15-table 3NF PostgreSQL DDL schema with PostGIS support
│   └── server.js                      # Express API routes, smart search NLP, and static server
│
└── package.json                # Unified workspace scripts
```

---

## 🌟 6 Core Product Modules

1. **Customer Website**
   - Premium modern Indian startup landing page.
   - Showcases the **4 Launch MVP Services** (Plumber, Electrician, Maid / Home Helper, Caretaker).
   - Trust and Safety framework with mandatory Caretaker non-medical policy.
   - Coverage of Bengaluru launch clusters (Indiranagar, Koramangala, HSR Layout, Whitefield, Jayanagar).

2. **Customer Mobile App**
   - Natural Language Smart Search (e.g. *"I need a plumber for leaking tap"* or *"clean my house"*).
   - 6-step instant booking flow:
     `Service Sub-Option -> Right Now / Schedule -> Address -> Verified Pro Selection -> Transparent Price Breakdown -> Confirm & OTP`.
   - Real-time Dispatch Telemetry view with simulated partner movement, ETA countdown, and 4-digit Service Start (`4821`) and Completion (`7392`) OTPs.
   - Post-service rating with separate dispute/problem reporting.

3. **Professional Partner Mobile App**
   - Daily earnings dashboard (Today's earnings, completed jobs, rating 4.8★).
   - Real-time incoming job radar with distance, locality, payout, and Accept/Decline timers.
   - Active job execution: Turn-by-turn navigation, Customer Start OTP validation, Completion OTP validation.
   - Earnings wallet with **Instant UPI Withdrawal** (to `rahul.plumb@oksbi` etc.).
   - Government ID verification dossier (Aadhaar, Police clearance, Trade skill test).

4. **Professional Registration Portal**
   - Dedicated partner landing page: *"Turn your skills into local opportunities."*
   - 5-step interactive onboarding wizard with phone OTP simulation.
   - Mandatory **Caretaker Non-Medical Safety Declaration** preventing misrepresentation of clinical nursing.

5. **Admin Web Command Center**
   - **Hyperlocal Supply & Demand Analytics**: Zone-by-zone matrix comparing active customer demand vs vetted professional supply with auto-generated ground recommendations (e.g. *"Recruit 3 more plumbers in Indiranagar"*).
   - **Ground Field Onboarding Desk**: Used by ground activation teams to register offline technicians on the spot and generate an instant SMS onboarding link.
   - **Service Catalog Engine**: Dynamically toggle categories between Active (Live) and Inactive (Coming Soon) without touching code.
   - **KYC Verification Desk**: Review Aadhaar, trade tests, approve, reject, or request action with custom compliance notes.
   - **Dispatch & Dispute Desk**: Live tabular order state transitions and refund approvals.

6. **Architecture & PostgreSQL Specification**
   - Interactive database explorer detailing the 15 production relational tables, indexing strategy, foreign keys, and Indian metro expansion playbook.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Launch the Application
To start the unified server (serving both the REST API and the React Web Application):
```bash
npm start
```
The application will be live at:
👉 **`http://localhost:5000`**

### 2. Live API Health Check
```bash
curl http://localhost:5000/api/health
```

### 3. Natural Language Search API
```bash
curl "http://localhost:5000/api/search/smart?q=I+need+someone+to+clean+my+house"
```

---

## 🔒 Trust & Safety Policies
- **Caretaker Non-Medical Scope**: Caretakers provide companionship, mobility assistance, feeding, and basic personal hygiene. Registered medical treatment requires licensed hospital supervision.
- **Zero Hidden Charges**: Upfront itemized pricing (Base Service Fee + 10% Platform Assurance Fee).
- **Double OTP Verification**: Security OTP required before job starts and upon job completion.
