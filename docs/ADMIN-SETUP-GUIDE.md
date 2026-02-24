# RGS Silent Auction — Admin Setup Guide

**For: Rupert and the RGS Committee**
**Event: 28 February 2026 — Hong Kong Club**
**Production URL: https://rgsauction.com**

---

## Getting Started

### Accessing the Admin Panel

1. Go to **https://rgsauction.com/admin/login**
2. Enter your admin email address
3. Click the magic link sent to your inbox (check spam if needed)
4. You'll be taken to the admin dashboard

> **Important:** Always use **rgsauction.com** — not rgs-auction.vercel.app. The Vercel URL is for development only.

---

## Admin Dashboard Overview

The dashboard has 6 tabs:

| Tab | Purpose |
|-----|---------|
| **Overview** | Live stats, recent bids, analytics |
| **Prizes** | Add/edit/deactivate prizes |
| **Bidders** | View all registered bidders and their bids |
| **Winners** | Confirm winners after auction closes |
| **Helpers** | Manage event helpers (table runners) |
| **Settings** | Auction state, display settings, team management |

> **Tip:** There's a Help/Docs link in the admin header bar that takes you to the full documentation page.

---

## Key Setup Tasks

### 1. Add Admin Users

Go to **Settings > Team Management** to invite other admins:

- Enter their email and select a role:
  - **Admin** — full access (for committee leads)
  - **Employee** — limited access (cannot change auction state)
- They'll receive an email invitation to join

### 2. Add Helpers

Helpers are the table runners who assist guests with bidding.

Go to the **Helpers** tab:
1. Click **Add Helper**
2. Enter the helper's name
3. Set a 4-digit PIN (e.g., 1234)
4. Share the PIN with them

Helpers log in at **https://rgsauction.com/helper** using their PIN. They can:
- Submit bids on behalf of guests
- Scan paper bid sheets
- See which guests have been outbid (so they can alert them)
- View table-level activity

### 3. Review Prizes

Go to the **Prizes** tab to check all prizes are correct:

- **Title, description, donor name** — verify accuracy
- **Minimum bid** — the starting bid amount in HKD
- **Category** — Historic Items, Experiences, Travel, Dining, or Pledges
- **Multi-winner slots** — for prizes with multiple winners (e.g., "5 slots" means 5 people can win)
- **Images** — upload clear photos
- **Active status** — only active prizes appear to bidders

To edit a prize, click on it in the list.

#### Multi-Winner Prizes
Some prizes allow multiple winners (e.g., a dinner for multiple tables). Set:
- **Multi-winner eligible** = Yes
- **Multi-winner slots** = number of winners allowed

When all slots are filled, new higher bids will outbid the lowest current winner.

#### Pledges
Pledge items (category: PLEDGES) work differently — every bid is accepted and there's no outbidding. Use this for donation tiers.

### 4. Manage Auction State

Go to **Settings > Auction Management**. The recommended event night flow:

```
PRELAUNCH  →  LIVE  →  CLOSED
```

| State | What happens |
|-------|-------------|
| **PRELAUNCH** | Guests can browse prizes but cannot bid. Use this for the early part of the evening. |
| **LIVE** | Bidding is open. Guests can place bids on all active prizes. |
| **CLOSED** | Bidding stops. No new bids accepted. You can now confirm winners. |

> **Flexible transitions:** You can switch between any states at any time. Need to go back from LIVE to PRELAUNCH? No problem. Re-open a CLOSED auction? That works too. You'll never get stuck.

**On event night:**
1. Start in **PRELAUNCH** — guests arrive, scan QR, browse prizes
2. When the MC announces bidding is open, switch to **LIVE**
3. When the MC announces bidding is closed, switch to **CLOSED**
4. Head to the **Winners** tab to confirm winners

### 5. Committee Analytics

A live analytics dashboard is available for committee members to monitor the auction in real time.

- **URL**: https://rgsauction.com/committee
- **PIN**: `2026`
- **Link in admin panel**: Settings > Support section

The analytics page shows:
- **Total raised**, active bidders, total bids (animated counters)
- **Live bid feed** — last 10 bids as they come in
- **Prize leaderboard** — top prizes by current bid amount
- **Cold prizes** — prizes with 0 or few bids (the ones the MC should promote!)
- **Table leaderboard** — tables ranked by total value (fun competition)
- **Category breakdown** — how each category is performing
- **Bid timeline** — hourly bid activity chart

Works on both **mobile** (with tab navigation) and **desktop** (3-column layout). Auto-refreshes every 5 seconds.

Share the URL and PIN with committee members before the event so they can monitor from their phones.

---

## After the Auction Closes

### Confirming Winners

1. Go to the **Winners** tab
2. You'll see every prize with its leading bidder(s)
3. For each winner:
   - Click **Confirm & Notify** to confirm and send them a notification
   - Or click **Confirm Only** to confirm without notification
4. You can also use **Confirm All** to batch-confirm everyone at once

#### Runner-Ups (Next in Line)
Below each prize's winners, you'll see **"Next in line"** — these are the runner-up bidders. If a winner withdraws or can't pay, you can manually contact the next person using their displayed contact details (name, table, phone, email).

### Exporting Data

Go to **Settings > Data & Export** to download:
- All bids (CSV)
- All bidders (CSV)
- Winner list (CSV)

---

## Important Notes

### Production vs Staging
- **Production** (rgsauction.com) has its own separate database
- Any changes on staging/development do NOT affect production
- Always make final changes on the production admin panel

### Data Safety
- The database is hosted on Supabase with automatic backups
- Code deployments do not affect your data — prizes, bids, and bidders are safe
- If you need to restore data, contact Chris

### QR Codes
- QR codes at the event should point to **https://rgsauction.com**
- Guests scan, register with their name and phone/email, and start bidding
- No app download required — it works in the mobile browser

### Troubleshooting

| Issue | Solution |
|-------|---------|
| Can't log in | Check spam folder for magic link. Links expire after 15 minutes. |
| Guest can't bid | Verify auction state is **LIVE** in Settings. |
| Prize not showing | Check the prize is **Active** in the Prizes tab. |
| Helper can't log in | Verify their PIN in the Helpers tab. Make sure they're at /helper. |
| Need to go back to a previous state | All state transitions are allowed — just pick the state you need in Settings. |
| Committee can't access analytics | Go to /committee and enter PIN `2026`. |

---

## Contact

For technical issues on event night, contact **Chris Schrader** directly.
