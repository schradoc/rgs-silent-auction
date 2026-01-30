# RGS Silent Auction

## Project Overview

Live silent auction platform for the **Royal Geographical Society Hong Kong's 30th Anniversary Gala Dinner** on **28 February 2026**.

- **Venue**: Hong Kong Club
- **Guests**: 150-200 affluent attendees
- **Prize Range**: HKD $3,000 - $85,000
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

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **ORM**: Prisma
- **Email**: Resend
- **SMS/WhatsApp**: Twilio (optional)
- **Toast Notifications**: Sonner
- **OCR**: Tesseract.js (paper bid scanning)
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/        # Admin dashboard with tabs
│   │   ├── login/            # Admin magic link login
│   │   └── print-winners/    # Printable winner sheets
│   ├── api/
│   │   ├── admin/            # Admin APIs
│   │   │   ├── analytics/    # Dashboard analytics data
│   │   │   ├── prizes/[id]/  # Prize detail with bid history
│   │   │   ├── settings/     # Auction and display settings
│   │   │   ├── test-email/   # Send test email
│   │   │   ├── upload/       # Image upload to Supabase
│   │   │   ├── users/        # Team management
│   │   │   └── invitations/  # Admin invitations
│   │   ├── auth/             # Bidder auth (magic link, OTP)
│   │   ├── helpers/          # Helper portal APIs
│   │   └── ...               # Prizes, bids, favorites, etc.
│   ├── helper/
│   │   ├── dashboard/        # Helper dashboard
│   │   ├── scan-bid/         # OCR paper bid scanning
│   │   └── submit-bid/       # Manual bid entry
│   ├── live/                 # Live display for projectors
│   ├── prizes/               # Prize listing and detail pages
│   ├── login/                # Bidder login
│   ├── register/             # Bidder registration
│   └── page.tsx              # Landing page
├── components/
│   ├── admin/                # Admin-specific components
│   │   ├── analytics-charts.tsx
│   │   ├── image-upload.tsx
│   │   └── onboarding-tutorial.tsx
│   ├── prizes/               # Prize cards and grids
│   └── ui/                   # Base UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── toast.tsx         # Custom toast helper (wraps Sonner)
│       └── confirm-dialog.tsx # Confirmation modal component
├── hooks/
│   ├── useBidder.tsx         # Current bidder context
│   ├── useRealtimeBids.ts    # Real-time bid subscription
│   └── useRealtime.tsx       # Supabase realtime hook
└── lib/
    ├── admin-auth.ts         # Admin session verification
    ├── constants.ts          # Categories, colors, site config
    ├── notifications/        # Email/SMS notification service
    ├── prisma.ts             # Prisma client singleton
    ├── supabase.ts           # Supabase client
    └── utils.ts              # formatCurrency, classNames, etc.
```

## Key Routes

### Bidder Routes
- `/` - Landing page (QR destination)
- `/register` - Bidder registration
- `/login` - Magic link / OTP login
- `/prizes` - Prize listing with filtering
- `/prizes/[slug]` - Prize detail + bidding
- `/my-bids` - Personal bid history

### Admin Routes
- `/admin/login` - Admin magic link login
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
- `/helper/scan-bid` - OCR paper bid scanning
- `/helper/submit-bid` - Manual bid entry

### Public Routes
- `/live` - Live display for projector

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Prisma)
DATABASE_URL=
DIRECT_URL=

# Email (Resend)
RESEND_API_KEY=

# SMS/WhatsApp (Twilio - optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
NEXT_PUBLIC_APP_URL=
```

## Database Schema

### Core Models
- **Bidder**: Registration, contact info, notification preferences, auth tokens
- **Prize**: Title, descriptions, donor, category, images, multi-winner settings
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
- **Helper**: Name, PIN, avatar color, activity tracking
- **PaperBid**: Scanned paper bid records with image

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

- **GitHub**: https://github.com/schradoc/rgs-silent-auction
- **Vercel**: Linked and connected

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
- [x] Landing page
- [x] Bidder registration
- [x] Email verification (magic link)
- [x] Prize listing with filtering
- [x] Prize detail page with images
- [x] Bid placement with validation
- [x] My Bids page
- [x] Real-time outbid notifications
- [x] Favorites/watchlist

### Phase 2 - Admin Dashboard
- [x] Admin authentication (magic link)
- [x] Real-time bid feed
- [x] Prize management (CRUD)
- [x] Multi-image upload
- [x] Bidder list with detail modal
- [x] Winner selection and notifications
- [x] Data export (CSV)
- [x] Helper system for paper bids
- [x] OCR paper bid scanning
- [x] Analytics charts
- [x] Onboarding tutorial
- [x] Auction state machine
- [x] Team management (users, invitations)

### Phase 2.5 - UX Improvements
- [x] Custom toast notifications (replacing native alerts)
- [x] Custom confirmation dialogs (replacing native confirms)
- [x] Loading states for async operations
- [x] Bidder modal loading indicator
- [x] Camera functionality fixes for helpers
- [x] Magic link resend with countdown
- [x] Comprehensive settings page
- [x] Prize detail modal with bid history
- [x] Enhanced analytics with better visuals
- [x] Test email functionality (sends real emails)
- [x] Improved email templates (HTML/CSS styling)
- [x] Graceful error handling for missing Supabase config

### Phase 3 - Polish
- [x] Real-time updates (Supabase Realtime)
- [x] Toast notifications
- [x] Loading states
- [ ] Error boundaries
- [ ] Confetti on successful bid

## Known Issues / TODO

### Pending Configuration
- **Supabase Storage**: Image uploads require `SUPABASE_SERVICE_ROLE_KEY` env var and a `prize-images` bucket in Supabase Storage (public access). Currently shows helpful error when not configured.

### Pending Schema Migration
- **DisplaySettings model**: Added to `prisma/schema.prisma` but needs:
  ```bash
  npx prisma generate
  npx prisma db push
  ```
  Until run, display settings toggles in admin won't persist.

### Future Improvements
- Error boundaries for graceful failure handling
- Confetti animation on successful bid
- Push notifications (web push API)
- Offline support / PWA

## Current Status

**Ready for event**: Core functionality complete. Bidders can register, browse prizes, place bids. Admins can manage everything. Helpers can enter paper bids.

**Event Date**: 28 February 2026

---

**Last Updated**: 2026-01-30
