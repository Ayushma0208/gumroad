# Deployment

## Render (recommended)

This repo is a **pnpm monorepo**: Next.js (`apps/web`) + Express (`apps/api`) + PostgreSQL. Do **not** pick **Static Site**. You need two **Web Services** and one **Postgres**.

Repo: `https://github.com/Ayushma0208/gumroad.git` (branch `main`). Connect that GitHub repo in Render before creating services.

`render.yaml` at the repo root is a Blueprint for the whole stack. It must be **committed and pushed** before Blueprint can see it.

### Option A — Blueprint (fastest)

From the **+ New** menu:

1. **Blueprint**
2. Connect the `gumroad` GitHub repo, branch `main`
3. Apply the Blueprint (`lumen-db`, `lumen-api`, `lumen-web`)
4. Open **lumen-api → Environment** and paste secrets (Blueprint leaves these blank):
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
5. Manual **Deploy latest commit** on `lumen-api` after secrets are saved (production boot **requires** those keys)
6. In Razorpay, set the webhook URL to `https://<lumen-api-host>/api/v1/payments/razorpay/webhook`

Starter web + 256MB Postgres is paid. Free Postgres is not available.

### Option B — click path from + New

Create a **Project** first if you want them grouped (optional): **+ New → Project**.

Then create resources in this order:

#### 1. Postgres — **+ New → Postgres**

| Field | Value |
|---|---|
| Name | `lumen-db` |
| Region | Oregon (same as your other services) |
| Plan | cheapest paid (256MB / Starter) |
| Database | `lumen` |

Copy the **Internal Database URL** (or External if Internal is not offered). You will paste it as `DATABASE_URL` on the API.

#### 2. API — **+ New → Web Service**

Connect `Ayushma0208/gumroad`.

| Field | Value |
|---|---|
| Name | `lumen-api` |
| Region | Oregon |
| Runtime | Node |
| Root directory | *(leave empty — repo root)* |
| Build command | `npm install -g pnpm@9.15.0 && pnpm install --frozen-lockfile --prod=false && pnpm --filter @lumen/api build` |
| Start command | `pnpm --filter @lumen/api prisma:deploy && pnpm --filter @lumen/api start` |
| Instance | Starter (or Free if you accept spin-down) |

Environment:

| Key | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | from `lumen-db` (link the database, or paste the URL) |
| `JWT_SECRET` | random string, **≥ 32 characters** |
| `JWT_EXPIRES_IN` | `7d` |
| `COOKIE_NAME` | `lumen_session` |
| `COOKIE_SAME_SITE` | `lax` |
| `CLIENT_URL` | `https://<lumen-web>.onrender.com` *(set after web exists; no trailing slash)* |
| `APP_URL` | same as `CLIENT_URL` |
| `EMAIL_PROVIDER` | `console` (or `resend` + `EMAIL_API_KEY`) |
| `EMAIL_FROM` | `Lumen <noreply@yourdomain.com>` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | from Razorpay |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary |

Health check path: `/api/v1/health`

You can deploy the API after Postgres exists, then come back and set `CLIENT_URL` once the web URL is known.

#### 3. Web — **+ New → Web Service**

Same repo, same branch, **not** Static Site.

| Field | Value |
|---|---|
| Name | `lumen-web` |
| Region | Oregon |
| Runtime | Node |
| Root directory | *(empty)* |
| Build command | `npm install -g pnpm@9.15.0 && pnpm install --frozen-lockfile --prod=false && pnpm --filter @lumen/web build` |
| Start command | `pnpm --filter @lumen/web start -- --hostname 0.0.0.0` |
| Instance | Starter (Next.js builds often OOM on 512MB Free) |

Environment (**needed at build time** — set before the first successful web build):

| Key | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `NODE_ENV` | `production` |
| `NODE_OPTIONS` | `--max-old-space-size=512` |
| `NEXT_PUBLIC_USE_REMOTE_API` | `true` |
| `API_PROXY_TARGET` | `https://<lumen-api>.onrender.com` *(no trailing slash)* |
| `NEXT_PUBLIC_API_URL` | same as `API_PROXY_TARGET` |
| `NEXT_PUBLIC_SITE_URL` | `https://<lumen-web>.onrender.com` |

Do **not** set `ALLOW_MOCK_AUTH`. Production builds reject it.

After the web URL exists, go back to **lumen-api** and set `CLIENT_URL` / `APP_URL` to that origin, then redeploy the API.

### After deploy

1. Open `https://<lumen-web>.onrender.com` — first hit on a sleeping instance can take ~1 minute
2. `https://<lumen-api>.onrender.com/api/v1/health` → ok
3. `https://<lumen-api>.onrender.com/api/v1/health/ready` → database up
4. Razorpay webhook: `https://<lumen-api>.onrender.com/api/v1/payments/razorpay/webhook`
5. Do **not** run `prisma:seed` on production (shared demo password)

The browser talks to the Next.js origin; Next rewrites `/api/v1/*` to the API so auth cookies stay first-party (`SameSite=lax`).

### Common failures

| Symptom | Fix |
|---|---|
| API crash: `Invalid environment: RAZORPAY_*` / `CLOUDINARY_*` | Those keys are required when `NODE_ENV=production` |
| API crash: `JWT_SECRET must be at least 32 characters` | Use a longer secret |
| Web build: `Production builds require NEXT_PUBLIC_USE_REMOTE_API=true` | Set that env var, then **Clear build cache & deploy** |
| Web build killed / OOM | Upgrade instance; keep `NODE_OPTIONS=--max-old-space-size=512` |
| Login cookie not sticking | `CLIENT_URL` must match the web origin exactly; `COOKIE_SAME_SITE=lax`; no trailing slash |
| Prisma SSL / P1010 | Use Render’s connection string as-is (`sslmode=require`). If Prisma rejects the cert, append `?sslmode=require` (or `&sslmode=require`) |
| `pnpm: command not found` | Keep `npm install -g pnpm@9.15.0` at the start of the build command |

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
