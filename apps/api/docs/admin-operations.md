# Admin operations

## Revenue definition

**Gross platform revenue** = `SUM(Order.totalAmount)` for orders with `status = PAID` in the selected range.

This is buyer-paid GMV after checkout discounts. The platform does **not** currently model platform fees or creator payouts, so the admin UI does not invent fee/net splits.

Creator revenue (creator analytics) remains line-item attributed via `OrderItem.creatorId` and may differ from platform GMV for multi-creator carts.

Timezone for ranges: UTC (shared with creator analytics via `analytics.dates.ts`).

## Authorization

All `/api/v1/admin/*` routes require authenticated `ADMIN` role.

Customer report creation: `POST /api/v1/reports` (authenticated any role).

Suspended users (`User.status = SUSPENDED`) cannot log in or use authenticated APIs.

## Audit log

Mutations write append-only `AdminAuditLog` rows (actor, action, target, safe metadata). Admins cannot delete audit rows via API.
