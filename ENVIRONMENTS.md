# RGS Auction — Environment Setup

## Strategy: Two Vercel Projects, Same Branch

Both environments deploy from the `main` branch automatically. They share the same codebase but point to different databases and Supabase projects.

| | Staging | Production |
|---|---------|------------|
| **Vercel Project** | `rgs-auction` | `rgs-auction-prod` |
| **URL** | rgs-auction.vercel.app | rgsauction.com |
| **Purpose** | Testing with seed/mock data | Live event — real bidders |
| **Database** | Supabase staging project | Supabase production project |
| **Branch** | `main` | `main` |

---

## Setup Steps

### 1. Create Production Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project (e.g., `rgs-auction-prod`)
3. Note the project URL, anon key, secret key, and connection strings
4. Create a `prize-images` storage bucket (public access)

### 2. Create Production Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the same GitHub repository (`schradoc/rgs-silent-auction`)
3. Name the project `rgs-auction-prod`
4. Set environment variables (see below)
5. Deploy

### 3. Configure Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add `rgsauction.com`
3. Configure DNS records as directed by Vercel

---

## Environment Variables

### Variables that DIFFER between environments

| Variable | Staging | Production |
|----------|---------|------------|
| `DATABASE_URL` | Staging Supabase pooler URL | Production Supabase pooler URL |
| `DIRECT_URL` | Staging Supabase direct URL | Production Supabase direct URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | `https://yyy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging anon key | Production anon key |
| `SUPABASE_SECRET_KEY` | Staging secret key | Production secret key |
| `NEXT_PUBLIC_APP_URL` | `https://rgs-auction.vercel.app` | `https://rgsauction.com` |
| `NEXT_PUBLIC_IS_STAGING` | `true` | *(not set)* |

### Variables that are SHARED (same value)

| Variable | Notes |
|----------|-------|
| `RESEND_API_KEY` | Same Resend account for both |
| `TWILIO_ACCOUNT_SID` | Same Twilio account |
| `TWILIO_AUTH_TOKEN` | Same Twilio account |
| `TWILIO_PHONE_NUMBER` | Same sending number |

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

## Pre-Event Checklist

- [ ] Production Supabase project created
- [ ] Production Vercel project created and deployed
- [ ] Environment variables set for production
- [ ] Database schema pushed (`prisma db push`)
- [ ] Prize data seeded or entered via admin
- [ ] Prize images uploaded to production Supabase storage
- [ ] Custom domain configured (if using)
- [ ] Admin user created in production
- [ ] Auction state set to PRELAUNCH
- [ ] QR codes generated pointing to production URL
- [ ] Test full flow: register → verify → browse → bid
- [ ] SMS/email notifications tested
