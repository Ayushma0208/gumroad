# Deployment

## Prerequisites

- Node.js ≥ 20, pnpm 9
- PostgreSQL 14+
- Cloudinary account
- Razorpay account (keys + webhook secret)
- Optional: Resend (`EMAIL_PROVIDER=resend`) for transactional email

## Environment

### API (`apps/api/.env`)

See `apps/api/.env.example`. Production **requires**:

- `DATABASE_URL`, `JWT_SECRET` (≥32 chars)
- `CLIENT_URL` / `APP_URL` (HTTPS)
- `RAZORPAY_*`, `CLOUDINARY_*`
- `COOKIE_SAME_SITE=lax` with same-origin proxy (recommended)

### Web (`apps/web/.env.local` / host env)

See `apps/web/.env.example`. Production **requires**:

- `NEXT_PUBLIC_USE_REMOTE_API=true`
- `API_PROXY_TARGET` or `NEXT_PUBLIC_API_URL` pointing at the API
- `NEXT_PUBLIC_SITE_URL`

`ALLOW_MOCK_AUTH` is rejected in production builds.

## Database migrations

```bash
pnpm --filter @lumen/api prisma:deploy   # migrate deploy
# or prisma migrate deploy from apps/api
```

Do **not** run `migrate reset` against production data.

## Build & run

```bash
pnpm --filter @lumen/api build
pnpm --filter @lumen/api start

pnpm --filter @lumen/web build
pnpm --filter @lumen/web start
```

## Reverse proxy

- Terminate TLS at the edge
- Forward `X-Forwarded-For` carefully if exposing rate limits by IP
- Prefer same-origin: Next rewrites `/api/v1/*` → API so cookies stay first-party (`SameSite=lax`)

## Razorpay webhook

- URL: `https://<api-host>/api/v1/payments/razorpay/webhook`
- Must receive **raw body** (API mounts raw parser before JSON for this path)
- Configure `RAZORPAY_WEBHOOK_SECRET`

## Health checks

- Liveness: `GET /api/v1/health` → `{ status: "ok" }`
- Readiness: `GET /api/v1/health/ready` → database ping (503 if down)

## Graceful shutdown

API handles `SIGTERM`/`SIGINT`: stops email worker, closes HTTP server, disconnects Prisma.

## Seed data

`prisma:seed` is for **development only** (shared demo password). Never seed production with demo accounts.
