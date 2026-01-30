# RGS Silent Auction - Product Requirements Document

## Executive Summary

A mobile-first silent auction platform for the Royal Geographical Society Hong Kong's 30th Anniversary Gala Dinner. 150-200 guests will scan a QR code to register, browse 20+ luxury prizes, and place bids in real-time from their phones.

---

## Event Details

| Attribute | Value |
|-----------|-------|
| Event | RGS-HK 30th Anniversary Gala Dinner |
| Date | 28 February 2026 |
| Venue | Hong Kong Club |
| Expected Guests | 150-200 |
| Prize Count | ~20 items |
| Prize Range | HKD $3,000 - $85,000 |
| Admin Users | ~10 concurrent helpers |

---

## User Personas

### 1. Gala Guest (Bidder)
- Affluent professional or explorer
- Using personal smartphone (iPhone/Android)
- Limited time between dinner courses
- Wants quick, elegant bidding experience
- May not be tech-savvy

### 2. Event Helper (Admin)
- RGS volunteer or staff member
- Monitoring bids, answering questions
- Needs real-time visibility into all activity
- May need to help guests with bidding issues
- Will mark winners at end of evening

### 3. Auction Manager (Super Admin)
- Decides which bids to accept
- Can enable multi-winner mode
- Manages prize display order
- Has final say on winner selection

---

## Functional Requirements

### FR1: Bidder Registration

**FR1.1** Guest scans QR code and lands on registration page
**FR1.2** Registration collects: Full name, Email, Table number
**FR1.3** Registration validates email format
**FR1.4** System creates bidder record and sets cookie/session
**FR1.5** Returning visitors (same device) skip registration
**FR1.6** Guest can update their details from profile

### FR2: Prize Browsing

**FR2.1** Prize list shows card grid on mobile
**FR2.2** Each card displays: Image, Title, Current bid, Minimum bid
**FR2.3** Cards show "NEW BID!" indicator when updated (brief animation)
**FR2.4** Prizes can be filtered by category
**FR2.5** Prizes sorted by: Featured, Ending soon, Price (high/low)
**FR2.6** Tapping card opens full prize detail

### FR3: Prize Detail

**FR3.1** Hero image with swipe gallery (if multiple images)
**FR3.2** Full description with rich text formatting
**FR3.3** Donor acknowledgment
**FR3.4** Current highest bid (real-time)
**FR3.5** Minimum bid / minimum increment displayed
**FR3.6** "Place Bid" button prominently displayed
**FR3.7** Bid history (recent 5 bids, anonymized: "Table 12 - $15,000")
**FR3.8** Terms & conditions expandable section
**FR3.9** Valid until date displayed

### FR4: Bidding

**FR4.1** Tap "Place Bid" opens bid sheet
**FR4.2** Pre-filled with minimum valid bid (current + increment or minimum)
**FR4.3** Bidder can enter custom amount above minimum
**FR4.4** Confirmation step before submission
**FR4.5** Success state with confetti/celebration
**FR4.6** If outbid while bidding, show warning before submit
**FR4.7** Bid recorded with timestamp
**FR4.8** Current highest bid updates immediately for all viewers

### FR5: Outbid Notifications

**FR5.1** Real-time detection when user is outbid
**FR5.2** Visual indicator on prize card in list
**FR5.3** Toast notification if on different page
**FR5.4** "You've been outbid" badge on My Bids page
**FR5.5** Optional: Browser push notification (stretch goal)

### FR6: My Bids

**FR6.1** List of all prizes user has bid on
**FR6.2** Shows: Prize name, User's bid, Current high bid, Status
**FR6.3** Status: "Winning", "Outbid", "Won", "Lost"
**FR6.4** Quick "Bid Again" action for outbid items
**FR6.5** Total amount of winning bids displayed

### FR7: Admin Authentication

**FR7.1** Admin route requires password
**FR7.2** Password stored as environment variable
**FR7.3** Session persists for 24 hours
**FR7.4** Admin can log out

### FR8: Admin Dashboard

**FR8.1** Real-time feed of all bids (newest first)
**FR8.2** Summary cards: Total bids, Total value, Active bidders
**FR8.3** Prize status overview (bids per prize)
**FR8.4** Quick filters: Prizes with no bids, Hot prizes
**FR8.5** Search by bidder name or table

### FR9: Admin Prize Management

**FR9.1** View all prizes with bid counts
**FR9.2** See all bids for a prize (bidder name, table, amount, time)
**FR9.3** Multi-winner indicator for eligible prizes
**FR9.4** Mark bid as "Winner"
**FR9.5** Accept multiple winners if eligible
**FR9.6** Export bid data (CSV)

### FR10: Admin Bidder View

**FR10.1** List all registered bidders
**FR10.2** View bidder detail: name, email, table, all bids
**FR10.3** See total bid value per bidder
**FR10.4** Manual registration for walk-ins

### FR11: Winner Management

**FR11.1** View all marked winners
**FR11.2** Winner shows: Prize, Bidder, Amount, Time accepted
**FR11.3** Can un-mark a winner (admin correction)
**FR11.4** Generate winner summary for announcements

### FR12: Mock Payment (Stretch)

**FR12.1** Winner sees "Complete Payment" CTA
**FR12.2** Stripe-style checkout UI (mock)
**FR12.3** Shows prize details, amount, card form
**FR12.4** Fake submission with success state
**FR12.5** Payment status tracked (not actually charged)

---

## Non-Functional Requirements

### NFR1: Performance
- Page load < 2 seconds on 4G
- Real-time updates < 500ms latency
- Support 200 concurrent users

### NFR2: Mobile Experience
- Responsive design, mobile-first
- Touch-friendly tap targets (44px minimum)
- Works on iOS Safari, Chrome Android
- No horizontal scroll

### NFR3: Reliability
- 99.9% uptime during event (4-hour window)
- Graceful degradation if real-time fails
- Bid data never lost

### NFR4: Security
- HTTPS only
- Admin routes protected
- No PII exposed in URLs
- Rate limiting on bid submissions

### NFR5: Accessibility
- Sufficient color contrast
- Screen reader friendly
- Focus states visible

---

## Prize Categories

1. **Historic Items** - Maps, artifacts from RGS archives
2. **Experiences** - Courses, seminars, private events
3. **Travel** - Expeditions, luxury retreats, safaris
4. **Dining** - Private dinners, exclusive venues
5. **Pledges** - Charitable contributions

---

## Prize Data (Seed)

| # | Title | Min Bid (HKD) | Category | Multi-Winner |
|---|-------|---------------|----------|--------------|
| 1 | Historic Map: Canton River 1834 | $3,000 | Historic | No |
| 2 | Historic Map: Hong Kong 1845 | $4,000 | Historic | No |
| 3 | Historic Map: China Coast 1858 | $5,000 | Historic | No |
| 4 | Historic Map: Treaty Ports 1860 | $4,500 | Historic | No |
| 5 | Historic Map: Pearl River Delta 1880 | $6,000 | Historic | No |
| 6 | Historic Map: Victoria Harbour 1890 | $5,500 | Historic | No |
| 7 | Historic Map: Kowloon Peninsula 1898 | $3,500 | Historic | No |
| 8 | Private Cocktail Making Course (6-8) | $8,000 | Experiences | No |
| 9 | Firing the Noon-Day Gun + Champagne (40) | $48,000 | Experiences | No |
| 10 | HK Club Dinner for 12 with RGS Speaker | $28,000 | Dining | No |
| 11 | Seminar: Collecting Historic Maps (6-8) | $8,000 | Experiences | No |
| 12 | Seminar: Collecting Rare Books (6-8) | $8,000 | Experiences | No |
| 13 | Sailing on Jadalinkir for 12 | $15,000 | Experiences | No |
| 14 | WWII Airplane Archaeological Dig (6) | $15,000 | Experiences | No |
| 15 | RGS London Archives Tour (8) + Champagne | $25,000 | Travel | No |
| 16 | Kruger Safari for 2 (one week) | $70,000 | Travel | No |
| 17 | Great Wall of China Weekend for 2 | $30,000 | Travel | No |
| 18 | Tuscany Chianti Vineyard Week for 2 | $30,000 | Travel | Yes (7 rooms) |
| 19 | Lake Turkana Kenya Expedition for 2+ | $35,000 | Travel | No |
| 20 | Arctic Lapland Retreat for 2 (one week) | $85,000 | Travel | No |
| 21 | Swiss Alps Glacier Excursion (2-4) | $60,000 | Travel | No |
| 22 | Hakuba Japan Ski Chalet for 16 (one week) | $30,000 | Travel | No |
| 23 | Mandarin Oriental Ritz Madrid (3 nights) | $15,000 | Travel | No |
| 24 | Phuket + Khao Sok Jungle Safari for 2 | $18,000 | Travel | No |
| 25 | Mongolia Eagle Hunters Expedition for 2 | $60,000 | Travel | No |
| 26 | Schools Outreach Pledge - Bronze | $10,000 | Pledges | Yes (unlimited) |
| 27 | Schools Outreach Pledge - Silver | $20,000 | Pledges | Yes (unlimited) |
| 28 | Schools Outreach Pledge - Gold | $30,000 | Pledges | Yes (unlimited) |
| 29 | Schools Outreach Pledge - Platinum | $100,000 | Pledges | Yes (unlimited) |

---

## User Flows

### Flow 1: First-Time Bidder
```
QR Scan → Landing → Register → Prize List → Prize Detail → Place Bid → Confirmation → My Bids
```

### Flow 2: Returning Bidder
```
QR Scan → Prize List (auto-logged in) → Prize Detail → Place Bid → Confirmation
```

### Flow 3: Outbid Response
```
Browsing → Toast "Outbid on Safari!" → Tap toast → Prize Detail → Bid higher
```

### Flow 4: Admin Winner Selection
```
Login → Dashboard → Prize Detail → View Bids → Mark Winner → Confirm → Winner List
```

---

## Success Metrics

1. **Registration Rate**: >90% of guests register
2. **Bid Participation**: >50% of guests place at least one bid
3. **Technical**: Zero downtime during event
4. **Revenue**: Track total winning bid value vs. minimum bids

---

## Out of Scope (v1)

- Real payment processing
- Email confirmations
- SMS notifications
- Bidder messaging
- Auction countdown timers
- Reserve prices
- Proxy/auto bidding

---

## Timeline

| Phase | Deliverable | Target |
|-------|-------------|--------|
| Planning | PRD, Architecture | Done |
| Build | Core bidding flow | TBD |
| Build | Admin dashboard | TBD |
| Polish | Design refinement | TBD |
| Test | Load testing, QA | TBD |
| Deploy | Production on Vercel | Before 28 Feb 2026 |

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
