# DropXCutz salon ERP

The salon operations frontend proxies browser API calls through its own `/api`
origin. This makes deployed login reliable even when the ERP and API use
different domains.

```bash
npm install
npm run dev
```

Run it on port 3000 with the backend on port 5000. The default local salon code is `dropx-studio`.

Create `.env.local` from `.env.example` before running it. Set
`SALON_BACKEND_URL` to the backend URL ending in `/api`.

## Vercel deployment

Deploy this app as its own Vercel project. Set the Vercel project's **Root
Directory** to `frontend/apps/salon-erp` and use the **Next.js** framework
preset. After saving that setting, redeploy and open the URL from that new
deployment, not a previous repository-root deployment.

Set `SALON_BACKEND_URL` to the publicly deployed API URL ending in `/api`. The
browser will call the same-origin `/api` proxy, so the authentication cookie is
first-party. Also set the API's `FRONTEND_ORIGINS` to include the deployed ERP
URL, and set `COOKIE_SECURE=true` in production.
