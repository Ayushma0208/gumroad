# Deployment

## Render (free Web Services)

This app is a **live Node server** (Next.js SSR + Express API + Postgres). **Static Site will not work** — there is no static HTML export, auth uses httpOnly cookies, and `/api/v1/*` is proxied at runtime.

Skip **Blueprint**. Close the payment modal. Use **+ New → Web Service** twice and **+ New → Postgres** once. Pick the **Free** instance type on each screen (do not pick Starter).

Repo: `https://github.com/Ayushma0208/gumroad.git`, branch `main`. Root directory stays **empty**.

Free limits: web services sleep after ~15 minutes idle (first request ~1 minute). Free Postgres is **one per workspace** and **expires after 30 days**. If Render already used your free database slot, use [Neon](https://neon.tech) (free, no card) and paste that URL as `DATABASE_URL`.

### 1. Postgres — **+ New → Postgres**

| Field | Value |
|---|---|
| Name | `lumen-db` |
| Region | Oregon |
| Instance type | **Free** |
| Database | `lumen` |

Copy the **Internal Database URL** for `DATABASE_URL`.

### 2. API — **+ New → Web Service** (not Static Site)

Connect `Ayushma0208/gumroad`.

| Field | Value |
|---|---|
| Name | `lumen-api` |
| Region | Oregon |
| Runtime | Node |
| Root directory | *(empty)* |
| Instance type | **Free** |
| Build command | `npm install -g pnpm@9.15.0 && pnpm install --frozen-lockfile --prod=false && pnpm --filter @lumen/api build` |
| Start command | `pnpm --filter @lumen/api prisma:deploy && pnpm --filter @lumen/api start` |

Health check: `/api/v1/health`

| Key | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | from `lumen-db` (or a Neon URL) |
| `JWT_SECRET` | random string, **≥ 32 characters** |
| `JWT_EXPIRES_IN` | `7d` |
| `COOKIE_NAME` | `lumen_session` |
| `COOKIE_SAME_SITE` | `lax` |
| `CLIENT_URL` | `https://<lumen-web>.onrender.com` *(after web exists; no trailing slash)* |
| `APP_URL` | same as `CLIENT_URL` |
| `EMAIL_PROVIDER` | `console` |
| `EMAIL_FROM` | `Lumen <noreply@example.com>` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | from Razorpay |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary |

You can create the API first and set `CLIENT_URL` after the web service has a URL.

### 3. Web — **+ New → Web Service** again

Same repo. Still **not** Static Site.

| Field | Value |
|---|---|
| Name | `lumen-web` |
| Region | Oregon |
| Runtime | Node |
| Root directory | *(empty)* |
| Instance type | **Free** |
| Build command | `npm install -g pnpm@9.15.0 && pnpm install --frozen-lockfile --prod=false && pnpm --filter @lumen/web build` |
| Start command | `pnpm --filter @lumen/web start -- --hostname 0.0.0.0` |

Set these **before** the first web build (`NEXT_PUBLIC_*` is baked in at build time):

| Key | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `NODE_ENV` | `production` |
| `NODE_OPTIONS` | `--max-old-space-size=384` |
| `NEXT_PUBLIC_USE_REMOTE_API` | `true` |
| `API_PROXY_TARGET` | `https://<lumen-api>.onrender.com` *(no trailing slash)* |
| `NEXT_PUBLIC_API_URL` | same as `API_PROXY_TARGET` |
| `NEXT_PUBLIC_SITE_URL` | `https://<lumen-web>.onrender.com` |

Do **not** set `ALLOW_MOCK_AUTH`. Then put the web URL into the API’s `CLIENT_URL` / `APP_URL` and redeploy the API.

### After deploy

1. `https://<lumen-web>.onrender.com` — sleeping Free instances take ~1 minute to wake
2. `https://<lumen-api>.onrender.com/api/v1/health`
3. `https://<lumen-api>.onrender.com/api/v1/health/ready`
4. Razorpay webhook: `https://<lumen-api>.onrender.com/api/v1/payments/razorpay/webhook`
5. Do **not** run `prisma:seed` on this database

### Common failures

| Symptom | Fix |
|---|---|
| Payment Information Required on Blueprint | Close it. Create **Web Service** with instance type **Free**. The old Blueprint used paid plans. |
| API crash: `RAZORPAY_*` / `CLOUDINARY_*` | Required when `NODE_ENV=production` |
| API crash: `JWT_SECRET must be at least 32 characters` | Longer secret |
| Web build: `NEXT_PUBLIC_USE_REMOTE_API=true` | Set it, then **Clear build cache & deploy** |
| Build killed / ran out of memory | Keep `NODE_OPTIONS=--max-old-space-size=384`. If it still dies, the Next.js build needs a paid instance. |
| Login cookie not sticking | `CLIENT_URL` must match the web origin exactly; no trailing slash |
| `pnpm: command not found` | Keep `npm install -g pnpm@9.15.0` at the start of the build command |
| Free Postgres expired / already used | Create a free database on Neon and paste `DATABASE_URL` |

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
