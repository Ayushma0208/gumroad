# Performance

Production performance guidance for Lumen (Next.js + Express + Prisma/PostgreSQL). Optimizations are based on code and query inspection unless a measurement is explicitly reported.

## Frontend

### Rendering strategy

- Keep interactive surfaces as Client Components (forms, filters, cart, charts, modals, motion).
- Prefer Server Components for static shells and metadata where the route already does.
- Lazy-load chart-heavy UI (`RevenueChart`, admin revenue chart) with `next/dynamic` so Recharts is not on the critical path for every studio/admin visit.
- Discover search is debounced (~250–300ms). Featured catalog fetch runs only when the spotlight is shown.

### Image optimization

- Product cards and storefront media use Cloudinary URL transforms via `cloudinaryThumb` (`f_auto,q_auto,c_fill,w_*`) plus Next.js `Image` with appropriate `sizes`.
- Prefer transformed widths that match layout (card ~720, featured ~1200, compact ~320).

### Bundle optimization

- Do not eagerly import Recharts into overview shells; use dynamic imports.
- Mock auth paths remain gated for production builds (`NEXT_PUBLIC_USE_REMOTE_API` / `ALLOW_MOCK_AUTH`).

### TanStack Query

Defaults (`QueryProvider`):

- `staleTime`: 60s
- `gcTime`: 5m
- `refetchOnWindowFocus`: false (notifications unread/list may still refetch on focus)
- Query retries skip HTTP 4xx (`ApiError.status < 500`); mutations do not retry
- Notification bell loads the preview list only when the popover is open

Keep query keys stable for products, cart, wishlist, library, orders, notifications, analytics, earnings, and payouts. Do not optimistically mark payments/payouts as successful.

## Backend

### API optimization

- Product **list** queries use a slim include (category/creator/images/_count) — no digital files and no review rows.
- Ratings for lists come from a single `Review.groupBy` over page IDs.
- Checkout loads cart products once and batches ownership checks with `purchase.findMany({ productId: { in } })`.
- Search relevance scores a capped candidate set (250) with a slim `select`, then hydrates only the current page with the list serializer.
- `minRating` filters use SQL `HAVING AVG(rating)` instead of loading all review rows into Node.
- JSON body limit remains `1mb`. Prisma uses a process singleton (`config/database.ts`).

### Pagination

- `parsePagination` defaults to page size 20 and caps at **48**.
- List endpoints for products, orders, reviews, wishlist, notifications, earnings, payouts, reports, and audit logs must stay bounded.

### Response shaping

- List/card payloads omit full description text and file metadata.
- Detail/manage endpoints still return files and status when authorized.

### Concurrency

- Independent reads use `Promise.all` (e.g. search creators + categories).
- Keep Prisma transactions short; do not hold them open across Razorpay/Cloudinary/email network calls.

## Database

### Indexes

Indexes follow real list/filter patterns (status + createdAt, creatorId + status, productId + status, notification userId + readAt, earnings/payout composites, etc.).

Added for order history:

- `Order(customerId, createdAt)`

Do not add indexes without a matching query pattern.

### Aggregation

- Creator/admin analytics use `$queryRaw` / DB-side aggregates (see `analytics.repository.ts`).
- Product list ratings use `groupBy`; min-rating filters use SQL averages.

### N+1 prevention

- Avoid per-item product/purchase queries in checkout.
- Avoid loading all published reviews into application memory for catalog pages.
- Wishlist/owned enrichment stays bulk (IDs), not per-card HTTP.

## Cloudinary

- Public images: transformation URL helpers on the web (`cloudinaryThumb`).
- Private digital files: short-lived signed delivery URLs from the library download endpoint — files are not buffered through the API.
- Upload MIME checks remain strict (no `application/octet-stream` bypass).

## Caching

### Safe to cache (short TTL)

- Public categories (`Cache-Control: public, max-age=60, stale-while-revalidate=300`)
- Featured / trending product lists (short public TTL)

### Never publicly cache

- Cart, checkout, orders, library, payments, earnings, payouts, admin data, notifications, or any authenticated user-specific payload

No Redis was introduced for caching.

## Monitoring

- `slow_request` structured logs when a request finishes in ≥500ms (`request-timing.middleware.ts`), with method, path (no query string), status, and duration.
- Existing `logEvent` covers auth/payment/webhook/payout paths without secrets, JWTs, cookies, or credentials.
- Prisma production logging is errors only (no permanent SQL dump).

## Remaining bottlenecks / future work

- Full-text / trigram indexes for PostgreSQL search if catalog size grows past ILIKE-on-OR.
- HTTP compression middleware (not added; avoid compressing already-compressed media if introduced).
- Further code-splitting of analytics secondary charts (Bar/Line still share the analytics route bundle).
- Progressive dashboard loading (summary → charts → tables) can be deepened where sections still wait on a single overview query.
- Measured load tests under production-like data volumes have not been run in this pass.

## Checklist

- [x] No obvious N+1 in checkout catalog hot paths
- [x] Major list APIs paginated / capped
- [x] Database indexes reviewed (+ order history composite)
- [x] Analytics use DB aggregation
- [x] Search candidate payload slimmed
- [x] API list payloads minimized
- [x] Prisma singleton verified
- [x] Transactions left short (no new long external calls inside tx)
- [x] TanStack Query retry/caching reviewed
- [x] Notification list gated on open; Discover featured gated
- [x] Search debounced (existing)
- [x] Cloudinary thumbs on ProductCard
- [x] Large files via signed URLs (existing)
- [x] Charts dynamically imported where practical
- [x] Slow-request logging
- [x] Security / financial invariants unchanged by this pass
