# ResumeForge

AI resume generator with Google sign-in and Midtrans (Snap) payments.

Built with **SvelteKit 2 + Svelte 5** (runes), Tailwind CSS, Prisma, and a custom Google OAuth + DB-session auth — migrated from Next.js App Router. All external integration contracts are unchanged:

- Google OAuth redirect URI: `/api/auth/callback/google` (same as legacy next-auth)
- Midtrans payment notification URL: `/api/webhook/midtrans`
- Auth/analytics cookies: `rf_session`, `rf_oauth_state`, `rf_oauth_verifier`, `rf_oauth_cb`
- `/admin` protected by HTTP Basic auth (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- Prisma schema untouched (`prisma/schema.prisma`)

## Tech stack

| Concern        | Choice                                        |
| -------------- | --------------------------------------------- |
| Framework      | SvelteKit 2 / Svelte 5 (runes) + Vite 5       |
| Styling        | Tailwind CSS 3.4 (same theme tokens as before) |
| Icons          | `lucide-svelte`                               |
| Animations     | CSS classes in `src/app.css` (`motion-fade-up`, `animate-marquee`, `animate-fill-bar`, …) — no framer-motion |
| Data layer     | Prisma (Postgres)                             |
| Auth           | Custom Google OAuth (PKCE) + opaque DB sessions |
| Payments       | Midtrans Snap (one-time plans: Starter / Premium / Annual) |
| PDF export     | `pdf-lib` (client-side)                       |
| Validation     | `zod`                                         |

## Getting started

> ⚠️ **No lockfile is committed** (it was tied to the old Next.js dependency tree). Run `npm install` once on a machine with Node to generate a fresh `package-lock.json` before building or deploying.

Prerequisite: Node 18.17+.

```bash
npm install          # first run — generates package-lock.json
cp .env.example .env # then fill in real values
```

Local development:

```bash
npm run dev          # http://localhost:5173
```

Quality / production commands:

```bash
npm run check        # svelte-check (type-checks all routes/components)
npm run lint         # eslint
npm run build        # prisma generate && vite build
npm run preview      # serve the production build locally (adapter-node)
```

Database schema (migrations live in `prisma/migrations/`):

```bash
npx prisma db push    # quick schema sync
# or
npm run db:migrate    # npx prisma migrate deploy
```

## Environment variables

```env
# ——— Core ———
DATABASE_URL=postgresql://user:password@host:5432/database

# Admin dashboard HTTP basic auth (leave unset to keep /admin closed)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me

# ——— Google OAuth (Google Cloud Console → Credentials → OAuth 2.0 Client IDs, type Web application) ———
# Redirect URI to register: https://your-app-domain.com/api/auth/callback/google
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx

# Public site URL. NEXT_APP_URL is preferred (server env);
# NEXT_PUBLIC_APP_URL is read as a fallback.
NEXT_APP_URL=https://your-app-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com

# ——— n8n webhook (AI resume generation) ———
N8N_WEBHOOK_URL=https://n8n.gloapp.my.id/webhook/resume-generator
N8N_BASIC_AUTH=username:password

# ——— Midtrans (checkout via Snap) ———
MIDTRANS_ENV=sandbox            # "sandbox" or "production"
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
# Price overrides (IDR). Defaults: starter 15000, premium 49000, annual 399000.
MIDTRANS_STARTER_PRICE=15000    # server charges using these (NEXT_PUBLIC_* as fallback)
MIDTRANS_PREMIUM_PRICE=49000
MIDTRANS_ANNUAL_PRICE=399000
NEXT_PUBLIC_MIDTRANS_STARTER_PRICE=15000  # what the landing page SHOWS
NEXT_PUBLIC_MIDTRANS_PREMIUM_PRICE=49000
NEXT_PUBLIC_MIDTRANS_ANNUAL_PRICE=399000
```

> **Pricing:** the server charges using `MIDTRANS_*_PRICE` (falls back to `NEXT_PUBLIC_MIDTRANS_*_PRICE`); the landing page displays `NEXT_PUBLIC_MIDTRANS_*_PRICE`. Keep both in sync. Unlike the old Next.js setup, the `NEXT_PUBLIC_MIDTRANS_*_PRICE` values are read **at runtime** (`$env/dynamic/public`), so changing them does **not** require a rebuild — only a redeploy/restart.

> **Auth is a custom Google OAuth flow** — no next-auth, and no `NEXTAUTH_URL`/`NEXTAUTH_SECRET`/`AUTH_SECRET` are needed. Sessions are opaque random tokens stored in the `Session` table (cookie `rf_session`), so there is no signing secret to misconfigure.

> **Google Cloud Console:** the OAuth client must have the redirect URI `https://<your-domain>/api/auth/callback/google` registered — the custom callback reuses the legacy next-auth path, so an existing registration keeps working. Client type: **Web application** (client secret required).

> **Admin:** `/admin` is behind HTTP Basic auth (`ADMIN_USERNAME`/`ADMIN_PASSWORD`). If they are unset, `/admin` responds 500 (`Admin credentials not configured`) and stays closed.

## Project structure

```
src/
├── app.html, app.d.ts, app.css     # shell, global types, design tokens + animation CSS
├── hooks.server.ts                 # /admin basic auth guard (whole /admin subtree)
├── lib/
│   ├── server/
│   │   ├── auth.ts                 # Google OAuth helpers (PKCE, token exchange, profile)
│   │   ├── session.ts              # DB sessions + cookie helpers (getCurrentUser(cookies))
│   │   ├── config.ts               # APP_URL resolution from NEXT_APP_URL/NEXT_PUBLIC_APP_URL
│   │   ├── midtrans.ts             # Snap checkout + webhook signature/status verification
│   │   ├── plans.ts                # PLANS (price/validity) + getActivePlan()
│   │   ├── resume.ts               # generateResume() → n8n AI webhook
│   │   └── prisma.ts               # Prisma client singleton
│   ├── components/                 # UI primitives + app components (Button, ResumePreview, …)
│   ├── types.ts                    # zod schemas, ProfileForm, Resume types
│   ├── generate.ts                 # client wrapper for the /dashboard?/generate action
│   ├── pdf.ts, pricing.ts, track.ts, auth.ts (client helpers)
│   └── utils.ts                    # cn() = clsx + tailwind-merge
└── routes/
    ├── +layout.server.ts           # loads user ($page.data.user) + appUrl for every page
    ├── +page.svelte                # landing page (hero, marquee, pricing, footer, JSON-LD)
    ├── dashboard/                  # generate wizard + usage/plan tab (server load + ?/generate action)
    ├── admin/                      # stats dashboard (protected by hooks.server.ts)
    ├── generate/                   # legacy URL → 303 redirect to /dashboard
    ├── api/
    │   ├── auth/google             # OAuth step 1 (PKCE cookies → Google consent)
    │   ├── auth/callback/google    # OAuth step 2 (code exchange, upsert user, set rf_session)
    │   ├── auth/signout            # destroy session + clear cookie
    │   ├── checkout                # create Midtrans Snap transaction
    │   ├── track                   # analytic events (pageview / click)
    │   ├── env-check               # runtime env diagnostics (no values leaked)
    │   └── webhook/midtrans        # payment notification (signature + status verified)
    ├── sitemap.xml/robots.txt      # SEO endpoints
```

## Server loads & form actions

- The signed-in user is provided by the root `+layout.server.ts` load as `$page.data.user` — there is **no** `/api/auth/session` polling.
- The dashboard data is a server load on `/dashboard` (`dashboardData`).
- Resume generation is the `?/generate` form action **on the dashboard page** (`/dashboard?/generate`), invoked from the client with `fetch` + `accept: application/json` and parsed from the SvelteKit `ActionResult` envelope. Subscription cancellation is the `?/cancelSubscription` action with `use:enhance`.

## Payment — Midtrans (Snap)

Payments are **one-time** with a validity period (Starter & Premium: 30 days, Annual: 365 days); `planExpiresAt` on the user controls access.

### Checkout flow

1. `/api/checkout` (POST `{ planType }`) — requires sign-in — creates a Snap transaction via `src/lib/server/midtrans.ts` and returns `{ url, token, orderId }`; the client redirects to `url`.
2. Midtrans sends a payment notification to `/api/webhook/midtrans`. The route verifies the **signature key** (`sha512(order_id + status_code + gross_amount + server_key)`), re-checks the status via the Midtrans Status API, then grants the plan by setting `plan` + `planExpiresAt` (`midtransOrderId`/`midtransPaymentType` are recorded for idempotency/audit).
3. Statuses treated as paid: `settlement`, and `capture` with `fraud_status = accept`. The route always answers `200 ok` so Midtrans stops retrying; the webhook and the generate action allow up to 60 s (`export const config = { maxDuration: 60 }`).

## Deploy

### Vercel

The repo is pre-configured: `vercel.json` (framework = sveltekit, Singapore region via `build.env`-free config, install command), `@sveltejs/adapter-vercel` as devDependency, `postinstall: prisma generate`, build `prisma generate && vite build`, and `.vercelignore`.

1. Import the repo in Vercel, set the environment variables from the table above (both `NEXT_APP_URL` and `NEXT_PUBLIC_APP_URL`).
2. Set `DATABASE_URL` to hosted Postgres (Neon/Supabase/Vercel Postgres) and apply the schema once: `npx prisma db push` or `npm run db:migrate`.
3. Register the callback URL in Google Cloud Console: `https://<your-domain>/api/auth/callback/google`; set `NEXT_PUBLIC_APP_URL` to the same domain.

### Docker / Node

`Dockerfile` uses `adapter-node` (via `adapter-auto` fallback). First run `npm install` locally (generates the lockfile), then:

```bash
docker build -t resume-forge .
docker run -p 3000:3000 --env-file .env resume-forge
```

The container runs `npx prisma db push && node build/index.js` on start.

### Diagnostic endpoint

`GET /api/env-check` reports whether each important env var is present/non-empty at runtime **without revealing values** — handy for debugging deploy-time vs runtime env mismatches.

## Notes

- `prisma/schema.prisma`, `prisma/migrations/`, `n8n/` workflows, and `.vercelignore` are left untouched by the migration.
- The legacy `/generate` URL 303-redirects to `/dashboard` (generation now lives in the dashboard Generate tab).