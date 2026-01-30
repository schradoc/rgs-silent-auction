# Architecture Decisions Log

## ADR-001: Real-Time Technology

**Status**: Proposed
**Date**: 2026-01-28

### Context
The auction requires real-time bid updates visible to all users simultaneously. ~200 concurrent users need to see bid changes within 500ms.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Supabase Realtime** | Built-in with DB, free tier sufficient, easy setup | Vendor lock-in |
| Pusher | Proven, simple API | Additional service, cost |
| Socket.io | Full control | Needs separate server, complex |
| Server-Sent Events | Simple, native | One-way only, reconnection handling |
| Polling | Simplest | Not truly real-time, wasteful |

### Decision
**Supabase Realtime** - Integrates directly with our database, handles 200 concurrent connections easily on free tier, and provides both database subscriptions and broadcast channels.

### Consequences
- Supabase becomes our primary backend
- Real-time updates on table changes (bids, prizes)
- Can use Supabase Auth if needed later

---

## ADR-002: Database Choice

**Status**: Proposed
**Date**: 2026-01-28

### Context
Need a database that works well with Vercel, supports real-time subscriptions, and handles our simple relational data model.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Supabase (PostgreSQL)** | Real-time built-in, great DX, generous free tier | Vendor coupling |
| Vercel Postgres | Native Vercel integration | No built-in real-time |
| PlanetScale | Serverless MySQL, fast | No real-time, MySQL |
| SQLite (Turso) | Edge-native, simple | Less mature ecosystem |

### Decision
**Supabase PostgreSQL** - Pairs naturally with Supabase Realtime, provides excellent developer experience, and the free tier (500MB, unlimited API requests) is more than sufficient for this event.

### Consequences
- Use Prisma as ORM for type safety
- Direct Supabase connection for real-time subscriptions
- Prisma for migrations and schema management

---

## ADR-003: Authentication Strategy

**Status**: Proposed
**Date**: 2026-01-28

### Context
Bidders need a frictionless onboarding (no passwords), while admins need secure access.

### Design

**Bidders:**
- Simple registration form (name, email, table)
- Store bidder ID in localStorage + HTTP-only cookie
- No password, no email verification
- "Anonymous auth" - device-bound session

**Admins:**
- Single shared password (env variable)
- Password checked server-side
- Session cookie set on successful auth
- 24-hour expiry

### Decision
Custom lightweight auth - Supabase Auth is overkill for this use case. Bidders don't need accounts, just identification.

### Consequences
- Bidder "account" is device-bound (can't switch phones)
- Admin password shared among helpers (acceptable for event)
- No password reset flow needed

---

## ADR-004: State Management

**Status**: Proposed
**Date**: 2026-01-28

### Context
Need to manage: current user, real-time prize data, bid state, notifications.

### Decision
**React Context + Supabase subscriptions**

- `BidderContext` - Current user info, persisted to localStorage
- `RealtimeContext` - Supabase subscription management
- React Query (TanStack Query) - Server state, caching, optimistic updates
- No Redux/Zustand - overkill for this scope

### Consequences
- Simpler mental model
- Real-time updates flow through Supabase hooks
- Optimistic UI for bid placement

---

## ADR-005: Bid Increment Strategy

**Status**: Proposed
**Date**: 2026-01-28

### Context
Need to determine minimum bid increments to prevent $1 bid wars.

### Decision
**Tiered increments based on current bid:**

| Current Bid Range | Minimum Increment |
|-------------------|-------------------|
| $0 - $10,000 | $500 |
| $10,001 - $30,000 | $1,000 |
| $30,001 - $50,000 | $2,000 |
| $50,001+ | $5,000 |

### Consequences
- Prevents trivial overbids
- Keeps bidding moving at higher values
- Logic lives in shared utility function

---

## ADR-006: Multi-Winner Implementation

**Status**: Proposed
**Date**: 2026-01-28

### Context
Some prizes (e.g., Tuscany villa with 7 rooms) can have multiple winners. Bidders should not know this - they compete normally.

### Design
- Prize has `multiWinnerEligible: boolean` and `multiWinnerSlots: number`
- Bidders see normal auction UI
- Admin sees "X slots available" badge
- Admin can mark multiple bids as winners
- Each winner pays their bid amount

### Consequences
- UI identical for bidders regardless of multi-winner status
- Admin dashboard shows multi-winner opportunities
- Winner selection is manual (admin decides which bids to accept)

---

## ADR-007: Image Strategy

**Status**: Proposed
**Date**: 2026-01-28

### Context
Need high-quality images for ~29 prizes. Using placeholder/stock images for demo.

### Decision
- Store images in `/public/images/prizes/`
- Use Unsplash for placeholder travel/expedition imagery
- Optimize images (WebP, responsive sizes)
- Fallback gradient if image fails to load

### Image Categories Needed
- Historic maps (antique paper texture)
- Luxury experiences (champagne, sailing, dining)
- Safari/wildlife
- Mountain/glacier landscapes
- Asian destinations (Great Wall, Japan, Mongolia)
- European destinations (Tuscany, Madrid, Swiss Alps)
- Arctic/northern lights

### Consequences
- Images bundled with app (fast loading)
- No external image service needed
- Easy to swap with real images later

---

## ADR-008: Deployment Architecture

**Status**: Proposed
**Date**: 2026-01-28

### Context
Single-event application, needs to be reliable for 4-hour window.

### Decision
**Vercel + Supabase**

```
┌─────────────────┐     ┌─────────────────┐
│   Vercel Edge   │────▶│    Supabase     │
│   (Next.js)     │     │   PostgreSQL    │
└─────────────────┘     │   + Realtime    │
        │               └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Static Assets  │
│  (Vercel CDN)   │
└─────────────────┘
```

### Consequences
- Zero server management
- Auto-scaling for traffic spikes
- Preview deployments for testing
- Production URL stable

---

## ADR-009: Error Handling for Bids

**Status**: Proposed
**Date**: 2026-01-28

### Context
Bid submission is critical - must never silently fail.

### Strategy
1. **Optimistic UI**: Show bid immediately, revert on error
2. **Retry logic**: Auto-retry failed bids (up to 3 times)
3. **Conflict detection**: If outbid during submission, show warning
4. **Offline handling**: Queue bid, submit when back online
5. **Clear feedback**: Success/error states always visible

### Database Constraint
```sql
-- Ensure bid is higher than current
CHECK (amount > (SELECT current_highest_bid FROM prizes WHERE id = prize_id))
```

### Consequences
- Users always know bid status
- Race conditions handled at DB level
- No lost bids

---

## ADR-010: URL Structure

**Status**: Proposed
**Date**: 2026-01-28

### Bidder Routes
```
/                    # Landing page (QR destination)
/register            # Bidder registration
/prizes              # Prize listing
/prizes/[slug]       # Prize detail (slug for nice URLs)
/my-bids             # Personal bid history
/profile             # Edit registration info
```

### Admin Routes
```
/admin               # Login
/admin/dashboard     # Real-time overview
/admin/prizes        # Prize management
/admin/prizes/[id]   # Prize bids detail
/admin/bidders       # Bidder list
/admin/bidders/[id]  # Bidder detail
/admin/winners       # Winner management
/admin/export        # Data export
```

### Consequences
- Clean, memorable URLs
- Admin routes clearly separated
- Slugs for prizes (SEO-friendly, shareable)

---

## Open Questions

### Q1: Bid Confirmation UX
Should we require a two-step confirmation (tap bid → confirm amount → submit) or one-tap with undo?

**Proposed**: Two-step for bids over $10,000, one-tap for lower amounts.

### Q2: Auction End Time
Is there a hard cutoff time, or does admin manually close bidding?

**Proposed**: Admin manually closes (marks auction as "ended"), but show countdown if end time is set.

### Q3: Tie-Breaking
If two bids are identical amount, who wins?

**Proposed**: Earlier timestamp wins (first-come-first-served).

### Q4: Table Number Validation
Should we validate table numbers against a known list?

**Proposed**: No validation - free text entry. Admins can see and filter by table.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
