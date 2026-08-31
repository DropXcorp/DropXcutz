# DropXCutz salon API

Express, Prisma 7 and PostgreSQL backend for the multi-tenant salon ERP and platform super-admin.

## Run locally

```bash
bun install
bun run db:deploy
bun run db:seed
bun run dev
```

The API runs on `http://localhost:5000`. ERP and platform routes use the secure `dropxcutz_session` HTTP-only cookie issued at `/api/erp/auth/login`; platform endpoints require a `PLATFORM_ADMIN` session.

## Plans, subscriptions and websites

- Platform plan APIs: `/api/platform/plans`, `/api/platform/features`
- Per-salon subscription and overrides: `/api/platform/salons/:id/subscription`, `/features`, `/website`
- Template public website API: `/api/public/v1/salons/:slug/...`
- Professional/custom website API: `/api/v1/public/...` with `X-DropXcutz-Key` and an allowed origin

Run `bun run db:seed` after deployment. It safely creates or updates the default plans/features and links legacy salons to a subscription.

Required environment variables:

```dotenv
DATABASE_URL=postgresql://...
JWT_SECRET=at-least-32-characters
FRONTEND_ORIGINS=http://localhost:3000,http://localhost:3001
```

Optional settings are `PORT_NO` (defaults to `5000`) and `FRONTEND_ORIGINS`. Copy `.env.example` to `.env` and fill in the values. Redis, uploads, payment processing, and WebSockets are not configured in this project.

## Platform operations

Platform operations include a Razorpay-ready billing data model, platform invoices,
support tickets, custom platform roles, login/device history, two-factor state,
bulk-operation records, archived-salon restoration, and scheduled trial reminders.
Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` before
enabling a Razorpay adapter. Trial reminders are written only to the salon ERP's
in-app notification store; email, SMS, and WhatsApp delivery are deliberately not
configured.

Configure Razorpay to post to `POST /api/webhooks/razorpay`. The endpoint verifies
the raw request body with `RAZORPAY_WEBHOOK_SECRET` and processes
`payment_link.paid` idempotently. Platform invoice creation is available to users
with the `BILLING` permission at `POST /api/platform/billing/invoices`.

Use `bun run typecheck` to validate the backend and `bunx prisma migrate dev --name <change>` when changing the schema.
