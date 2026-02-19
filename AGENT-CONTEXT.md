# RGS Silent Auction - Agent Context File

> **Last Updated**: 2026-02-19
> **Last Commit**: 158e248 - Fix bid race condition with SELECT FOR UPDATE row locking
> **NOTE**: This file should be updated after every push/commit to keep agents in sync.

---

## Quick Summary

A **live silent auction platform** for the Royal Geographical Society Hong Kong's 30th Anniversary Gala Dinner.

- **Event**: 28 February 2026 at Hong Kong Club
- **Users**: 150-200 affluent guests bidding via mobile phones
- **Prizes**: ~29 items ranging HKD $3,000 - $85,000
- **Status**: Production-hardened, security-audited, load-tested

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Real-time | Supabase Realtime |
| Storage | Supabase Storage (`prize-images` bucket) |
| Email | Resend |
| SMS/WhatsApp | Twilio (optional) |
| Auth Hashing | bcryptjs (12 rounds) |
| Testing | Vitest |
| Deployment | Vercel |
| Repo | github.com/schradoc/rgs-silent-auction |

---

## Project Structure

```
rgs-auction/
├── CLAUDE.md              # Project documentation (shorter)
├── AGENT-CONTEXT.md       # This file (comprehensive)
├── prisma/
│   ├── schema.prisma      # Database schema (SOURCE OF TRUTH)
│   └── seed.ts            # Prize seed data
├── docs/
│   ├── PRD.md             # Product requirements
│   ├── DECISIONS.md       # Architecture decisions
│   └── PHASE2-PLAN.md     # Historical planning doc
├── scripts/
│   ├── load-test.ts       # Generic concurrent bid load tester
│   └── load-test-live.ts  # Live load test with real bidder IDs
├── vitest.config.ts       # Test configuration
└── src/
    ├── app/               # Next.js App Router
    │   ├── page.tsx       # Landing page
    │   ├── layout.tsx     # Root layout with providers
    │   ├── error.tsx      # Root error boundary
    │   ├── global-error.tsx # Global error boundary (own HTML shell)
    │   ├── globals.css    # Tailwind + custom styles
    │   ├── admin/         # Admin pages (+ error.tsx)
    │   ├── helper/        # Helper portal pages (+ error.tsx)
    │   ├── prizes/        # Prize listing & detail (+ error.tsx per level)
    │   ├── api/           # API routes
    │   └── ...
    ├── components/
    │   ├── ui/            # Base components (Button, Card, Input, etc.)
    │   ├── admin/         # Admin-specific components
    │   ├── prizes/        # Prize cards and grids
    │   └── connection-status.tsx  # Realtime reconnection banner
    ├── hooks/             # React hooks
    ├── lib/               # Utilities and services
    │   ├── rate-limit.ts  # In-memory sliding-window rate limiter
    │   ├── logger.ts      # Structured JSON logger
    │   └── ...
    └── __tests__/         # Vitest test suites
        └── api/           # API integration tests
```

---

## Key Files Reference

### Database & Config
- `prisma/schema.prisma` - All models, enums, relations, indexes
- `.env` / `.env.example` - Environment variables
- `next.config.ts` - Next.js configuration + security headers
- `vitest.config.ts` - Test configuration

### Core UI Components
- `src/components/ui/index.ts` - Exports all UI components
- `src/components/ui/button.tsx` - Button variants
- `src/components/ui/card.tsx` - Card, CardHeader, CardContent
- `src/components/ui/toast.tsx` - Custom toast system (wraps Sonner)
- `src/components/ui/confirm-dialog.tsx` - Confirmation modals
- `src/components/connection-status.tsx` - Realtime disconnection banner

### Error Boundaries
- `src/app/global-error.tsx` - Root-level (provides own HTML shell)
- `src/app/error.tsx` - App-level fallback
- `src/app/prizes/error.tsx` - Prize listing errors
- `src/app/prizes/[slug]/error.tsx` - Prize detail errors
- `src/app/admin/dashboard/error.tsx` - Admin dashboard errors
- `src/app/helper/error.tsx` - Helper portal errors

### Main Pages
- `src/app/page.tsx` - Landing page
- `src/app/prizes/page.tsx` - Prize listing
- `src/app/prizes/[slug]/page.tsx` - Prize detail + bidding
- `src/app/admin/dashboard/admin-dashboard.tsx` - Full admin dashboard (~2500 lines)
- `src/app/admin/login/page.tsx` - Admin magic link login
- `src/app/helper/page.tsx` - Helper PIN login
- `src/app/live/page.tsx` - Projector display

### API Routes
- `src/app/api/admin/` - All admin APIs
  - `prizes/` - Prize CRUD
  - `users/` - Team management
  - `invitations/` - Admin invitations
  - `settings/` - Auction and display settings
  - `upload/` - Image upload to Supabase Storage
  - `test-email/` - Send test email
  - `test-sms/` - Send test SMS/WhatsApp + status check
  - `login/` - Admin login (bcrypt + legacy SHA256 migration)
  - `password/` - Password management (bcrypt)
- `src/app/api/auth/` - Bidder authentication
  - `verify/` - Email verification (rate-limited, 15-min expiry)
- `src/app/api/helpers/` - Helper portal APIs
  - `login/` - PIN login (rate-limited)
  - `submit-bid/` - Helper bid submission (SELECT FOR UPDATE)
- `src/app/api/prizes/route.ts` - Prize listing
- `src/app/api/bids/route.ts` - Place bids (SELECT FOR UPDATE, rate-limited)
- `src/app/api/auction-status/route.ts` - Auction state (fails closed on error)
- `src/app/api/health/route.ts` - Health check endpoint

### Services & Utilities
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/supabase.ts` - Supabase client
- `src/lib/admin-auth.ts` - Admin session verification
- `src/lib/notifications/index.ts` - Email/SMS sending
- `src/lib/utils.ts` - formatCurrency, classNames, etc.
- `src/lib/constants.ts` - Categories, colors, site config
- `src/lib/rate-limit.ts` - Sliding-window rate limiter
- `src/lib/logger.ts` - Structured JSON logger

---

## Security Hardening (2026-02-18)

### Fixes Applied

| Vulnerability | Fix |
|--------------|-----|
| **Email verification bypass** — any 6-digit code accepted | Strict code match only, null-check for pending code, 15-min expiry |
| **Bid race condition** — concurrent bids create duplicate winners | `SELECT ... FOR UPDATE` row locking on Prize row inside transaction |
| **Weak password hashing** — SHA256 + salt | bcrypt (12 rounds) with auto-migration from legacy hashes |
| **Hardcoded default password** — `rgs-admin-2026` in source | Removed; `ADMIN_PASSWORD` env var required |
| **No rate limiting** — helper PIN brute-forceable | Sliding-window limiter on auth, admin login, helper login, bids |
| **No security headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **Auction status fail-open** — returns `isAuctionOpen: true` on DB error | Returns `isAuctionOpen: false` with 503 on error |
| **No error boundaries** — component crash white-screens app | Error boundaries on all major routes with recovery UI |
| **No realtime reconnection** — stale data on WiFi drop | Auto-reconnect with 2s delay, connection banner, 30s fallback polling |
| **Stale bid validation** — outbid between sheet open and submit | Pre-submit prize re-fetch with clear "someone outbid you" message |

### Rate Limits
| Endpoint | Limit |
|----------|-------|
| Helper login (`/api/helpers/login`) | 5 per 15 min per IP |
| Auth verify (`/api/auth/verify`) | 5 per 15 min per email |
| Admin login (`/api/admin/login`) | 5 per 30 min per IP |
| Bid placement (`/api/bids`) | 10 per min per bidder |

### Load Test Results
- 20 concurrent bids on same prize → **exactly 1 WINNING bid** (verified on production)
- `SELECT FOR UPDATE` serializes concurrent transactions at the row level

---

## Database Schema Overview

### Core Models
```
Bidder          - Guest registration (name, email, table, auth tokens)
Prize           - Auction items (title, descriptions, images, bids)
PrizeImage      - Multiple images per prize
Bid             - Bid records (amount, status, timestamps)
Winner          - Confirmed winners
Favorite        - Bidder watchlist
```

### Admin System
```
AdminUser       - Admin accounts (email, role: OWNER/ADMIN/EMPLOYEE)
AdminSession    - Token-based sessions
AdminInvitation - Pending invites with expiry
AuditLog        - Action tracking
```

### Helper System
```
Helper          - Event helpers (name, PIN, avatar color)
PaperBid        - Scanned paper bid records
```

### Settings
```
AuctionSettings  - State machine (DRAFT/TESTING/PRELAUNCH/LIVE/CLOSED)
DisplaySettings  - Live page toggles (donor names, bidder names, etc.)
```

### Key Indexes
```
Bid:            (prizeId, status), (prizeId, amount), (bidderId), (status), (helperId)
Prize:          (isActive, parentPrizeId)
Helper:         (pin, isActive)
AdminSession:   (expiresAt)
PrizeImage:     (prizeId)
```

### Key Enums
```
BidStatus: ACTIVE | OUTBID | WINNING | WON | LOST
AuctionState: DRAFT | TESTING | PRELAUNCH | LIVE | CLOSED
AdminRole: OWNER | ADMIN | EMPLOYEE
NotificationType: OUTBID | WINNING | AUCTION_CLOSING | WON
```

---

## Routes Map

### Public (Bidders)
| Route | Purpose |
|-------|---------|
| `/` | Landing page (QR destination) |
| `/register` | Bidder registration |
| `/login` | Magic link / OTP login |
| `/prizes` | Browse all prizes |
| `/prizes/[slug]` | Prize detail + place bid |
| `/my-bids` | Personal bid history |
| `/favorites` | Watchlist |
| `/profile` | Edit profile |

### Admin
| Route | Purpose |
|-------|---------|
| `/admin/login` | Magic link login |
| `/admin/dashboard` | Main dashboard (tabbed) |
| `/admin/print-winners` | Printable winner sheets |

### Helper Portal
| Route | Purpose |
|-------|---------|
| `/helper` | PIN login |
| `/helper/dashboard` | Helper stats & leaderboard |
| `/helper/submit-bid` | Manual bid entry |
| `/helper/scan-bid` | OCR paper bid scanning |

### Display
| Route | Purpose |
|-------|---------|
| `/live` | Projector display for venue |

### API (Monitoring)
| Route | Purpose |
|-------|---------|
| `/api/health` | Health check (DB status + latency) |

---

## Admin Dashboard Tabs

The admin dashboard (`/admin/dashboard`) has 6 tabs:

1. **Overview** - Stats, analytics charts, live bid feed
2. **Prizes** - CRUD management, image upload, prize detail modal
3. **Bidders** - List with detail modal showing bid history
4. **Winners** - Confirm winners, send notifications, export
5. **Helpers** - Manage event helpers, view activity
6. **Settings** - Auction state, display settings, team, email, export

---

## Code Patterns & Conventions

### API Routes
```typescript
// Standard pattern for admin APIs
export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession()
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... logic
}
```

### Bid Placement (Race-Safe)
```typescript
// Use SELECT FOR UPDATE inside transaction for bid serialization
const result = await prisma.$transaction(async (tx) => {
  const prizeRows = await tx.$queryRaw<Array<{...}>>`
    SELECT id, "currentHighestBid", "minimumBid"
    FROM "Prize" WHERE id = ${prizeId} FOR UPDATE`
  const prize = prizeRows[0]
  // ... validate and create bid with locked row
})
```

### Rate Limiting
```typescript
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

const ip = getClientIP(request)
const rl = checkRateLimit(`endpoint:${ip}`, RATE_LIMITS.helperLogin)
if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)
```

### Toast Notifications
```typescript
import { toast } from '@/components/ui'

toast.success('Bid placed!')
toast.error('Failed to place bid')
toast.info('Auction closes soon')
toast.warning('You have been outbid')
```

### Confirmation Dialogs
```typescript
import { useConfirm } from '@/components/ui'

const confirm = useConfirm()
const confirmed = await confirm.confirm({
  title: 'Delete Prize',
  description: 'This cannot be undone.',
  confirmLabel: 'Delete',
  variant: 'danger',
})
if (confirmed) { /* proceed */ }
```

### Prisma Queries
```typescript
const { prisma } = await import('@/lib/prisma')
const prizes = await prisma.prize.findMany({
  where: { isActive: true },
  include: { images: true, _count: { select: { bids: true } } },
  orderBy: { createdAt: 'desc' },
})
```

### Real-time Subscriptions
```typescript
import { useRealtimeBids } from '@/hooks'
const { connectionState, isConnected } = useRealtimeBids({ prizeId, bidderId })
// connectionState: 'connected' | 'connecting' | 'disconnected'
```

### Structured Logging
```typescript
import { logger } from '@/lib/logger'

logger.info('Bid placed', { prizeId, amount, bidderId })
logger.error('Bid failed', error, { prizeId })
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=5  # Pooled connection
DIRECT_URL=postgresql://...  # Direct connection for migrations

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx  # Publishable key
SUPABASE_SECRET_KEY=sb_secret_xxx                 # Secret key (server-side)

# Email
RESEND_API_KEY=re_xxx
FROM_EMAIL=auction@example.com

# App
NEXT_PUBLIC_APP_URL=https://rgs-auction.vercel.app
ADMIN_PASSWORD=xxx  # Required for initial admin setup (no default)

# Optional: Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
```

---

## Design System

### Colors
- **Navy**: `#1e3a5f` (primary, headers, buttons)
- **Gold**: `#c9a227` (accent, CTAs, highlights)
- **White**: `#ffffff` (backgrounds)
- **Light Gray**: `#f5f5f5` (cards, sections)

### Component Variants
- **Button**: `primary`, `secondary`, `outline`, `ghost`, `gold`, `danger`
- **Badge**: `default`, `gold`, `navy`, `success`, `warning`, `error`
- **Card**: Standard wrapper with optional header/footer

---

## Current State & Known Issues

### Working Features
- Full bidder flow (register, browse, bid, notifications)
- Admin dashboard with all tabs
- Helper portal with paper bid OCR
- Real-time bid updates with reconnection handling
- Email notifications (outbid, winner)
- Image upload to Supabase Storage
- Auction state machine
- Team management (invitations, roles)
- Error boundaries on all major routes
- Rate limiting on sensitive endpoints
- Security headers (CSP, HSTS, etc.)
- Health check endpoint
- Structured JSON logging

### Recently Added (2026-02-18)
- **Production security hardening** — full audit and fixes
- `SELECT FOR UPDATE` row locking to prevent bid race conditions
- bcrypt password hashing with SHA256 auto-migration
- Email verification bypass fix (strict code match + 15-min expiry)
- In-memory sliding-window rate limiter on auth/bid endpoints
- Security headers via next.config.ts
- Auction status fail-closed behavior
- Error boundaries on all major routes
- Realtime WebSocket reconnection with fallback polling
- Connection status banner component
- Pre-submit bid validation (re-fetch before submit)
- Database indexes on critical query paths
- Structured JSON logger
- Health check endpoint (`GET /api/health`)
- Vitest test suite (9 tests: auth, rate limiting, fail-closed)
- Load test scripts for concurrent bid validation

### Previously Added (2026-02-02)
- SMS/WhatsApp notification support via Twilio
- Test SMS/WhatsApp buttons in admin settings

### Pending/Optional
- Twilio env vars need to be configured in Vercel (code is ready)
- Confetti on successful bid
- PWA / offline support

---

## Testing

### Run Tests
```bash
npm test          # Run all tests once
npm run test:watch  # Watch mode
```

### Test Coverage
- `src/__tests__/api/auth-verify.test.ts` — Verification code validation (4 tests)
- `src/__tests__/api/rate-limit.test.ts` — Rate limiter behavior (4 tests)
- `src/__tests__/api/auction-status.test.ts` — Fail-closed behavior (1 test)

### Load Testing
```bash
# Generic load test
npx tsx scripts/load-test.ts <BASE_URL> <PRIZE_ID> [NUM_BIDS]

# Live load test with hardcoded real bidder IDs
npx tsx scripts/load-test-live.ts
```

---

## Common Tasks

### Add a new API endpoint
1. Create file in `src/app/api/[path]/route.ts`
2. Use `verifyAdminSession()` for admin routes
3. Add rate limiting for sensitive endpoints
4. Return `NextResponse.json()`

### Add a new UI component
1. Create in `src/components/ui/[name].tsx`
2. Export from `src/components/ui/index.ts`

### Modify database schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push`

### Deploy changes
1. Push to `main` branch (auto-deploys to Vercel)
2. Or run `vercel --prod` manually

---

## Deployment Info

- **Production**: https://rgs-auction.vercel.app
- **GitHub**: https://github.com/schradoc/rgs-silent-auction
- **Vercel Project**: rgs-auction
- **Supabase Project**: tartdrhbhbumzfrbqabt

---

## Update Checklist

When updating this file after commits:
- [ ] Update "Last Updated" date
- [ ] Update "Last Commit" hash and message
- [ ] Add any new routes to Routes Map
- [ ] Add any new models to Database Schema
- [ ] Update Known Issues / Recently Fixed
- [ ] Add any new environment variables
- [ ] Document any new patterns or conventions

---

*This file is designed for drag-and-drop into new agent contexts. For lighter documentation, see CLAUDE.md.*
