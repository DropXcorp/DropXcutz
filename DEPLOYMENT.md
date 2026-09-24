# Deploying DropXcutz (first-time guide)

You deploy **four things**. Total cost can be near zero on free tiers to start.

| # | App | Where (recommended) | Notes |
|---|-----|---------------------|-------|
| 1 | **Database** (PostgreSQL) | Neon / Supabase / Railway | Copy the connection string → `DATABASE_URL` |
| 2 | **API** (`backend/`) | Render / Railway / Fly.io / a VPS | Needs a always-on server (runs email reminders & webhooks) |
| 3 | **salon-erp**, **super-admin** | Vercel (two projects) | Set *Root Directory* to `frontend/apps/salon-erp` / `frontend/apps/super-admin` |
| 4 | **public-site** | Vercel (one project) | ONE deployment serves every salon website |

## Step by step
1. **Database** – create a Postgres DB, copy its URL.
2. **API** – deploy `backend/` (Dockerfile included, or `bun src/index.ts`). Set the variables from `backend/.env.example`. Then run once: `bunx prisma migrate deploy`.
   Minimum: `DATABASE_URL`, `JWT_SECRET` (32+ chars), `FRONTEND_ORIGINS` (your ERP + super-admin URLs), `PAYMENT_CREDENTIALS_ENCRYPTION_KEY` (`openssl rand -base64 32`), SMTP_* (for customer emails), `API_PUBLIC_URL`.
3. **ERP + super-admin** – create two Vercel projects. Env: `SALON_BACKEND_URL` (= API URL + `/api`), super-admin also `NEXT_PUBLIC_ERP_URL`.
4. **Website hosting** – create a Vercel project for `frontend/apps/public-site`. Env: `NEXT_PUBLIC_API_URL`, `REVALIDATE_SECRET`.
   - Buy a domain (e.g. `mysalonapp.com`). In Vercel add the domain **and** `*.mysalonapp.com` to the public-site project, and create one wildcard DNS record `*  CNAME  cname.vercel-dns.com`.
   - Also create `cname.mysalonapp.com` → the same Vercel target (this is what salons' custom domains point at).
   - On the API set `PUBLIC_ROOT_DOMAIN=mysalonapp.com`, `PUBLIC_SITE_URL`, `PUBLIC_SITE_REVALIDATE_URL=https://<public-site>/api/revalidate` and the same secret in `PUBLIC_SITE_REVALIDATE_SECRET`.
   - Optional automatic SSL for customers' own domains: create a Vercel token → `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` (public-site project), `VERCEL_TEAM_ID` if you use a team.
5. Open **super-admin → Websites → System status** — it lists anything still missing.

## How salons go live
1. Super-admin gives the salon *Template website* (plan feature) → salon opens **Website** in its dashboard.
2. Salon picks a template, edits colours/content, clicks **Publish** → live at `https://<name>.mysalonapp.com`.
3. Optional: salon adds its own domain → adds the shown DNS records → status turns **Live** automatically.
4. Online payments: salon opens **Online payments**, pastes its Razorpay keys, adds the webhook URL shown there.

## Local testing
`bun run dev` in each app. Public site: `http://localhost:3002/?salon=<slug>` (or `http://<slug>.localhost:3002`).
