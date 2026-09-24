# DropXcutz public site (multi-tenant)

One deployment serves **every** salon's template website. The salon is chosen from the visitor's domain:

- `https://<salon-slug>.<PUBLIC_ROOT_DOMAIN>` — automatic for every published salon (one wildcard DNS record).
- `https://www.theirsalon.com` — a salon's own domain, after DNS verification in the salon dashboard.

`proxy.ts` asks the API (`/api/public/v1/sites/resolve`) which salon a host belongs to, then rewrites the request to `/sites/<slug>/…`. Unknown or unpublished hosts get a friendly 404.

## Environment
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public API URL ending in `/api` (required in production) |
| `API_URL` | Optional private API URL for server rendering |
| `REVALIDATE_SECRET` | Must equal `PUBLIC_SITE_REVALIDATE_SECRET` on the API — lets publishing refresh sites instantly |

No per-salon variables exist any more. See `../../../DEPLOYMENT.md` for the full walkthrough.

## Local development
```
bun run dev            # http://localhost:3002
open http://localhost:3002/?salon=<slug>     # remembered in a cookie
open http://<slug>.localhost:3002            # Chrome resolves *.localhost automatically
```

## Pages
`/` (home: hero, offers, services, gallery, reviews, contact), `/book` (multi-step booking + Razorpay), `/manage/<id>?token=…` (view, pay, cancel), plus `robots.txt` and `sitemap.xml` per host. Templates (`classic`, `modern`, `minimal`) and colours come from the salon's theme JSON.

## Custom (developer-built) websites
Those don't use this app: they call `/api/v1/public/*` with an `X-DropXcutz-Key` header — see **API & Integrations** in the salon dashboard.
