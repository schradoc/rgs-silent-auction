# RGS Silent Auction — Event Night QA Prompt

> **Purpose**: Paste this prompt into a fresh Claude session (with AGENT-CONTEXT.md) to run a comprehensive QA pass on the live production site before the event starts.
> **Created**: 2026-02-28, ~4 hours before doors open
> **Production URL**: https://rgsauction.com
> **Supabase Project**: tartdrhbhbumzfrbqabt (ap-northeast-1)

---

## Your Role

You are simultaneously:

1. **A very senior Product Manager** who has spent weeks living inside this product. You understand every user journey intimately — especially the **bidder** experience (guests at a gala dinner scanning QR codes on their phones) and the **helper** experience (table runners facilitating bids for guests who need assistance). You think in terms of: "What will a slightly tipsy guest at a formal dinner, holding a champagne glass in one hand and their phone in the other, actually experience when they try to bid?" You also deeply understand the admin and committee workflows.

2. **A world-class staff engineer** with deep expertise in Next.js, PostgreSQL, real-time systems, and production reliability. You think about race conditions, error boundaries, reconnection logic, rate limiting edge cases, and what happens when 150 phones hit the same endpoint simultaneously over Hong Kong Club's WiFi.

Your mission: **Walk through every critical path on the live production site (https://rgsauction.com) and ensure everything works flawlessly before 150-200 guests arrive tonight.** The developer (Chris, COO) needs to relax and enjoy the evening knowing everything has been tested.

---

## Context

- **Event**: RGS Hong Kong 30th Anniversary Gala Dinner
- **Venue**: Hong Kong Club, Hong Kong
- **Date**: Tonight, 28 February 2026
- **Guests**: 150-200 affluent attendees
- **32 prizes** ("lots") ranging HKD $3,000 - $100,000 across categories: Historic Items, Experiences, Travel, Dining, Pledges
- **Auction flow**: PRELAUNCH (guests arrive, browse) → LIVE (MC announces, bidding opens) → CLOSED (MC announces, bidding stops) → Winners confirmed
- **Primary device**: Mobile phones (guests scan QR codes at tables)
- **Tech**: Next.js 16.1.6, Supabase (PostgreSQL + Realtime), Twilio Verify (SMS OTP), Resend (email), Vercel

---

## Connected Services Required

Before starting, ensure you have:
- [ ] **Vercel** MCP connected (to check deployment status, build logs, runtime logs)
- [ ] **Supabase** MCP connected (to query production database, check tables, run SQL)
- [ ] **Browser automation** available (to walk through the actual production site)
- [ ] Access to the codebase at the project folder (for reading source code)

---

## Phase 1: Infrastructure Health Check (Staff Engineer Hat)

### 1.1 Production Deployment Status
- Check Vercel deployment status for `rgs-auction` project — is the latest deployment successful?
- Check build logs for any warnings
- Verify the custom domain `rgsauction.com` is resolving correctly

### 1.2 Database Health
- Hit `https://rgsauction.com/api/health` — verify `status: ok`, database connected, latency < 100ms
- Query Supabase to confirm:
  - How many prizes exist and are active? (Should be 32)
  - How many have images uploaded? (Should be ~49 images across prizes)
  - Are there any bidders already registered? (Expected: test data from earlier)
  - What is the current auction state? (Should be LIVE or PRELAUNCH)
  - Are all 5 helpers created and active?
  - Are admin users created?

### 1.3 Security Headers
- Fetch the production homepage and verify response headers include:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`

### 1.4 Supabase Realtime
- Verify the Supabase project is healthy and realtime is enabled
- Check that the `prize-images` storage bucket exists and is public

---

## Phase 2: Bidder Journey — Full Flow Testing (PM Hat)

This is the most critical path. Walk through it exactly as a guest would tonight.

### 2.1 QR Code Landing → Registration
1. Navigate to `https://rgsauction.com` on a mobile viewport
2. Verify the landing page loads with hero section and clear CTA
3. Click "Register" / "Start Bidding" (whatever the CTA says)
4. On the registration page:
   - Verify the phone input defaults to HK (+852) country code
   - Verify country code selector works (search, scroll)
   - Enter a test name, phone number, optional email, table number
   - Submit registration
5. Verify SMS OTP is sent (check Twilio logs or Supabase for the OTP)
6. Enter the OTP code
7. Verify successful verification redirects to welcome page or prize listing

**Edge cases to test:**
- What happens if you enter an invalid phone number format?
- What happens if you enter a wrong OTP code?
- What if the OTP expires (15 min)?
- Can you register with just a phone number (no email)?
- What happens if you try to register with a phone number that's already registered?

### 2.2 Browse Lots
1. Navigate to `/prizes` (lot listing page)
2. Verify all 32 active lots are visible
3. Verify lot numbering is displayed (Lot 1, Lot 2, Lot 3a, 3b, etc.)
4. Test category filters (Historic Items, Experiences, Travel, Dining, Pledges)
5. Test price tier filters
6. Verify images load (or branded placeholders appear for lots without images)
7. Verify the lot cards show: title, donor name, minimum bid / current bid, category badge
8. If auction is in PRELAUNCH, verify a banner says bidding hasn't opened yet

### 2.3 Lot Detail Page
1. Click into a lot detail page (e.g., a Travel lot with images)
2. Verify:
   - Image gallery works (if multiple images)
   - Rich description renders correctly (headings, paragraphs, highlights, lists)
   - Current highest bid is displayed
   - Minimum bid / next minimum bid is clear
   - Donor name is shown
   - Lot number is shown
   - "Place Bid" button is visible (or disabled if PRELAUNCH)

### 2.4 Place a Bid (CRITICAL PATH)
1. Ensure auction state is LIVE
2. On a lot detail page, click "Place Bid"
3. Verify the bid sheet appears with:
   - Current highest bid
   - Minimum next bid (based on tiered increment: $500 for bids under $10k, $1,000 for $10k-$30k, etc.)
   - Input field for bid amount
4. Enter a valid bid amount
5. Verify two-step confirmation: bid sheet → confirm dialog
6. Submit the bid
7. Verify:
   - Success toast notification
   - Bid amount updates on the page in real-time
   - The bid appears in "My Bids" (`/my-bids`)

**Edge cases:**
- Try bidding below the minimum increment — should be rejected with clear message
- Try bidding on the same lot twice — should work (overbid yourself)
- If someone else bids higher, do you see the update in real-time? (Test with two browser tabs)
- What happens if you try to bid when auction is CLOSED?

### 2.5 Outbid Experience
1. With two different registered bidders (two browser tabs/profiles):
   - Bidder A places a bid on Lot X
   - Bidder B places a higher bid on Lot X
   - Verify Bidder A receives an outbid notification (SMS and/or in-app)
   - Verify Bidder A's bid status changes to OUTBID in their My Bids page
   - Verify the lot detail page updates in real-time for both bidders

### 2.6 Multi-Winner Lots
1. Find a lot that is multi-winner eligible (check in admin)
2. Have multiple bidders bid on it
3. Verify the UI doesn't reveal multi-winner status to bidders (they should see normal auction UI)
4. Verify from admin perspective that multiple winner slots are tracked

### 2.7 Pledge Lots
1. Navigate to a pledge lot (category: PLEDGES)
2. Verify that the UI communicates pledges work differently (every bid is accepted, no outbidding)
3. Place a pledge bid
4. Verify no one gets "outbid" on pledge items

### 2.8 My Bids & Favorites
1. Visit `/my-bids` — verify all placed bids are listed with correct statuses
2. Visit `/favorites` — verify watchlist functionality works
3. Test adding/removing favorites

### 2.9 Mobile UX Audit (PM Hat — CRITICAL)
Run all of the above on a **mobile viewport** (375px wide, simulating iPhone). Pay special attention to:
- Touch targets: Are buttons large enough to tap with a thumb?
- Text readability: Can you read lot titles and bid amounts at a glance?
- Scroll behavior: Does the lot listing scroll smoothly?
- Filter bar: Do the category/price filters work on mobile? (Pill wrapping, hidden scrollbar)
- Bid confirmation: Is the confirm dialog easy to tap "Confirm" without accidentally dismissing?
- Navigation: Can you easily get back to the lot listing from a detail page?
- Header: Is the shared site header visible and functional?

---

## Phase 3: Helper Journey Testing (PM Hat)

Helpers are table runners who assist guests. Their experience must be **fast and foolproof** — they're doing this while standing, moving between tables, in a noisy room.

### 3.1 Helper Login
1. Navigate to `https://rgsauction.com/helper`
2. Enter a valid 4-digit PIN (check admin dashboard for helper PINs)
3. Verify successful login takes you to helper dashboard

**Edge cases:**
- Wrong PIN → clear error message
- Try 6 incorrect PINs → should be rate-limited (5 per 15 min per IP)

### 3.2 Helper Dashboard
1. Verify the dashboard shows:
   - Helper's name and assigned tables
   - Activity feed for their assigned tables
   - Bid leaderboard
   - Quick action to submit a bid
2. Test that table-intelligence filtering works — helper only sees their tables' activity prominently

### 3.3 Helper Bid Submission
1. Navigate to bid submission page (`/helper/submit-bid`)
2. Submit a bid on behalf of a guest:
   - Select the bidder (from registered guests)
   - Select the lot
   - Enter bid amount
   - Confirm and submit
3. Verify:
   - The bid is recorded with the helper's ID attached
   - The bidder sees the bid in their My Bids
   - Real-time updates work

### 3.4 Helper for Multi-Winner Lots
1. Have a helper submit a bid on a multi-winner lot
2. Verify the multi-winner bug fix is working (this was a critical fix on Feb 28)

---

## Phase 4: Admin Journey Testing (Staff Engineer Hat)

### 4.1 Admin Login
1. Navigate to `https://rgsauction.com/admin/login`
2. Login with admin credentials
3. Verify redirect to admin dashboard

### 4.2 Admin Dashboard — Overview Tab
1. Verify live stats display: total prizes, total bidders, total bids, total value raised
2. Verify analytics charts load: bid activity chart, top prizes, category performance
3. Verify live bid feed updates in real-time

### 4.3 Admin Dashboard — Prizes Tab
1. Verify all 32 prizes are listed
2. Click into a prize — verify detail modal shows:
   - Stats grid (current bid, total bids, unique bidders)
   - Full bid history with bidder names, tables, amounts
   - Images (if uploaded)
3. Test editing a prize (change a non-critical field, then revert)
4. Verify active/inactive toggle works

### 4.4 Admin Dashboard — Settings Tab
1. **Auction State Machine**: Verify you can transition between states:
   - Try: LIVE → PRELAUNCH → LIVE (verify bidding stops and resumes)
   - Try: LIVE → CLOSED → LIVE (verify reopening works)
   - **DO NOT leave it in CLOSED** — set back to LIVE (or whatever state it should be pre-event)
2. **Display Settings**: Check donor name visibility, bidder name visibility, rotation interval
3. **Team Management**: Verify admin user list and invitation system
4. **Data Export**: Test CSV export for bids, bidders, winners

### 4.5 Admin Dashboard — Winners Tab
1. If there are any test bids, check the winners tab
2. Verify the "Confirm & Notify" and "Confirm Only" buttons are visible
3. Verify runner-up display (next in line)
4. **DO NOT confirm any real winners yet**

### 4.6 Admin Dashboard — Helpers Tab
1. Verify all 5 helpers are listed and active
2. Verify assigned tables are shown for each helper
3. Test adding a helper (then deactivate/delete if you don't want to keep it)

---

## Phase 5: Committee Analytics Testing (PM Hat)

### 5.1 Committee Login
1. Navigate to `https://rgsauction.com/committee`
2. Enter PIN: `2026`
3. Verify access to analytics dashboard

### 5.2 Analytics Dashboard Content
1. Verify the dashboard shows:
   - Total raised (animated counter)
   - Active bidders count
   - Total bids count
   - Live bid feed (last 10 bids)
   - Prize leaderboard (top prizes by current bid)
   - Cold prizes (0 or few bids — the ones MC should promote)
   - Table leaderboard
   - Category breakdown
   - Bid timeline chart
2. Verify auto-refresh (every 5 seconds)
3. Test on mobile viewport — verify tab navigation works

---

## Phase 6: Real-Time & Connectivity Testing (Staff Engineer Hat)

### 6.1 Real-Time Bid Updates
1. Open the lot listing in two browser tabs (different bidders)
2. Place a bid in Tab A
3. Verify Tab B sees the updated bid amount within 1-2 seconds
4. Verify admin dashboard also updates in real-time

### 6.2 Connection Resilience
1. Simulate a brief disconnection (can be done by throttling network in browser dev tools)
2. Verify the connection status banner appears ("Reconnecting...")
3. Verify reconnection happens automatically
4. Verify that after reconnection, data is fresh (not stale)

### 6.3 Concurrent Bid Race Condition
- This was already load-tested (20 concurrent bids → exactly 1 winner), but it's worth a quick verification:
1. From the Supabase MCP, run a query to check that `SELECT FOR UPDATE` is being used in the bid endpoint
2. Alternatively, read the source of `src/app/api/bids/route.ts` and verify the transaction with row locking is intact

---

## Phase 7: Edge Cases & Error Handling (Staff Engineer Hat)

### 7.1 Rate Limiting
- Verify rate limits are in place by checking the source code for:
  - Helper login: 5 per 15 min per IP
  - Auth verify: 5 per 15 min per email
  - Admin login: 5 per 30 min per IP
  - Committee login: 5 per 15 min per IP
  - Bid placement: 10 per min per bidder

### 7.2 Error Boundaries
- Try navigating to a non-existent lot (e.g., `/prizes/this-does-not-exist`)
- Verify a friendly error page is shown, not a white screen
- Try navigating to `/admin/dashboard` without being logged in — verify redirect to login

### 7.3 Auction State Enforcement
- When auction is in PRELAUNCH:
  - Can bidders browse lots? (YES)
  - Can bidders place bids? (NO — should be blocked with clear message)
- When auction is CLOSED:
  - Can bidders place bids? (NO)
  - Can admins still confirm winners? (YES)

### 7.4 Fail-Closed Behavior
- The auction status endpoint should return `isAuctionOpen: false` if the database is unreachable
- Verify this by reading `src/app/api/auction-status/route.ts`

---

## Phase 8: Unit Tests (Staff Engineer Hat)

### 8.1 Run Existing Tests
```bash
npm test
```

Existing test suites (11 files):
- `auth-verify.test.ts` — Verification code validation
- `rate-limit.test.ts` — Rate limiter behavior
- `auction-status.test.ts` — Fail-closed behavior
- `bids.test.ts` — Bid placement logic
- `prizes.test.ts` — Prize listing
- `profile-auction-state.test.ts` — Profile with auction state
- `registration.test.ts` — Bidder registration
- `notifications-fallback.test.ts` — Notification fallback logic
- `notifications.test.ts` — Notification sending
- `phone-validation.test.ts` — Phone number validation
- `utils.test.ts` — Utility functions

### 8.2 Verify All Tests Pass
- If any tests fail, investigate and report the failure
- Do NOT fix tests without Chris's approval — the event is in 4 hours

---

## Phase 9: Vercel Runtime Logs (Staff Engineer Hat)

### 9.1 Check for Errors
- Use Vercel MCP to pull recent runtime logs for the `rgs-auction` project
- Filter for `error` and `warning` level logs
- Report any concerning patterns (e.g., repeated 500s, database timeouts, rate limit hits)

### 9.2 Check Recent Deployment
- Verify the latest deployment is healthy
- Check if there were any failed deployments recently

---

## Phase 10: Pre-Event Readiness Checklist

After completing all tests, produce a final readiness report:

### Must-Haves (Block the Event if Failing)
- [ ] Production site loads on mobile (rgsauction.com)
- [ ] Registration → SMS OTP → Browse → Bid flow works end-to-end
- [ ] Bids update in real-time across multiple devices
- [ ] Admin can change auction state (PRELAUNCH → LIVE → CLOSED)
- [ ] Helper bid submission works
- [ ] All security headers present
- [ ] Health endpoint returns OK with DB connected
- [ ] Rate limiting is active on all auth endpoints

### Should-Haves (Degraded Experience if Missing)
- [ ] Committee analytics dashboard loads
- [ ] All 32 lots have images or branded placeholders
- [ ] Category and price filters work on mobile
- [ ] Outbid SMS notifications are being sent
- [ ] Error boundaries catch and display friendly errors

### Nice-to-Haves (Polish)
- [ ] Rich descriptions render beautifully on mobile
- [ ] Lot numbering matches brochure order
- [ ] Country code selector defaults to HK +852
- [ ] Helper dashboard shows table intelligence correctly

---

## UX/UI Improvement Notes

As you test, note any UX/UI issues you spot, categorized as:

1. **Critical** (must fix before event): Anything that blocks bidding, registration, or creates confusion
2. **Important** (fix if time allows): UX friction, confusing labels, visual glitches
3. **Polish** (post-event): Minor visual improvements, nice-to-haves

For each issue, provide:
- What you observed
- Where (URL / component)
- Screenshot description
- Suggested fix
- Estimated effort (quick fix vs. significant change)

---

## Ground Rules

1. **DO NOT make any code changes** without explicit approval from Chris
2. **DO NOT confirm any real winners** in the Winners tab
3. **DO NOT change the auction state** without setting it back (or confirming with Chris first)
4. When testing registration/bidding, use clearly labeled test data (e.g., name "QA Test Bidder")
5. **Report everything** — even small issues. Better to flag something minor now than discover it with 200 guests.
6. If you find a **critical issue**, immediately flag it with a clear description and suggested fix
7. Prefer reading source code over making production changes
8. When querying the database, use read-only queries only

---

## Output Format

Produce your findings as a structured report with:

1. **Executive Summary** — 3-5 sentences on overall readiness
2. **Phase-by-Phase Results** — Pass/Fail for each test with details on failures
3. **Issues Found** — Categorized as Critical / Important / Polish
4. **Readiness Verdict** — GO / NO-GO / CONDITIONAL GO (with conditions)
5. **Recommended Actions** — Prioritized list of anything to fix before doors open

---

*Good luck. The developer has been building this for a month. 200 guests are counting on a seamless experience tonight. Let's make sure Chris can enjoy the evening.*
