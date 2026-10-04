# Dubai Monthly Cars

A production-ready monthly car rental platform for Dubai, UAE. Built with Next.js 16, Supabase, and Tailwind CSS. Features customer web app + admin panel in a single codebase.

## Overview

**Business Model**: Monthly vehicle subscriptions (1, 3, 6, 12 months) with tiered pricing (Basic, Plus, Premium), optional add-ons (insurance, extra mileage, GPS, child seat, roadside assistance), refundable security deposits, and recurring monthly billing.

**Target Market**: Dubai residents and expats seeking flexible, long-term vehicle rentals without daily rental hassles.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4 |
| **Backend** | Next.js API Routes + Server Actions (no separate backend) |
| **Database** | Supabase (PostgreSQL, Auth, Storage) - Production project |
| **Payments** | Stripe (cards, Apple Pay, Google Pay) + Tabby (BNPL) |
| **Auth** | Supabase Auth (Phone OTP, Email, Google OAuth) |
| **Hosting** | Vercel (free tier, cron jobs via `vercel.json`) |
| **i18n** | Custom EN/AR with RTL support (`src/lib/translations.ts`) |
| **PWA** | Web Manifest + Service Worker (installable on Android/iOS) |

## Features

### Customer Web App
- **Authentication**: Phone OTP, Email, Google OAuth
- **KYC Flow**: Emirates ID, Driving License, Passport upload with approval workflow
- **Vehicle Browsing**: Filters by category, brand, transmission, fuel type, seats, price, location
- **Booking Flow**: Tier selection → Duration → Delivery → Add-ons → Documents → Agreement → Payment
- **Payments**: Stripe Elements + Tabby, recurring monthly billing, deposit handling
- **Dashboard**: Active rentals, payment history, mileage tracking, trip history
- **Condition Reports**: Photo upload at pickup/return
- **Damage Reports**: Photo + description submission
- **Support**: Ticket system with chat-like messaging
- **Notifications**: In-app center for confirmations, reminders, alerts
- **Profile**: Personal details, documents, payment methods
- **Referral Program**: Invite friends for discounts
- **Reviews**: Post-rental ratings and reviews

### Admin Panel (Role-Based Access)
- **Dashboard**: Active rentals, fleet availability, revenue, pending KYC, overdue payments + charts
- **Fleet Management**: CRUD vehicles, pricing per tier, status tracking (available/rented/maintenance/OOS)
- **Maintenance Scheduling**: Mileage/date-based reminders
- **KYC Review**: Approve/reject documents, flag/blacklist customers
- **Booking Management**: Approve/modify/extend/terminate/swap vehicles
- **Finance**: Transactions, retry failed payments, refunds, deposits, invoices, VAT export, promo codes
- **Damage/Incident Management**: Review condition reports, charge repair costs against deposits
- **Staff Management**: Create accounts with roles (super_admin, admin, fleet_manager, finance, support, delivery, delivery_staff)
- **Marketing**: Push campaigns, customer segments, loyalty/renewal offers
- **Reports**: Fleet utilization, revenue per vehicle, ancillary revenue, retention, overdue payments

### Platform Features
- **EN/AR with RTL**: Full right-to-left layout support
- **Light/Dark Mode**: System preference + manual toggle
- **PWA**: Installable on Android/iOS with offline support
- **Cron Jobs**: Monthly billing, payment reminders (via `vercel.json`)
- **VAT Compliance**: UAE 5% VAT invoice generation and export

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (customer)/         # Customer-facing routes
│   ├── admin/              # Admin panel routes
│   ├── api/                # API routes (webhooks, cron, invoices)
│   └── layout.tsx          # Root layout with server-side RTL
├── components/             # React components
│   ├── layout/             # Header, Footer, Navigation
│   ├── shared/             # ThemeProvider, ServiceWorkerRegister
│   └── ui/                 # Reusable UI primitives
├── contexts/               # LanguageContext (i18n + RTL)
├── lib/
│   ├── payments/           # Stripe/Tabby webhook handlers
│   ├── supabase/           # Server & admin clients
│   ├── translations.ts     # EN/AR translation dictionaries
│   ├── getServerLang.ts    # Server-side language detection
│   └── rbac.ts             # Role-based access control
├── types/
│   └── database.ts         # Supabase generated types
└── middleware.ts           # Auth + locale routing
```

## Database Schema

Key tables (see `supabase/migrations/0000_base_schema.sql`):
- `profiles` - Users with roles (customer, admin, fleet_manager, finance, support, delivery, delivery_staff, super_admin)
- `vehicles`, `vehicle_images`, `vehicle_pricing` - Fleet management
- `pricing_tiers`, `add_ons` - Pricing configuration
- `bookings`, `booking_add_ons` - Rental subscriptions
- `documents` - KYC documents (Emirates ID, license, passport)
- `payments` - All transactions with idempotency protection
- `condition_reports`, `damage_reports` - Vehicle inspection
- `support_tickets`, `ticket_messages` - Customer support
- `invoices` - VAT-compliant invoices
- `notifications`, `reviews`, `referrals`, `activity_logs` - Engagement

## Getting Started

### Prerequisites
- Node.js 20+
- Supabase project (PostgreSQL, Auth, Storage)
- Stripe account (for payments)
- Tabby account (for BNPL, optional)
- Vercel account (for deployment)

### Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Tabby (optional)
TABBY_SECRET_KEY=...
TABBY_WEBHOOK_SECRET=...
TABBY_API_URL=https://api.tabby.ai

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Database Setup

```bash
# Link to Supabase project
supabase link --project-ref your-project-ref

# Push migrations (run in order)
supabase db push
# Or apply manually in Supabase SQL Editor:
# 1. 0000_base_schema.sql (fresh DB only)
# 2. 0001_mvp_additive.sql
# 3. 0005_rls_deduplication.sql
# 4. 0002_booking_concurrency.sql
# 5. 0003_storage_security.sql
# 6. 0004_payment_idempotency.sql
```

### Webhook Configuration

Configure in respective dashboards:
- **Stripe**: `https://your-domain.com/api/webhooks/stripe` → events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- **Tabby**: `https://your-domain.com/api/webhooks/tabby` → events: `payment.captured`

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy - cron jobs from `vercel.json` auto-configured

### Manual Deploy

```bash
npm run build
vercel --prod
```

## Migration Strategy

| File | Purpose | Safe for Production |
|------|---------|---------------------|
| `0000_base_schema.sql` | Complete schema from live DB | Fresh DB only |
| `0001_mvp_additive.sql` | Additive tables/columns/policies | ✅ Yes |
| `0005_rls_deduplication.sql` | Consolidate RLS, add missing policies | ✅ Yes (with backup) |
| `0002_booking_concurrency.sql` | Exclusion constraint for booking overlaps | ✅ Yes |
| `0003_storage_security.sql` | Storage bucket policies | ✅ Yes |
| `0004_payment_idempotency.sql` | Unique index on provider_payment_id | ✅ Yes |

**⚠️ Always take Supabase backup before applying migrations to production.**

## Known Placeholders (Replace Before Launch)

| Item | Current Value | Action |
|------|---------------|--------|
| Support Phone (display) | `800-XXXX (24/7)` | Add real toll-free number |
| Support Phone (href) | `tel:+971800XXXX` | Add real number |
| Footer Phone | `+971 4 000 0000` | Add real landline |
| Company Email | `hello@dubaimonthlycars.ae` | Verify/configure |
| Social Links | Instagram/Twitter/LinkedIn placeholders | Add real URLs |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## License

Private - All rights reserved. Dubai Monthly Cars.

---

**Made in UAE** 🇦🇪