# DropXcutz public salon website

This is the customer-facing booking website. It does not use ERP/admin authentication.

## Template website

Set `NEXT_PUBLIC_SITE_MODE=template` and `NEXT_PUBLIC_SALON_SLUG=<salon-slug>`. It uses the protected slug endpoints at `/api/public/v1/salons/:slug`.

## Custom domain website

Set `NEXT_PUBLIC_SITE_MODE=custom` and `NEXT_PUBLIC_PUBLIC_KEY=<salon integration key>`. Add the deployed domain to the salon's Integration settings; the API validates the browser origin.

Run `npm install` then `npm run dev`. The default port is 3002.
