# Orracon cash receipts

One-page Next.js app for issuing, printing, and claiming Orracon Construction Plc cash-receipt tickets. Ticket numbers are sequential integers shown as `0001`, `0002`, … and keep growing past `9999`. Claim marks a ticket paid once.

## Local setup

1. Copy `.env.example` to `.env`. For local Docker Postgres the default is:

```
DATABASE_URL="postgresql://orracon:orracon@localhost:55432/tickets?schema=public"
```

2. Start Postgres and apply the schema:

```
docker compose up -d
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Vercel

Vercel CLI is not required. Import this GitHub repo in the Vercel dashboard.

1. Create a Neon Postgres database (Vercel Marketplace **Neon**, or the Neon dashboard).
2. In Vercel, **Add New Project** and import `orracon-tickets` (framework: Next.js).
3. Set `DATABASE_URL` for Production and Preview to the Neon **pooled** connection string (`sslmode=require`).
4. Deploy. The build runs `prisma generate` (postinstall) and `prisma migrate deploy` (`npm run build`).
5. In Vercel → Project → Settings → Deployment Protection, turn on Standard Protection or a password so the public URL is not an open till.

Phones and office PCs all use the same `*.vercel.app` URL and the same database.
