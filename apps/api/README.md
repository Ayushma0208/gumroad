# Lumen API

Modular Express monolith. PostgreSQL + Prisma. HTTP-only cookie sessions.

## Local setup

```bash
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
# set JWT_SECRET to a long random string
pnpm --filter @lumen/api prisma:generate
pnpm --filter @lumen/api prisma:migrate
pnpm --filter @lumen/api prisma:seed
pnpm --filter @lumen/api dev
```

Health: `GET http://localhost:4000/api/v1/health`

Development accounts (password `password12`):

- `admin@example.com` — ADMIN
- `mira@example.com` — CREATOR
- `kenji@example.com` — CREATOR
- `julian@example.com` — CREATOR
- `leah@example.com` — CUSTOMER
