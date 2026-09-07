# Notifications + transactional email

## Architecture

In-app notifications and transactional emails share one modular path:

1. Business event (paid order, review, product moderation)
2. `notification.events.ts` creates an in-app `Notification` (unique `eventKey`)
3. Preference check via `NotificationPreference`
4. `EmailJob` queued (unique `eventKey`) when email is allowed
5. Lightweight in-process worker (`startEmailWorker`) processes pending jobs

No Kafka, Redis, or separate email microservice.

## Notification types

| Type | Trigger |
|------|---------|
| `PURCHASE_SUCCESS` | Order marked `PAID` after verified payment |
| `CREATOR_SALE` | Same; one per creator on the order (line attribution) |
| `REVIEW_RECEIVED` | Verified customer creates a review |
| `PRODUCT_APPROVED` | Admin sets product `PUBLISHED` |
| `PRODUCT_UNPUBLISHED` | Admin moves `PUBLISHED` → `DRAFT` |
| `PRODUCT_ARCHIVED` | Admin sets product `ARCHIVED` |
| `ACCOUNT_UPDATE` | Reserved; not emitted yet |

Not implemented (no supporting workflow yet): coupon expiry, marketing campaigns, password-change security alerts.

## Email templates

| Template | Use |
|----------|-----|
| `PURCHASE_CONFIRMATION` | Customer receipt → Library CTA |
| `CREATOR_SALE` | Creator sale → dashboard sales CTA |
| `REVIEW_RECEIVED` | Creator review alert |
| `PRODUCT_STATUS` | Moderation publish / unpublish / archive |

All user-generated strings are HTML-escaped. Emails never include permanent Cloudinary download URLs.

## Preferences

`GET/PATCH /api/v1/notification-preferences`

- Marketing off by default (`marketingEmailEnabled`)
- Optional transactional categories: purchase, creator sale, review, product moderation
- **Security emails always on** (clients cannot disable via API)

If a category is off, that email is not queued. In-app notifications are still created.

## Idempotency

Unique `eventKey` on both `Notification` and `EmailJob`:

- `purchase:{orderId}`
- `creator-sale:{orderId}:{creatorId}`
- `review:{reviewId}`
- `product-status:{productId}:{toStatus}`

Duplicate creates hit Prisma `P2002` and are ignored. Payment fulfillment only calls `notifyOrderPaid` when the order was not already paid.

## Retries

Email jobs: max 3 attempts. Delays: immediate → 1 minute → 5 minutes. Then `FAILED`.

Provider errors are stored on the job and logged; they are never returned to customers. Payment success does not depend on email delivery.

## Environment

```env
APP_URL=http://localhost:3000
EMAIL_PROVIDER=console
EMAIL_FROM=Lumen <noreply@example.com>
EMAIL_API_KEY=
EMAIL_WORKER_INTERVAL_MS=15000
```

- `EMAIL_PROVIDER=console` (default): logs outbound mail
- `EMAIL_PROVIDER=resend` + `EMAIL_API_KEY`: sends via Resend
- `APP_URL` falls back to `CLIENT_URL` for CTA links

## APIs

Authenticated (session user only):

- `GET /api/v1/notifications` — `page`, `limit`, `unread`, `type`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/:notificationId/read`
- `POST /api/v1/notifications/read-all`
- `DELETE /api/v1/notifications/:notificationId`
- `DELETE /api/v1/notifications`
- `GET /api/v1/notification-preferences`
- `PATCH /api/v1/notification-preferences`

Admin:

- `GET /api/v1/admin/email-jobs` — counts + recent failures (emails masked)
- `POST /api/v1/admin/email-jobs/process` — process up to 25 pending jobs

## Frontend

- Bell + popover in marketing header and creator studio shell
- `/notifications` — filterable notification center
- `/settings/notifications` — preference toggles
- TanStack Query hooks in `apps/web/src/hooks/use-notifications.ts`

## Testing

```bash
pnpm --filter @lumen/api test
```

Coverage includes auth, IDOR, preferences, queue idempotency, retries, multi-creator sale attribution, and admin email health.
