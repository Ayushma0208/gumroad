# Coupons & checkout pricing

## Lifecycle

1. Creator creates a coupon (`POST /api/v1/coupons`) owned by their `CreatorProfile`.
2. Customer enters a code on checkout; `POST /api/v1/checkout/preview` validates and prices.
3. `POST /api/v1/checkout/create-order` **revalidates** the coupon, snapshots `couponId` / `couponCode` / `discount` on the Order, and creates a Razorpay order for the **final** total.
4. After Razorpay verify/webhook, `fulfillPaidOrder` marks the order PAID, creates purchases, clears the cart, then `redeemCouponForPaidOrder` inserts `CouponRedemption` and atomically increments `usedCount`.

Preview and abandoned checkouts **do not** consume usage.

## Validation (`coupon.service.ts`)

Checks (in order): exists → active → startsAt → expiresAt → global maxUses → per-user redemptions → min eligible subtotal → product/creator scope → discount > 0.

Codes are normalized to uppercase. Codes are **globally unique**.

## Pricing pipeline

```text
Cart lines (DB prices)
 → eligible lines for coupon
 → eligibleSubtotal
 → discount (percentage with optional maxDiscount, or fixed)
 → cartSubtotal − discount = finalTotal (≥ 0)
 → Order + Razorpay amount
```

Discount applies only to eligible lines; other cart lines stay full price.

## Idempotency & concurrency

- `CouponRedemption.orderId` is unique — webhook replay cannot double-redeem.
- `usedCount` increments with `UPDATE … WHERE maxUses IS NULL OR usedCount < maxUses`.
- Purchases use `createMany({ skipDuplicates: true })` as before.

## Ownership

Creator APIs derive `creatorId` from the session. Product attachments must belong to that creator. Customers never send discount amounts — only an optional `couponCode`.
