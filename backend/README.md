# DropXCutz salon API

Express, Prisma 7 and PostgreSQL backend for the salon ERP and platform super-admin.

## Run locally

```bash
bun install
bunx prisma migrate deploy
bun run db:seed
bun run dev
```

The API runs on `http://localhost:5000`. Salon routes are under `/api/erp` and require `x-salon-code`. Platform routes are under `/api/platform` and require `x-super-admin-key` matching `SUPER_ADMIN_API_KEY`.

Required environment variables:

```dotenv
DATABASE_URL=postgresql://...
SUPER_ADMIN_API_KEY=replace-with-a-long-random-secret # required only for the super-admin app
```

Optional settings are `PORT_NO` (defaults to `5000`), `FRONTEND_ORIGINS` (defaults to the two local apps), and `DEFAULT_SALON_CODE` for local ERP development. Copy `.env.example` to `.env` and fill in the values. Redis, upload, payment, JWT, and WebSocket settings are not used by this API.

Use `bun run typecheck` to validate the backend and `bunx prisma migrate dev --name <change>` when changing the schema.