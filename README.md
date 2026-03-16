# YOH Cuts Studio — Full Local-Service Revenue Stack

## Brand
**Business name:** YOH Cuts Studio  
**Owner:** Yohannes

Logo direction:
- Wordmark: `YOH CUTS` (bold geometric sans)
- Subline: `STUDIO`
- Optional icon: razor-integrated `Y` monogram
- Colors: Charcoal `#111214`, Gold `#CBA35C`, Off-white `#F4F4F5`

---

## What’s implemented (end-to-end)

### 1) Architecture
- **Next.js + React + TypeScript + Tailwind** frontend
- **Supabase Postgres** backend
- **Server-side booking validation** in Next API routes
- **Owner admin dashboard**
- **SEO metadata + schema.org LocalBusiness**
- **Vercel-ready deployment**

### 2) MVP scope delivered
- Conversion homepage
- Service menu
- Booking form with live slot availability
- Conflict prevention + blocked-time checks
- Booking success flow
- Admin appointment management
- Local SEO + mobile-first UX

### 3) Data model delivered
- `barbers`
- `services`
- `appointments`
- `business_settings`
- `availability_rules`
- `blocked_times`
- `testimonials`
- `message_logs` (for reminder/review/rebook dedupe)

### 4) Routes
- `/` homepage
- `/book` booking
- `/booking/success` confirmation + deposit CTA
- `/admin` owner dashboard
- `/api/appointments` GET/POST
- `/api/admin/block` POST
- `/api/admin/appointments/[id]/status` PATCH
- `/api/stripe/checkout` POST
- `/api/jobs/reminders` POST
- `/api/jobs/review-requests` POST
- `/api/jobs/rebook-prompts` POST

---

## Production features now included

## Get bookings
- Strong homepage CTA hierarchy
- Service cards with clear duration + pricing
- Fast mobile booking funnel
- Slot picker with availability filtering

## Reduce no-shows
- Confirmation email hook (Resend optional)
- Confirmation SMS hook (Twilio optional)
- 24h reminder job endpoint
- Block-time support for schedule control

## Build trust
- Testimonials
- About section
- Gallery
- FAQ + cancellation policy
- Consistent NAP (name/address/phone)

## Improve local discoverability
- Metadata + OpenGraph
- JSON-LD `Barbershop`
- Localized copy + contact consistency

## Increase repeat visits
- Review request job endpoint
- Rebook prompt job endpoint (21-day cadence)
- Message dedupe via `message_logs`

---

## Booking logic (server-side authoritative)
`app/api/appointments/route.ts`
- Loads service duration from DB
- Computes candidate end time
- Rejects if overlaps appointments
- Rejects if overlaps blocked times
- Rejects past bookings
- Writes confirmed appointment
- Triggers optional confirmation email/SMS
- Returns deposit requirements for checkout path

---

## Admin capabilities
`/admin`
- View upcoming appointments
- View customer contact details
- Update status: completed / canceled / no_show
- Block off time ranges
- Protected API via `x-admin-key`

---

## Supabase setup
Run SQL in Supabase SQL Editor:
- `supabase/schema.sql`

Includes:
- enum status
- indexes
- RLS baseline
- seed barber (Yohannes)
- seed services

---

## Keyless Mode (no Supabase/Vercel credentials required)
If Supabase env vars are missing, the app automatically runs on a local JSON database at:
- `data/local-db.json`

This still supports:
- real booking conflict checks
- slot availability
- admin status updates
- blocked time rules

Admin key in keyless mode defaults to:
- `local-admin`

## Environment variables
Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DASHBOARD_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional:
- `RESEND_API_KEY`, `RESEND_FROM`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
- `REVIEW_LINK`, `BOOKING_URL`
- `JOBS_SECRET`
- `STRIPE_SECRET_KEY`

---

## Local run
```bash
cd /Users/kaluzy/.openclaw/workspace/yohannes-barber-pro
cp .env.example .env.local
npm install
npm run dev
```

## Build
```bash
npm run build
```

---

## Vercel deploy
1. Import repo/project in Vercel
2. Add env vars from above
3. Deploy

---

## Scheduling automated jobs (Phase-2 in production)
Set Vercel cron or external scheduler to call:
- `POST /api/jobs/reminders` (hourly)
- `POST /api/jobs/review-requests` (daily)
- `POST /api/jobs/rebook-prompts` (daily)

Header required:
- `x-job-key: <JOBS_SECRET>`

---

## Reusable starter scope
This codebase is already reusable for:
- barber shops
- salons
- braiders
- any local appointment-led service business
