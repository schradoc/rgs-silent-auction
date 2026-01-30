# RGS Silent Auction

Live silent auction platform for the **Royal Geographical Society Hong Kong's 30th Anniversary Gala Dinner** on **28 February 2026**.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete project context and feature list
- **[docs/PRD.md](./docs/PRD.md)** - Product requirements
- **[docs/DECISIONS.md](./docs/DECISIONS.md)** - Architecture decisions

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Prisma** + **Supabase** (PostgreSQL)
- **Supabase Realtime**
- **Resend** (email)
- **Vercel** (deployment)

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/prizes` | Browse prizes |
| `/admin/dashboard` | Admin dashboard |
| `/helper` | Helper portal |
| `/live` | Projector display |

## Deployment

Connected to Vercel. Push to `main` to deploy.

```bash
# After schema changes
npx prisma generate
npx prisma db push
```

---

**GitHub**: https://github.com/schradoc/rgs-silent-auction
