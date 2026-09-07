# Architecture

Lumen is a **modular monolith**: one Express API and one Next.js frontend. Money is stored as integer minor units (cents/paise). Auth is JWT in an httpOnly cookie (`lumen_session`).

## Boundaries

```text
Browser (Next.js)
  ├─ same-origin /api/v1/*  →  rewrite → Express API
  └─ Cookie: lumen_session (+ X-Lumen-Client on mutations)

Express /api/v1
  ├─ Auth, Users, Creators, Products, Categories, Search
  ├─ Cart, Checkout, Payments (Razorpay), Orders, Library
  ├─ Reviews, Wishlist, Coupons, Notifications, EmailJob
  ├─ Analytics, Earnings, Payouts
  └─ Admin + AuditLog
```

## Roles

| Role | Capabilities |
|------|----------------|
| CUSTOMER | Buy, library, reviews, wishlist, account |
| CREATOR | All buyer flows + studio, products, coupons, analytics, earnings/payouts |
| ADMIN | Platform moderation, users, payouts ops, audit |

Becoming a creator upgrades `User.role` to `CREATOR` (they keep purchase ability).

## Money & entitlements

```text
Cart (server prices)
 → Order + Payment (PENDING)
 → Razorpay order
 → verify / webhook (signature + amount)
 → Order PAID + Purchase rows + CreatorEarning ledger
 → Library signed downloads
```

Frontend “payment success” is never authoritative.

## Storage

- Product covers/gallery: Cloudinary public transforms
- Digital files: Cloudinary private assets; API issues short TTL signed URLs after purchase check

## Intentionally not present

Redis, S3, Stripe, Elasticsearch, Kafka/microservices — not part of the runtime.
