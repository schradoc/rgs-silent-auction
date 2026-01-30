# RGS Silent Auction - Agent Context File

> **Last Updated**: 2026-01-30
> **Last Commit**: a5be05a - Fix prize update and upload progress
> **NOTE**: This file should be updated after every push/commit to keep agents in sync.

---

## Quick Summary

A **live silent auction platform** for the Royal Geographical Society Hong Kong's 30th Anniversary Gala Dinner.

- **Event**: 28 February 2026 at Hong Kong Club
- **Users**: 150-200 affluent guests bidding via mobile phones
- **Prizes**: ~29 items ranging HKD $3,000 - $85,000
- **Status**: Feature complete, in testing phase

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
└── src/
    ├── app/               # Next.js App Router
    │   ├── page.tsx       # Landing page
    │   ├── layout.tsx     # Root layout with providers
    │   ├── globals.css    # Tailwind + custom styles
    │   ├── admin/         # Admin pages
    │   ├── helper/        # Helper portal pages
    │   ├── prizes/        # Prize listing & detail
    │   ├── api/           # API routes
    │   └── ...
    ├── components/
    │   ├── ui/            # Base components (Button, Card, Input, etc.)
    │   ├── admin/         # Admin-specific components
    │   └── prizes/        # Prize cards and grids
    ├── hooks/             # React hooks
    ├── lib/               # Utilities and services
    └── ...
```

---

## Key Files Reference

### Database & Config
- `prisma/schema.prisma` - All models, enums, relations
- `.env` / `.env.example` - Environment variables
- `next.config.ts` - Next.js configuration

### Core UI Components
- `src/components/ui/index.ts` - Exports all UI components
- `src/components/ui/button.tsx` - Button variants
- `src/components/ui/card.tsx` - Card, CardHeader, CardContent
- `src/components/ui/toast.tsx` - Custom toast system (wraps Sonner)
- `src/components/ui/confirm-dialog.tsx` - Confirmation modals

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
- `src/app/api/auth/` - Bidder authentication
- `src/app/api/helpers/` - Helper portal APIs
- `src/app/api/prizes/route.ts` - Prize listing
- `src/app/api/bids/route.ts` - Place bids

### Services & Utilities
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/supabase.ts` - Supabase client
- `src/lib/admin-auth.ts` - Admin session verification
- `src/lib/notifications/index.ts` - Email/SMS sending
- `src/lib/utils.ts` - formatCurrency, classNames, etc.
- `src/lib/constants.ts` - Categories, colors, site config

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
const { bids, isConnected } = useRealtimeBids(prizeId)
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx  # Publishable key
SUPABASE_SECRET_KEY=sb_secret_xxx                 # Secret key (server-side)

# Email
RESEND_API_KEY=re_xxx
FROM_EMAIL=auction@example.com

# App
NEXT_PUBLIC_APP_URL=https://rgs-auction.vercel.app
ADMIN_PASSWORD=xxx  # Legacy, being phased out

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
- Real-time bid updates
- Email notifications (outbid, winner)
- Image upload to Supabase Storage
- Auction state machine
- Team management (invitations, roles)

### Recently Added (2026-01-30)
- **Password login support** - Admins can now use magic link OR password
- Admin login page toggle between methods
- Password management in Settings → Account
- Users can set, change, or remove passwords
- Supabase storage configuration (new key naming)
- DisplaySettings Prisma migration
- Analytics improvements
- Prize detail modal with bid history
- Test email functionality

### Pending/Optional
- Twilio SMS/WhatsApp (env vars not configured)
- Error boundaries
- Confetti on successful bid
- PWA / offline support

---

## Common Tasks

### Add a new API endpoint
1. Create file in `src/app/api/[path]/route.ts`
2. Use `verifyAdminSession()` for admin routes
3. Return `NextResponse.json()`

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
