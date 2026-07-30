# DropXCutz super-admin

Platform dashboard for creating salons, viewing totals and revenue, and changing salon lifecycle status.

The browser calls local Next.js route handlers, which keep `SUPER_ADMIN_API_KEY` server-side and proxy requests to `SALON_BACKEND_URL`.

```bash
npm install
npm run dev -- --port 3001
```

Configure both the backend and this app with the same long random `SUPER_ADMIN_API_KEY` value. Never expose it through a `NEXT_PUBLIC_` variable.

Create `.env.local` from `.env.example`. `SALON_BACKEND_URL` stays server-side, as does `SUPER_ADMIN_API_KEY`.