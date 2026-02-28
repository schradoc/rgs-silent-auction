# RGS Silent Auction

## Project Overview

Live silent auction platform for the **Royal Geographical Society Hong Kong's 30th Anniversary Gala Dinner** on **28 February 2026**.

- **Venue**: Hong Kong Club
- **Guests**: 150-200 affluent attendees
- **Prize Range**: HKD $3,000 - $100,000
- **Access**: QR code scan on mobile phones

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed prize data
npm run db:seed

# Run development server
npm run dev
```

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **UI**: React 19.2.3
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL 17, ap-northeast-1)
- **Real-time**: Supabase Realtime
- **ORM**: Prisma 6.19.2
- **Email**: Resend
- **SMS/OTP**: Twilio Verify (SMS channel)
- **Toast Notifications**: Sonner
- **Deployment**: Vercel
- **Domain**: rgsauction.com

## Project Structure

```
src/
├── app/
│   ├── (bidder)/             # Route group for bidder pages
│   ├── about/                # About RGS page
│   ├── impact/               # Impact & outreach page
│   ├── admin/
│   │   ├── dashboard/        # Admin dashboard with tabs
│   │   ├── login/            # Admin password login
│   │   └── print-winners/    # Printable winner sheets
│   ├── api/
│   │   ├── admin/            # Admin APIs (prizes, settings, upload, users, invitations, etc.)
│   │   ├── auth/             # Bidder auth (SMS OTP via Twilio Verify)
│   │   ├── committee/        # Committee analytics APIs
│   │   ├── helpers/          # Helper portal APIs
│   │   └── ...               # Prizes, bids, favorites, health, etc.
│   ├── committee/            # Committee analytics dashboard (PIN: 2026)
│   ├── helper/
│   │   ├── dashboard/        # Helper dashboard (table intelligence)
│   │   └── submit-bid/       # Manual bid entry
│   ├── live/                 # Live display for projectors
│   ├── prizes/               # Lot listing and detail pages
│   ├── docs/                 # In-app documentation
│   ├── help/                 # Help page
│   ├── welcome/              # Post-registration welcome
│   ├── login/                # Bidder SMS OTP login
│   ├── register/             # Bidder registration
│   └── page.tsx              # Landing page
├── components/
│   ├── admin/                # Admin-specific components
│   │   ├── analytics-charts.tsx
│   │   ├── description-editor.tsx  # Visual block editor for lot descriptions
│   │   ├── image-upload.tsx
│   │   ├── onboarding-tutorial.tsx
│   │   └── password-management.tsx
│   ├── bidder/               # Bidder-specific components
│   ├── layout/
│   │   └── header.tsx        # Shared site header
│   ├── prizes/               # Prize cards, grids, rich descriptions, placeholders
│   └── ui/                   # Base UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── country-code-select.tsx  # Phone country code picker
│       ├── toast.tsx         # Custom toast helper (wraps Sonner)
│       └── confirm-dialog.tsx # Confirmation modal component
├── hooks/
│   ├── useBidder.tsx         # Current bidder context
│   ├── useRealtimeBids.ts    # Real-time bid subscription
│   └── useRealtime.tsx       # Supabase realtime hook
└── lib/
    ├── admin-auth.ts         # Admin session verification
    ├── constants.ts          # Categories, colors, site config
    ├── db.ts                 # Database helpers
    ├── logger.ts             # Structured JSON logger
    ├── mock-data.ts          # Mock data generation
    ├── notifications/        # Email/SMS notification service
    ├── prisma.ts             # Prisma client singleton
    ├── rate-limit.ts         # Sliding-window rate limiter
    ├── supabase.ts           # Supabase client
    ├── types.ts              # Shared TypeScript types
    └── utils.ts              # formatCurrency, classNames, etc.
```

## Key Routes

### Bidder Routes
- `/` - Landing page (QR destination)
- `/register` - Bidder registration (name, phone, email, table)
- `/login` - SMS OTP login
- `/welcome` - Post-registration welcome
- `/prizes` - Lot listing with category + price tier filters
- `/prizes/[slug]` - Lot detail + bidding (gallery, rich descriptions)
- `/my-bids` - Personal bid history
- `/about` - About RGS
- `/impact` - Impact & outreach

### Admin Routes
- `/admin/login` - Admin password login
- `/admin/dashboard` - Full admin dashboard with tabs:
  - Overview (stats, live bid feed, analytics)
  - Prizes (CRUD management)
  - Bidders (list with detail modal)
  - Winners (confirmation and notifications)
  - Helpers (manage event helpers)
  - Settings (comprehensive settings panel)

### Helper Routes
- `/helper` - Helper login (4-digit PIN)
- `/helper/dashboard` - Helper dashboard
- `/helper/submit-bid` - Manual bid entry

### Public Routes
- `/live` - Live display for projector

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Publishable key
SUPABASE_SECRET_KEY=              # Secret key (for server-side storage)

# Database (Prisma)
DATABASE_URL=
DIRECT_URL=

# Email (Resend)
RESEND_API_KEY=

# SMS/OTP (Twilio Verify)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_VERIFY_SERVICE_SID=       # Twilio Verify service for OTP

# App
NEXT_PUBLIC_APP_URL=
ADMIN_PASSWORD=                   # Required for admin setup (no default)
```

## Database Schema

### Core Models
- **Bidder**: Registration, contact info (phone + email), SMS OTP auth, notification preferences
- **Prize**: Title, descriptions, donor, category, images, multi-winner, lotNumber, subLotLetter, donorUrl, location
- **PrizeImage**: Multiple images per prize with primary flag
- **Bid**: Amount, status (ACTIVE/OUTBID/WINNING/WON/LOST), helper tracking
- **Winner**: Confirmed winners with acceptance timestamp
- **Favorite**: Bidder watchlist

### Auction Management
- **AuctionSettings**: State machine (DRAFT/TESTING/PRELAUNCH/LIVE/CLOSED), end time
- **DisplaySettings**: Show donor/bidder names, featured rotation, custom QR URL

### Admin System
- **AdminUser**: Email, name, role (OWNER/ADMIN/EMPLOYEE), active status
- **AdminSession**: Token-based sessions
- **AdminInvitation**: Pending invitations with expiry
- **AuditLog**: Admin action tracking

### Helper System
- **Helper**: Name, PIN, avatar color, assigned tables, activity tracking
### Notifications
- **Notification**: Outbid, winning, auction closing, won notifications

## UI Components

### Custom Toast System
```tsx
import { toast } from '@/components/ui'

toast.success('Bid placed successfully')
toast.error('Failed to place bid')
toast.info('Auction closes in 10 minutes')
toast.warning('You have been outbid')
```

### Confirmation Dialog
```tsx
import { useConfirm } from '@/components/ui'

const confirm = useConfirm()

const handleDelete = async () => {
  const confirmed = await confirm.confirm({
    title: 'Delete Prize',
    description: 'Are you sure? This cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'danger',
  })
  if (confirmed) {
    // proceed with deletion
  }
}
```

## Design System

### Colors
- **Navy**: `#1e3a5f` (primary)
- **Gold**: `#c9a227` (accent/CTA)
- **White**: `#ffffff` (background)
- **Light Gray**: `#f5f5f5` (cards)

### Components
- Button (primary, secondary, outline, ghost, gold)
- Input with validation
- Card with header/content/footer
- Badge variants
- Toast notifications (success, error, info, warning)
- Confirmation dialogs (default, danger)

## Admin Dashboard Features

### Overview Tab
- Real-time stats (prizes, bidders, bids, total value)
- Auction state banner with quick action
- **Enhanced analytics charts**:
  - Key metrics row (bids/value last hour, active bidders, engagement rate)
  - 24-hour bid activity chart with hover tooltips
  - Top prizes leaderboard
  - Category performance breakdown with avg bids/prize
- Live bid feed

### Prizes Tab
- Full CRUD for prizes
- Multi-image upload with drag-drop
- Category filtering
- Activation/deactivation
- **Prize detail modal** (click any prize):
  - Stats grid (current bid, total bids, unique bidders, avg bid)
  - Winner section if confirmed
  - Full bid history with bidder names, tables, amounts, timestamps

### Bidders Tab
- List with bid counts
- Detail modal with full bid history
- Loading states on row click

### Winners Tab
- Pending/confirmed winner management
- Bulk confirm with notifications
- Export to CSV
- Print-friendly sheets

### Helpers Tab
- Helper management (add, deactivate)
- PIN-based authentication
- Activity tracking

### Settings Tab (Comprehensive)
- **Auction Management**: State machine, end time, mock data tools
- **Display Settings**: Donor names, bidder names, rotation interval, QR URL
- **Team Management**: Users, roles, invitations
- **Email & Notifications**: Provider status, test email (sends real email), template preview
- **Data & Export**: CSV exports for all data
- **Support**: Contact, documentation, version info

## Deployment

- **Production**: https://rgsauction.com
- **GitHub**: https://github.com/schradoc/rgs-silent-auction
- **Vercel Project**: rgs-auction (auto-deploys from `main`)
- **Supabase**: tartdrhbhbumzfrbqabt (ap-northeast-1)

To deploy:
1. Set environment variables in Vercel dashboard
2. Push to main branch (auto-deploys)

After schema changes:
```bash
npx prisma generate
npx prisma db push
```

## Completed Features

### Phase 1 - Core Bidding
- [x] Landing page with hero
- [x] Bidder registration (phone + email)
- [x] SMS OTP verification (Twilio Verify)
- [x] Lot listing with category + price tier filters
- [x] Lot detail page with image gallery and rich descriptions
- [x] Bid placement with validation
- [x] My Bids page
- [x] Real-time outbid notifications
- [x] Favorites/watchlist

### Phase 2 - Admin Dashboard
- [x] Admin authentication (password + bcrypt)
- [x] Real-time bid feed
- [x] Prize management (CRUD) with visual block editor
- [x] Multi-image upload
- [x] Bidder list with detail modal
- [x] Winner selection and notifications
- [x] Data export (CSV)
- [x] Helper system with table intelligence
- [x] Analytics charts
- [x] Onboarding tutorial
- [x] Auction state machine (all transitions allowed)
- [x] Team management (users, invitations)
- [x] Committee analytics dashboard

### Phase 2.5 - UX & Security
- [x] Custom toast notifications (Sonner)
- [x] Custom confirmation dialogs
- [x] Loading states for async operations
- [x] Comprehensive settings page
- [x] Prize detail modal with bid history
- [x] Security hardening (bcrypt, rate limiting, CSP, HSTS, etc.)
- [x] SELECT FOR UPDATE bid race condition fix
- [x] Error boundaries on all major routes
- [x] Realtime reconnection with fallback polling
- [x] Structured JSON logging
- [x] Health check endpoint

### Phase 3 - Visual Overhaul & Polish
- [x] Shared site header across all pages
- [x] "Lots" terminology throughout
- [x] Visual block editor for descriptions
- [x] Rich description renderer
- [x] Lot numbering (lotNumber + subLotLetter)
- [x] Price tier filters
- [x] Branded no-image placeholders
- [x] About & Impact content pages
- [x] Country code selector (defaults to HK +852)
- [x] PRELAUNCH banner
- [x] Helper table intelligence
- [ ] Confetti on successful bid

## Known Issues / TODO

### Future Improvements
- Confetti animation on successful bid
- Push notifications (web push API)
- Offline support / PWA

## Current Status

**LIVE — Event is tonight**: Full platform operational. Bidders register via SMS OTP, browse lots, place bids with real-time updates. Admins manage everything via dashboard. Helpers submit bids with table intelligence. Committee monitors live analytics.

**Event Date**: 28 February 2026
**Production**: https://rgsauction.com

---

**Last Updated**: 2026-02-28

---

## Agent Handoff

For sharing context with other AI agents, use **[AGENT-CONTEXT.md](./AGENT-CONTEXT.md)** - a comprehensive file designed for drag-and-drop into new agent contexts. Remember to update it after every commit.
