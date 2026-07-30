# DropXCutz salon ERP

The salon operations frontend. It loads tenant-scoped data from the backend using `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SALON_CODE`.

```bash
npm install
npm run dev
```

Run it on port 3000 with the backend on port 5000. The default local salon code is `dropx-studio`.

Create `.env.local` from `.env.example` before running it. Both values are safe for the browser: the API URL and the public salon code.