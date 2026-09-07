# API overview

Base path: `/api/v1`. JSON envelope: `{ success, data, message?, errors? }`.

Mutating requests from the web client must include header `X-Lumen-Client: web` (CSRF companion). Auth uses httpOnly cookie `lumen_session`.

## Route groups (auth)

| Area | Auth | Notes |
|------|------|-------|
| `GET /health`, `/health/ready` | Public | Liveness / DB readiness |
| `/auth/*` | Public + rate limits | register, login, logout, me, password |
| `/categories` GET | Public | Short Cache-Control |
| `/products` public GETs | Public | Lists omit files; detail for published |
| `/products` mutations | CREATOR/ADMIN | Ownership enforced |
| `/search` | Public | Published products only; limit capped |
| `/creators` public | Public | Storefront |
| `/creators/me/*` | CREATOR/ADMIN | Profile, analytics, reviews |
| `/cart`, `/checkout`, `/payments/razorpay/verify` | CUSTOMER **or** CREATOR | Server-side pricing |
| `/payments/razorpay/webhook` | Signature | Raw body |
| `/orders`, `/library` | Authenticated | Owner scoped (404 cross-tenant) |
| `/wishlist`, `/notifications` | Authenticated | Owner scoped |
| `/coupons` creator | CREATOR/ADMIN | Creator scoped |
| `/creators/me/earnings*`, `/payouts*` | CREATOR/ADMIN | Creator scoped |
| `/admin/*` | ADMIN | Audit logged |

Pagination defaults to page size 20, max 48.

## Detailed domain docs

| Topic | File |
|-------|------|
| Account | `apps/api/docs/account.md` |
| Search | `apps/api/docs/search-discovery.md` |
| Analytics | `apps/api/docs/analytics.md` |
| Coupons | `apps/api/docs/coupons-pricing.md` |
| Earnings/payouts | `apps/api/docs/creator-earnings-payouts.md` |
| Notifications | `apps/api/docs/notifications.md` |
| Admin ops | `apps/api/docs/admin-operations.md` |
| Security | `docs/SECURITY.md` |
| Performance | `docs/PERFORMANCE.md` |
