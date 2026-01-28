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

# Push database schema
npm run db:push

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
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/
│   ├── (bidder)/           # Bidder-facing routes (future)
│   ├── admin/              # Admin dashboard (TODO)
│   ├── api/
│   │   ├── auth/           # Registration, verification, session
│   │   └── bids/           # Bid placement and retrieval
│   ├── prizes/
│   │   ├── [slug]/         # Prize detail page
│   │   └── page.tsx        # Prize listing
│   ├── register/           # Bidder registration
│   └── page.tsx            # Landing page
├── components/
│   ├── admin/              # Admin components (TODO)
│   ├── prizes/             # Prize cards and grids
│   └── ui/                 # Base UI components
├── hooks/                  # Custom React hooks
└── lib/                    # Utilities, clients, constants
```

## Key Routes

### Bidder Routes
- `/` - Landing page (QR destination)
- `/register` - Bidder registration
- `/prizes` - Prize listing
- `/prizes/[slug]` - Prize detail + bidding
- `/my-bids` - Personal bid history (TODO)

### Admin Routes (TODO)
- `/admin` - Admin login
- `/admin/dashboard` - Real-time bid overview
- `/admin/prizes` - Prize management
- `/admin/winners` - Winner selection

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
ADMIN_PASSWORD=
```

## Database Schema

- **Bidder**: id, name, email, tableNumber, emailVerified
- **Prize**: id, slug, title, descriptions, donor, bids, category, etc.
- **Bid**: id, amount, status, bidderId, prizeId
- **Winner**: id, bidId, prizeId, bidderId
- **AuctionSettings**: endTime, isOpen

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

## Deployment

- **GitHub**: https://github.com/schradoc/rgs-silent-auction
- **Vercel**: Linked and connected

To deploy:
1. Set environment variables in Vercel dashboard
2. Push to main branch (auto-deploys)

## TODO

### Phase 1 - Core Bidding (Current)
- [x] Landing page
- [x] Bidder registration
- [x] Email verification (mock)
- [x] Prize listing
- [x] Prize detail page
- [x] Bid placement
- [x] Seed data (26 prizes)
- [ ] My Bids page
- [ ] Outbid notifications

### Phase 2 - Admin Dashboard
- [ ] Admin authentication
- [ ] Real-time bid feed
- [ ] Prize management
- [ ] Bidder list
- [ ] Winner selection
- [ ] Data export

### Phase 3 - Polish
- [ ] Real-time updates (Supabase Realtime)
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error boundaries
- [ ] Confetti on successful bid

---

**Last Updated**: 2026-01-28
