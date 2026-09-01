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
