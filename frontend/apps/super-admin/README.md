# DropXCutz super-admin

Platform dashboard for creating salons, viewing totals and revenue, and changing salon lifecycle status.

The browser calls local Next.js route handlers, which keep `SUPER_ADMIN_API_KEY` server-side and proxy requests to `SALON_BACKEND_URL`.

```bash
npm install
npm run dev -- --port 3001
```

Configure both the backend and this app with the same long random `SUPER_ADMIN_API_KEY` value. Never expose it through a `NEXT_PUBLIC_` variable.

Create `.env.local` from `.env.example`. `SALON_BACKEND_URL` stays server-side, as does `SUPER_ADMIN_API_KEY`.
# Super Admin deployment

Deploy Super Admin as a separate Vercel project. In Vercel, set the project's
**Root Directory** to `frontend/apps/super-admin` and use the **Next.js**
framework preset. Do not deploy the repository root, because it is a monorepo
and does not contain the Super Admin application.

Set this production environment variable before deploying:

- `SALON_BACKEND_URL` — the public HTTPS API base URL ending in `/api` (for
  example, `https://api.example.com/api`).

The API must permit the Super Admin Vercel domain in `FRONTEND_ORIGINS`.
