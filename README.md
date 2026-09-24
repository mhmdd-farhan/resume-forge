This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Vercel CI/CD checklist

The repo is pre-configured for Vercel: `vercel.json` (framework, `npm install` command, Singapore region, `maxDuration` on the Midtrans webhook), `postinstall: prisma generate`, build command `prisma generate && next build`, and a `.vercelignore`.

**Before pushing, run locally (required — this machine has no Node):**

```bash
npm install                    # refresh package-lock.json (removes @polar-sh/*)
npx prisma generate            # generate Prisma Client for the new schema
npm run build                  # make sure it compiles
```

**Environment variables to set in Vercel → Project → Settings → Environment Variables:**

```env
DATABASE_URL=postgresql://...          # hosted Postgres (Neon/Supabase) — not the docker one
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_USERNAME=...                     # /admin basic-auth (leave unset to keep /admin closed)
ADMIN_PASSWORD=...
N8N_WEBHOOK_URL=https://n8n.gloapp.my.id/webhook/resume-generator
N8N_BASIC_AUTH=resumeforge1209:resumeforge1209
MIDTRANS_ENV=production                 # or sandbox while testing
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_STARTER_PRICE=15000           # charge amount (optional overrides)
MIDTRANS_PREMIUM_PRICE=49000
MIDTRANS_ANNUAL_PRICE=399000
NEXT_PUBLIC_MIDTRANS_STARTER_PRICE=15000   # what the landing page SHOWS —
NEXT_PUBLIC_MIDTRANS_PREMIUM_PRICE=49000   # must match MIDTRANS_*_PRICE so
NEXT_PUBLIC_MIDTRANS_ANNUAL_PRICE=399000   # display == charge
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```
> Pricing: the server charges using `MIDTRANS_*_PRICE` (falls back to `NEXT_PUBLIC_MIDTRANS_*_PRICE`); the landing page displays `NEXT_PUBLIC_MIDTRANS_*_PRICE` (falls back to the built-in default 15000/49000/399000). Keep both in sync. `NEXT_PUBLIC_*` values are baked into the client bundle at **build** time, so changing them requires a redeploy.
> ⚠️ **Auth is a custom Google OAuth flow** — no next-auth, and no `NEXTAUTH_URL`/`NEXTAUTH_SECRET`/`AUTH_SECRET` are needed (sessions are opaque tokens stored in the `Session` table, so there is no signing secret to misconfigure).

> `NEXT_APP_URL` is the preferred name (server-side); `NEXT_PUBLIC_APP_URL` is read as a fallback and is also used by the client bundle. `vercel.json` `build.env` injects both at build time.

> **Google Cloud Console:** the OAuth client must have the redirect URI `https://<your-domain>/api/auth/callback/google` registered (that's the custom callback — it reuses the legacy next-auth path so an existing registration keeps working). Client type: **Web application** (secret required).

> **Admin:** `/admin` is behind HTTP Basic auth controlled by `ADMIN_USERNAME`/`ADMIN_PASSWORD`. If they are unset, `/admin` responds 500 (`Admin credentials not configured`) and stays closed.

**Database on Vercel:** set `DATABASE_URL` to a hosted Postgres (e.g. Neon, Supabase, Vercel Postgres). Apply the schema once after setup:

```bash
npx prisma db push    # or: npx prisma migrate deploy
```

The build itself never touches the database (the admin page is `force-dynamic`), so CI stays green even before `DATABASE_URL` is seeded.

## Payment — Midtrans (Snap)

The app uses Midtrans Snap for paid plans (Starter / Premium / Annual). Payments are **one-time** with a validity period (Starter & Premium: 30 days, Annual: 365 days); the `planExpiresAt` field on the user controls access.

### Environment variables

```env
MIDTRANS_ENV=sandbox            # "sandbox" or "production"
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
MIDTRANS_STARTER_PRICE=15000    # optional overrides (IDR)
MIDTRANS_PREMIUM_PRICE=49000
MIDTRANS_ANNUAL_PRICE=399000
# Public URL (required for the payment notification URL)
NEXT_APP_URL=https://your-app-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### Setup steps

1. Get the Server/Client keys from Midtrans dashboard → **Settings → Access Keys**.
2. Set `NEXT_PUBLIC_APP_URL` to your public URL — it is used as the base for the payment notification URL (`<APP_URL>/api/webhook/midtrans`).
3. While testing use `MIDTRANS_ENV=sandbox`; switch to `production` when going live.
4. The Prisma schema has already been applied to the production database via `prisma/migrations/20260924000000_init`. For other environments:

   ```bash
   npx prisma migrate deploy   # applies pending migrations from prisma/migrations/
   # or for quick schema sync: npx prisma db push
   ```
   (The initial migration creates all tables with `planExpiresAt`, `midtransOrderId`, `midtransPaymentType` — the old Polar fields no longer exist.)

### Checkout flow

1. `/api/checkout` (POST `{ planType }`) creates a Snap transaction via `src/lib/midtrans.ts` and returns `{ url, token }` — the client redirects to `url`.
2. Midtrans sends a payment notification to `/api/webhook/midtrans`. The route verifies the **signature key** (`sha512(order_id + status_code + gross_amount + server_key)`), re-checks the status via the Midtrans Status API, then grants the plan by setting `plan` + `planExpiresAt`.
3. Statuses treated as paid: `settlement`, and `capture` with `fraud_status = accept`.

### Old Polar migration note

Everything referencing Polar has been removed. Run `npm install` to refresh `package-lock.json` (the `@polar-sh/*` packages are gone from `package.json`).
