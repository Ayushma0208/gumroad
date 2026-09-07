/**
 * Security architecture for Lumen (creator marketplace API + web).
 *
 * This document describes implemented controls, deployment checklist, and
 * known limitations. It does not contain secrets.
 */

# Threat model (summary)

| Threat | Primary controls |
|---|---|
| Credential stuffing / brute force | bcrypt(12), login rate limit (in-memory), uniform login errors, timing-safe dummy hash |
| Stolen JWT / session replay | httpOnly cookie, HS256-only verify, `sessionVersion` bump on password change / close / suspend, 7d default TTL |
| CSRF (cookie auth) | `X-Lumen-Client: web` required on mutating methods; prefer `SameSite=Lax` + Next proxy |
| IDOR | Ownership from `req.user` (DB-backed role); order cross-tenant → 404 |
| Price / discount tampering | Server recalculates from Product + Coupon; client never sets totals |
| Webhook forgery | HMAC signature on raw body; amount/status checks before fulfill |
| Duplicate financial events | Payment row lock + Serializable fulfill; unique earnings; coupon FOR UPDATE |
| File abuse | Extension + MIME allowlists (no octet-stream bypass); server-derived Cloudinary folders |
| Privilege escalation | `requireAuth` + `requireRole`; role from DB not JWT |
| Enumeration | Generic signup conflict copy; login message uniform |
| Mock auth in production | Production builds require remote API; `ALLOW_MOCK_AUTH` rejected; mock `/api/auth/*` returns 404 when remote API is on |

# Authentication

- JWT in httpOnly cookie (`COOKIE_NAME`, default `lumen_session`)
- Claims: `sub`, `role` (informational), `sv` (sessionVersion)
- Authorization uses **database** `User.role` + `status` + `sessionVersion`
- Algorithms pinned to **HS256** on sign and verify
- Passwords: bcrypt cost 12; never returned or logged

# Cookies / CSRF / CORS

- Production cookies: `httpOnly`, `secure` when production or SameSite=none, configurable `COOKIE_SAME_SITE` (default **lax**)
- CORS: single origin `CLIENT_URL`, credentials true, allowlist includes `X-Lumen-Client`
- Mutating requests must send `X-Lumen-Client: web` (web client always sets this)
- Razorpay webhook is mounted **before** CSRF + JSON parser and verified by signature

# Rate limiting

In-process memory limiter (no Redis):

- `/auth/register`, `/auth/change-password`: 30 / 15 min / IP
- `/auth/login`: 20 / 15 min / IP+email

**Limitation:** multi-instance deployments do not share counters. Prefer edge/proxy limits (nginx, Cloudflare) in production.

# Payments

- Checkout prices from DB products
- Verify: signature + customer ownership + amount match
- Webhook: signature + amount/status checks + fulfill idempotency
- `fulfillPaidOrder`: `FOR UPDATE` on Payment + Serializable transaction
- Coupon redeem: lock coupon row, create redemption first, then increment `usedCount`

# Earnings / payouts

- Earnings posted only after PAID fulfill
- Creator cannot set ledger amounts/status
- Payouts: Serializable + `FOR UPDATE` on available earnings; failed payouts restore RESERVED → AVAILABLE
- Provider: MANUAL_REVIEW (no simulated Razorpay payout success)

# Files / Cloudinary

- Upload folders derived server-side from product/user ids
- Product files: allowlisted extensions + exact MIME match
- Downloads: purchase entitlement + short-lived signed URLs

# Admin

- All `/admin/*` behind `requireAuth` + `requireRole("ADMIN")`
- Mutations write `AdminAuditLog` (append-only via normal APIs)
- Suspend bumps `sessionVersion` (invalidates sessions)

# Error handling / logging

- Production 500 responses are generic (`Something went wrong`)
- No stack traces to clients
- Avoid logging cookies, passwords, provider secrets

# Production checklist

```text
[ ] HTTPS terminated correctly; secure cookies enabled
[ ] JWT_SECRET ≥ 32 chars, unique per environment
[ ] COOKIE_SAME_SITE=lax (or none + confirm CSRF header path)
[ ] CLIENT_URL exact frontend origin (no *)
[ ] NEXT_PUBLIC_USE_REMOTE_API=true in production web builds
[ ] Razorpay + Cloudinary secrets only on API
[ ] Helmet/HSTS enabled (API)
[ ] Proxy rate limits in front of auth endpoints
[ ] prisma migrate applied (including sessionVersion)
[ ] Security regression tests passing
[ ] Error monitoring without logging secrets
```

# Known limitations

1. In-memory rate limits are per process
2. Coupon `maxUses` can still be raced at **checkout** (discount on PENDING orders) before payment; redeem is serialized at fulfill
3. No password-reset / email-verification flow yet (UI stub only)
4. No distributed session store / refresh-token rotation
5. Frontend middleware only checks cookie presence (UX); API enforces auth
6. Upload MIME is still partially client-declared (multer); magic-byte sniffing not implemented
7. Search/download rate limits are not yet as aggressive as auth limits
8. Razorpay Route payouts not integrated — manual review only

# Related docs

- `apps/api/docs/creator-earnings-payouts.md`
- `apps/api/docs/account.md`
- `apps/api/docs/notifications.md`
