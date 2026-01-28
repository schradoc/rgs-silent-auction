# Phase 2: Event Night Features - Implementation Plan

## Overview
Transform the auction into a fully-featured event experience with helper gamification, paper bid support, real-time notifications, and a live display for maximum engagement.

---

## 1. Helper System & Gamification

### Database Changes
```prisma
model Helper {
  id          String   @id @default(cuid())
  name        String
  pin         String   // Simple 4-digit PIN for quick login
  avatarColor String   // For visual identification
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  bidsPrompted Bid[]   // Bids this helper facilitated
  paperBids    PaperBid[]
}

// Add to Bid model:
helperId    String?
helper      Helper?  @relation(fields: [helperId], references: [id])
isPaperBid  Boolean  @default(false)
```

### Features
- **Helper Login**: Simple PIN-based login (e.g., `/helper`)
- **Helper Dashboard** (mobile-first):
  - Their personal stats (bids prompted, total value)
  - Quick "Submit Bid" button
  - Live leaderboard showing all helpers
  - Notifications when their bidders get outbid
- **Leaderboard Metrics**:
  - Total bids prompted
  - Total value of bids
  - Number of unique bidders helped
  - "Streak" - consecutive bids without being outbid

### Routes
- `/helper` - Helper login
- `/helper/dashboard` - Personal dashboard with leaderboard
- `/helper/submit-bid` - Quick bid submission for guests

---

## 2. Paper Bid System with OCR

### Paper Form Design (for printing)
```
┌─────────────────────────────────────┐
│     RGS-HK SILENT AUCTION BID       │
│                                     │
│  TABLE NUMBER: [____]               │
│                                     │
│  NAME: _________________________    │
│                                     │
│  PRIZE #: [____]                    │
│  (See prize number on display)      │
│                                     │
│  BID AMOUNT: HK$ ______________     │
│                                     │
│  EMAIL (optional): ____________     │
│  PHONE (optional): ____________     │
│                                     │
│  ☐ Notify me if outbid (check)     │
└─────────────────────────────────────┘
```

### OCR Integration
- Use **Tesseract.js** for client-side OCR (free, no API needed)
- Helper takes photo → extracts fields → confirms/edits → submits
- Fallback: Manual entry form

### Database Changes
```prisma
model PaperBid {
  id           String   @id @default(cuid())
  imageUrl     String?  // Stored photo of paper bid
  tableNumber  String
  bidderName   String
  prizeId      String
  amount       Int
  email        String?
  phone        String?
  notifyIfOutbid Boolean @default(false)

  processedAt  DateTime @default(now())
  helperId     String
  helper       Helper   @relation(fields: [helperId], references: [id])

  // Links to actual bid once processed
  bidId        String?  @unique
  bid          Bid?     @relation(fields: [bidId], references: [id])
}
```

### Flow
1. Helper opens camera → takes photo of paper bid
2. OCR extracts: Table #, Name, Prize #, Amount
3. Helper reviews/corrects extracted data
4. System finds or creates bidder by table + name
5. Bid is placed with `isPaperBid: true`
6. Paper bidders notified via helper if outbid

---

## 3. Live Display (Projector)

### Route: `/live`

### Design Concept: "The Pulse of the Auction"
A dark, dramatic display that creates FOMO and excitement.

### Sections (rotating/animated):

**Hero Stats** (always visible):
- Total Raised: `HK$892,000` (animated counter)
- Active Bidders: `47`
- Minutes Until Close: `47:32`

**Live Feed** (main content, rotates):
1. **Recent Bids** - "Table 7 just bid HK$50,000 on Kruger Safari!"
2. **Hot Items** - Prizes with most activity in last 10 min
3. **Leaderboard** - Top 5 tables by total bid value
4. **Featured Prize** - Large image + current bid + "Bid Now!"
5. **Helper Leaderboard** - Gamification visible to all

### Visual Elements
- Dark background (#0f1d2d)
- Gold accents for bids/money
- Smooth animations between sections
- Subtle particle effects
- QR code in corner linking to `/prizes`

---

## 4. Notification System (Twilio)

### Channels
1. **Email** (SendGrid/Resend) - Free tier available
2. **SMS** (Twilio) - ~$0.01/message
3. **WhatsApp** (Twilio) - ~$0.005/message

### Notification Types
- `OUTBID` - Someone bid higher on your prize
- `WINNING` - You're currently winning (periodic reminder)
- `AUCTION_CLOSING` - 30/15/5 min warnings
- `WON` - Congratulations, you won!

### Database Changes
```prisma
model Bidder {
  // Add fields:
  phone            String?
  whatsappOptIn    Boolean @default(false)
  smsOptIn         Boolean @default(false)
  emailOptIn       Boolean @default(true)
  notificationPref NotificationChannel @default(EMAIL)
}

enum NotificationChannel {
  EMAIL
  SMS
  WHATSAPP
}

model Notification {
  id          String   @id @default(cuid())
  type        NotificationType
  channel     NotificationChannel
  bidderId    String
  bidder      Bidder   @relation(fields: [bidderId], references: [id])
  prizeId     String?
  message     String
  sentAt      DateTime @default(now())
  delivered   Boolean  @default(false)
  error       String?
}

enum NotificationType {
  OUTBID
  WINNING
  AUCTION_CLOSING
  WON
}
```

### Bid-by-Reply (Advanced)
- Twilio webhooks receive SMS/WhatsApp replies
- Parse: "BID 50000" or just "50000"
- Confirm via reply, then place bid

---

## 5. Passwordless Auth

### Methods
1. **Email Magic Link** - Click link, logged in
2. **SMS OTP** - 6-digit code via text
3. **WhatsApp OTP** - 6-digit code via WhatsApp

### Flow
1. User enters email or phone
2. System sends magic link/OTP
3. User clicks link or enters code
4. Session created, user logged in

### Database Changes
```prisma
model Bidder {
  // Add:
  magicLinkToken    String?
  magicLinkExpires  DateTime?
  otpCode           String?
  otpExpires        DateTime?
}
```

---

## 6. Pre-Event Features

### Editable Profile
- Table number (can update on arrival)
- Notification preferences
- Contact info

### Watchlist/Favorites
```prisma
model Favorite {
  id        String   @id @default(cuid())
  bidderId  String
  bidder    Bidder   @relation(fields: [bidderId], references: [id])
  prizeId   String
  prize     Prize    @relation(fields: [prizeId], references: [id])
  createdAt DateTime @default(now())

  @@unique([bidderId, prizeId])
}
```

### Pre-Event Mode
- Countdown to auction opening
- Browse prizes, add to watchlist
- Cannot bid until auction opens
- "Get notified when auction starts"

---

## Implementation Order

### Phase 2a: Core Event Features (Do First)
1. ✅ Schema updates (Helper, PaperBid, Favorite, Notification)
2. ✅ Helper login & dashboard
3. ✅ Helper leaderboard
4. ✅ Live display page

### Phase 2b: Paper Bids & Notifications
5. ✅ Paper bid form (manual entry first)
6. ✅ OCR integration
7. ✅ Email notifications
8. ✅ SMS/WhatsApp notifications (Twilio)

### Phase 2c: Auth & UX Polish
9. ✅ Magic link auth
10. ✅ SMS/WhatsApp OTP
11. ✅ Profile editing
12. ✅ Watchlist/favorites
13. ✅ Pre-event countdown mode

---

## Technical Notes

### Environment Variables Needed
```env
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=

# Email (Resend recommended)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://rgs-auction.vercel.app
```

### Mobile Optimization Checklist
- [ ] All pages tested on iPhone/Android
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scroll
- [ ] Fast load times (<3s)
- [ ] Camera access for OCR
- [ ] Offline-friendly (show cached data)

---

## Questions Resolved
- Helpers: 10 helpers with individual PIN logins
- Paper form: Custom form designed for OCR
- Notifications: Twilio for SMS/WhatsApp, approved
- Live display: Behavioral psychology approach - FOMO, social proof, urgency

---

Ready to implement? Start with Phase 2a.
