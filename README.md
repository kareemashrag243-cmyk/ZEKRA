# ZEKRA — multi-customer platform

Turns the original single-couple HTML page into: one admin, many customers,
each with their own login and their own public page at `/customer/{slug}`.
The public page's visual design (colors, fonts, layout, the 11-card swipe
stack, counter, everything) is untouched — only the data is now dynamic.

## Stack, and why

- **Next.js** (Pages Router) — gives us `/customer/[slug]` dynamic routing
  and simple API routes (`pages/api/**`), deploys to Vercel with zero config.
- **Supabase** — Postgres database, file storage, all on one free-tier-friendly
  platform.
- **Custom auth** (bcrypt + JWT in an httpOnly cookie), not Supabase Auth —
  your customers log in with a **username**, not an email, which Supabase
  Auth doesn't support out of the box. Rolling this ourselves is ~150 lines
  (see `lib/auth.js`) and keeps things simple and fully under your control.

## One thing that changed on purpose

The original page had a site-wide "enter password to unlock" screen with a
hardcoded password (`1234`) in the JavaScript. That's separate from customer
login (item 3 in your spec), and wasn't in your list of customer-editable
fields, so I removed that gate entirely — the public page now opens straight
to the intro screen, like a normal personalized website. Everything else
(intro screen, music, cursor, reveal animations, swipe stack, counter,
gallery, video, letter, layout, mobile behavior) is byte-for-byte the same
CSS/behavior as your original file.

If you actually want a per-couple visitor password back (so only people
with the password can view a couple's site), tell me and I'll add a
`site_password` field the same way — it's a small addition.

## Project structure

```
pages/
  index.js                 landing page (links to both logins)
  login.js                 customer login
  admin/login.js           admin login
  admin/dashboard.js        admin: list/create/edit/delete customers, reset password
  dashboard/index.js       customer: the editor for their own site
  customer/[slug].js       the public site — one template, loads data by slug
  api/admin/**             admin API routes (protected by admin session cookie)
  api/customer/**          customer API routes (protected by customer session cookie)
components/PublicSite.js   the original design, now driven by a `customer` prop
lib/                       supabase clients, auth helpers, slug generator
styles/dashboard.css       styling for admin/customer dashboards only —
                           scoped under .zekra-dashboard, never touches the
                           public site's own styles
supabase/schema.sql        run this once in Supabase
```

## Setup

### 1. Create a Supabase project
[supabase.com](https://supabase.com) → New project. Once it's ready:

- **Settings → API**: copy the Project URL, the `anon public` key, and the
  `service_role` key (keep this one secret).
- **SQL Editor → New query**: paste the contents of `supabase/schema.sql`
  and run it. This creates the `admins` and `customers` tables, security
  policies, and the `customer-media` storage bucket.

### 2. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Settings → API.
- `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET` — any long random strings,
  e.g. run `openssl rand -hex 32` twice.
- `SUPABASE_STORAGE_BUCKET=customer-media`
- `ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` — the very first
  admin account's credentials (see step 4).

### 3. Install and run locally
```
npm install
npm run dev
```

### 4. Create your first admin account
With the app running, call the one-time bootstrap route once:
```
curl -X POST http://localhost:3000/api/admin/bootstrap
```
This creates an admin using `ADMIN_BOOTSTRAP_USERNAME` /
`ADMIN_BOOTSTRAP_PASSWORD` from your env vars. It refuses to run again once
any admin exists, so it's safe to leave the route in the deployed app. Log
in at `/admin/login`, then feel free to change your env vars back to
something else (they're only read the very first time).

### 5. Add your first customer
`/admin/dashboard` → **Add customer** → fill in a name, username, and
initial password. You'll get back the username, password, and public URL
to hand to the couple — plus a link to open their site right away.

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. In the project's **Settings → Environment Variables**, add every variable
   from your `.env.local` (same names, same values — plus `NODE_ENV` is set
   automatically by Vercel).
4. Deploy.
5. Run the bootstrap step once against your live URL:
   ```
   curl -X POST https://your-app.vercel.app/api/admin/bootstrap
   ```
6. Log in at `https://your-app.vercel.app/admin/login` and start adding
   customers. Each one's site is live immediately at
   `https://your-app.vercel.app/customer/{slug}`.

## Known limitation worth knowing about

Vercel's Serverless Functions (which is what `pages/api/**` compiles to)
cap request body size at a few MB by default. Photos and music will upload
fine; a long video file may fail depending on its size and your Vercel plan.
If that turns out to matter for you in practice, the fix is to switch video
uploads to a direct-to-Supabase-Storage upload from the browser (using a
short-lived signed upload URL) instead of routing the file through our own
API route — it's a contained change to `pages/api/customer/upload.js` and
the upload button in the dashboard, and I'm happy to build it if you hit
this wall.

## Security model, in short

- Customer passwords are hashed with bcrypt, never stored or sent in plain
  text after creation.
- Sessions are JWTs in httpOnly cookies — never readable or stored by
  frontend JavaScript.
- All writes (admin and customer) go through API routes using the Supabase
  **service role** key, which bypasses Row Level Security by design — the
  actual isolation (customer A can never touch customer B's row) is
  enforced in the API route code itself, by always scoping queries to the
  logged-in session's own `customerId`, never an ID the client sends.
- The **anon** key (safe for the browser) can only ever `SELECT` a
  `customers` row that is `is_published = true`, and can never write
  anything — enforced by the Postgres Row Level Security policy in
  `supabase/schema.sql`, as defense in depth.
- The `customer-media` storage bucket is public-read (so plain `<img>`,
  `<audio>`, `<video>` tags can load files by URL, matching the original
  site's simplicity), but only the server can upload, replace, or delete —
  never the browser directly.
