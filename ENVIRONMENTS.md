# RGS Auction — Environment Setup

## Strategy: Single Vercel Project with Custom Domain

One Vercel project (`rgs-auction`) deploys from the `main` branch with a custom domain for production.

| | Development | Production |
|---|---------|------------|
| **Vercel Project** | `rgs-auction` | `rgs-auction` (same) |
| **URL** | rgs-auction.vercel.app | rgsauction.com |
| **Purpose** | Testing, preview deployments | Live event — real bidders |
| **Database** | Supabase: tartdrhbhbumzfrbqabt | Same |
| **Region** | ap-northeast-1 | ap-northeast-1 |
| **Branch** | `main` | `main` |

---

## Setup Steps

### 1. Supabase Project (Done)

- Project: `RGS-auction` (ID: tartdrhbhbumzfrbqabt)
- Region: ap-northeast-1
- PostgreSQL 17
- `prize-images` storage bucket (public access)

### 2. Vercel Project (Done)

- Project: `rgs-auction`
- GitHub repo: `schradoc/rgs-silent-auction`
- Auto-deploys from `main` branch

### 3. Custom Domain (Done)

- `rgsauction.com` configured in Vercel project settings

---

## Environment Variables

### All Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase pooler connection string |
| `DIRECT_URL` | Supabase direct connection (for migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key |
| `SUPABASE_SECRET_KEY` | Supabase secret key (server-side, for storage uploads) |
| `NEXT_PUBLIC_APP_URL` | `https://rgsauction.com` |
| `NEXT_PUBLIC_IS_STAGING` | Set to `true` to show staging badge |
| `RESEND_API_KEY` | Resend email API key |
| `ADMIN_PASSWORD` | Required for initial admin setup |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sending number |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service for SMS OTP |

---

## Staging Indicator

When `NEXT_PUBLIC_IS_STAGING=true` or the app URL contains `vercel.app`, a small yellow "STAGING" badge appears in the bottom-left corner. This prevents confusion during testing.

---

## Database Setup for Production

After deploying, run the Prisma schema push against the production database:

```bash
# Set the production DATABASE_URL temporarily
DATABASE_URL="postgresql://..." npx prisma db push

# Seed prize data (if not using admin UI to create prizes)
DATABASE_URL="postgresql://..." npm run db:seed
```

Or use the Vercel CLI:

```bash
vercel env pull .env.production --environment=production
npx prisma db push
```

---

## Pre-Event Checklist (Completed)

- [x] Supabase project created (tartdrhbhbumzfrbqabt, ap-northeast-1)
- [x] Vercel project deployed (rgs-auction)
- [x] Environment variables set in Vercel
- [x] Database schema pushed (`prisma db push`)
- [x] 32 prizes entered via admin
- [x] 49 prize images uploaded to Supabase storage
- [x] Custom domain configured (rgsauction.com)
- [x] 3 admin users created
- [x] 5 helpers created
- [x] Auction state: LIVE
- [x] QR codes generated pointing to rgsauction.com
- [x] Full flow tested: register → SMS OTP verify → browse → bid
- [x] SMS and email notifications tested
