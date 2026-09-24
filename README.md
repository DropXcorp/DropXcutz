# DropXcutz

## Run locally (no Docker required)

From the repository root:

```bash
npm run dev
```

This starts all local applications:

- API: `http://localhost:5000`
- Salon ERP: `http://localhost:3000`
- Customer booking website: `http://localhost:3002`

Before the first run, copy `frontend/apps/public-site/.env.example` to `.env.local`. The included local configuration uses the `dropx-studio` template salon. Press `Ctrl+C` once to stop all processes.

## Run PostgreSQL with Docker

Docker Compose provisions only PostgreSQL. A temporary migration runner waits for
the database to become healthy, applies every committed Prisma migration, and
seeds the platform defaults/admin. It then exits; no API or frontend container is
started.

```bash
cp .env.docker.example .env.docker
# Set the required secrets in .env.docker.
docker compose --env-file .env.docker up --build
```

On PowerShell, copy the template with `Copy-Item .env.docker.example .env.docker`.
For a disposable local database, `docker-compose up --build` also works without
an environment file and uses development-only default credentials.

PostgreSQL is exposed on port `5432` by default. Point the locally run backend at
it with this `backend/.env` value:

```dotenv
DATABASE_URL=postgresql://dropxcutz:dropxcutz_dev_password@localhost:5432/dropxcutz
```

The database is stored in a named Docker volume, so `docker compose down` does
not erase it. To intentionally reset the local database, run `docker compose down -v`.
