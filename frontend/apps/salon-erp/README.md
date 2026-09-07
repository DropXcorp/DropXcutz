# DropXCutz salon ERP

The salon operations frontend. It loads tenant-scoped data from the backend using `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SALON_CODE`.

```bash
npm install
npm run dev
```

Run it on port 3000 with the backend on port 5000. The default local salon code is `dropx-studio`.

Create `.env.local` from `.env.example` before running it. Both values are safe for the browser: the API URL and the public salon code.

## Vercel deployment

Deploy this app as its own Vercel project. Set the Vercel project's **Root
Directory** to `frontend/apps/salon-erp` and use the **Next.js** framework
preset. After saving that setting, redeploy and open the URL from that new
deployment, not a previous repository-root deployment.

Set `NEXT_PUBLIC_API_URL` to the publicly deployed API URL ending in `/api` and
set `NEXT_PUBLIC_SALON_CODE` to the salon code for that deployment. The API must
allow the Vercel domain in `FRONTEND_ORIGINS`.
