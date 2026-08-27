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

Use `bun run typecheck` to validate the backend and `bunx prisma migrate dev --name <change>` when changing the schema.
