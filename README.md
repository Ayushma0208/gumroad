# Lumen

Premium creator-commerce marketplace (monorepo): Next.js web app + Express API + PostgreSQL/Prisma.

## Apps

| Package | Path | Role |
|---------|------|------|
| `@lumen/web` | `apps/web` | Next.js App Router storefront, studio, admin |
| `@lumen/api` | `apps/api` | Express modular monolith (`/api/v1`) |

## Stack

- **Web:** Next.js, TypeScript, Tailwind, shadcn/ui, TanStack Query, RHF + Zod, Framer Motion, Recharts
- **API:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT httpOnly cookies
- **Storage:** Cloudinary (public images + private signed digital files)
- **Payments:** Razorpay (orders, verify, webhooks)

## Quick start

```bash
pnpm install
# Start Postgres (optional docker-compose) then:
cp apps/api/.env.example apps/api/.env   # fill secrets
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @lumen/api prisma:migrate
pnpm --filter @lumen/api prisma:seed     # optional demo data
pnpm dev:api                             # :4000
pnpm --filter @lumen/web dev             # :3000
```

Local web without API: leave `NEXT_PUBLIC_USE_REMOTE_API` unset (mock auth).  
Production builds **require** `NEXT_PUBLIC_USE_REMOTE_API=true`.

## Scripts

```bash
pnpm typecheck
pnpm lint
pnpm test:api
pnpm --filter @lumen/api build
pnpm --filter @lumen/web build
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API overview](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md) (includes [Render](docs/DEPLOYMENT.md#render-free-web-services))
- [Security](docs/SECURITY.md)
- [Performance](docs/PERFORMANCE.md)
- API domain docs under `apps/api/docs/`

## Health

- `GET /api/v1/health` — liveness
- `GET /api/v1/health/ready` — database readiness
