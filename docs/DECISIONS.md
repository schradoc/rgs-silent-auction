# Architecture Decisions Log

## ADR-001: Real-Time Technology

**Status**: Accepted
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

**Status**: Accepted
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

**Status**: Accepted
**Date**: 2026-01-28

### Context
Bidders need a frictionless onboarding (no passwords), while admins need secure access.

### Design (Evolved)

**Bidders:**
- Registration form (name, phone, email optional, table)
- Phone verified via SMS OTP (Twilio Verify)
- Email collected but not verified
- Session stored in localStorage + HTTP-only cookie
- Country code selector defaulting to HK (+852)

**Admins:**
- Individual accounts with bcrypt-hashed passwords (12 rounds)
- Role-based access (OWNER/ADMIN/EMPLOYEE)
- Token-based sessions with 24-hour expiry
- Rate-limited login (5 per 30 min per IP)

**Helpers:**
- 4-digit PIN authentication
- Rate-limited login (5 per 15 min per IP)
- Assigned to specific tables

**Committee:**
- Shared PIN (2026) for analytics dashboard
- Rate-limited (5 per 15 min per IP)

### Decision
Custom lightweight auth with SMS OTP for bidders, bcrypt passwords for admins, PINs for helpers/committee. Supabase Auth remains unused — custom auth fits the event-specific needs better.

### Consequences
- Bidders verify via their phone number (more reliable than email at an event)
- Admin accounts are individual with proper role separation
- Legacy SHA256 hashes auto-migrate to bcrypt on login
- All auth endpoints are rate-limited

---

## ADR-004: State Management

**Status**: Accepted
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

**Status**: Accepted
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

**Status**: Accepted
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

**Status**: Accepted
**Date**: 2026-01-28

### Context
Need high-quality images for ~29 prizes. Using placeholder/stock images for demo.

### Decision (Evolved)
- Store images in **Supabase Storage** (`prize-images` bucket, public access)
- Multi-image upload per prize via admin dashboard (drag-drop)
- Primary image flag (`isPrimary`) for listing views
- Branded no-image placeholder for lots without uploads
- Unsplash for any remaining placeholder imagery
- Fallback gradient if image fails to load

### Consequences
- Images stored in cloud (Supabase Storage), not bundled with app
- Admin can upload/manage images directly via dashboard
- `PrizeImage` model supports multiple images per prize with ordering
- `SUPABASE_SECRET_KEY` env var required for uploads

---

## ADR-008: Deployment Architecture

**Status**: Accepted
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

**Status**: Accepted
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

**Status**: Accepted
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

## Resolved Questions

### Q1: Bid Confirmation UX
**Resolved**: Two-step confirmation for all bids (bid sheet → confirm). Pre-submit validation re-fetches current price to catch outbids.

### Q2: Auction End Time
**Resolved**: Admin manually controls via state machine (DRAFT → TESTING → PRELAUNCH → LIVE → CLOSED). All transitions allowed. Optional end time for countdown display.

### Q3: Tie-Breaking
**Resolved**: Earlier timestamp wins (first-come-first-served). `SELECT FOR UPDATE` serializes concurrent bids.

### Q4: Table Number Validation
**Resolved**: Free text entry. Helpers can be assigned to specific tables via `assignedTables` field.

---

## ADR-011: SMS-Only Verification

**Status**: Accepted
**Date**: 2026-02-27

### Context
At a gala dinner, guests checking email on their phones is friction. SMS OTP is faster and more reliable in the venue.

### Decision
Phone number is the primary identity. Verified via Twilio Verify SMS OTP. Email is collected but not verified — used only for post-event follow-up notifications.

### Consequences
- Registration requires phone number with country code (defaults to HK +852)
- OTP sent via SMS, not email
- Email is optional field, not verified
- Twilio Verify Service SID required in env vars

---

## ADR-012: Visual Block Editor for Descriptions

**Status**: Accepted
**Date**: 2026-02-27

### Context
Admin lot descriptions needed rich formatting (headings, lists, highlights) but a full WYSIWYG editor is overkill for this use case.

### Decision
Custom block-based editor in admin (`description-editor.tsx`) with a companion renderer (`rich-description.tsx`). Descriptions stored as structured text with section tags. Insert toolbar provides templates for common blocks.

### Consequences
- Descriptions support headings, paragraphs, bullet lists, highlights
- Rendered on lot detail pages with consistent styling
- No external rich text editor dependency

---

## ADR-013: Helper Table Intelligence

**Status**: Accepted
**Date**: 2026-02-28

### Context
Helpers (table runners) need to focus on their assigned tables, not wade through all bids.

### Decision
`Helper` model has `assignedTables` field (comma-separated table numbers). Helper dashboard restructured around table awareness — shows bids and activity for their tables first.

### Consequences
- Helpers see their tables' activity prominently
- Admin assigns tables when creating helpers
- Dashboard filters and sorts by assigned tables

---

## ADR-014: Lot Numbering System

**Status**: Accepted
**Date**: 2026-02-27

### Context
Prizes needed a display ordering system that matches the printed brochure. Some prizes have sub-lots (e.g., "Lot 3a", "Lot 3b").

### Decision
Added `lotNumber` (Int?) and `subLotLetter` (String?) to Prize model. Lots sorted by lotNumber with nulls last. Sub-lot letters for variants under a parent prize.

### Consequences
- Display order matches brochure
- Prizes without lot numbers sort to end
- Supports parent/variant grouping (e.g., map collection as Lot 3a-3g)

---

**Document Version**: 2.0
**Last Updated**: 2026-02-28
