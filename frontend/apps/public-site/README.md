# DropXcutz public salon website

This is the customer-facing booking website. It does not use ERP/admin authentication.

## Template website

Set `NEXT_PUBLIC_SITE_MODE=template` and `NEXT_PUBLIC_SALON_SLUG=<salon-slug>`. It uses the protected slug endpoints at `/api/public/v1/salons/:slug`.

## Custom domain website

Set `NEXT_PUBLIC_SITE_MODE=custom` and `NEXT_PUBLIC_PUBLIC_KEY=<salon integration key>`. Add the deployed domain to the salon's Integration settings; the API validates the browser origin.

Run `npm install` then `npm run dev`. The default port is 3002.

## Deploy on Vercel

Create one Vercel project for this customer-facing app and set its **Root
Directory** to `frontend/apps/public-site`. Vercel will then detect Next.js,
install this app's dependencies, and serve `app/page.tsx` at `/`.

Set these production environment variables before deploying:

- `NEXT_PUBLIC_API_URL` — the public HTTPS URL of the deployed API, followed
  by `/api` (for example, `https://api.example.com/api`).
- `NEXT_PUBLIC_SITE_MODE` — `template` or `custom`.
- `NEXT_PUBLIC_SALON_SLUG` — required when site mode is `template`.
- `NEXT_PUBLIC_PUBLIC_KEY` — required when site mode is `custom`.

Do not deploy the repository root as this website: the root is a monorepo and
does not contain a Next.js application, so Vercel can report a successful build
while returning `404 NOT_FOUND` at the domain.
