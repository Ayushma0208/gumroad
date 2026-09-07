# Creator analytics definitions

All creator analytics endpoints live under:

```text
GET /api/v1/creators/me/analytics/*
```

`creatorId` is always derived from the authenticated user’s `CreatorProfile`. Clients must never send a trusted `creatorId`.

Timezone: **UTC calendar days**. Inclusive `from` / exclusive `to` (end of selected `to` day). Custom `from`/`to` are `YYYY-MM-DD`.

## Revenue

**Primary revenue** (net):

```text
grossLineRevenue − attributedDiscount
```

Where:

- **grossLineRevenue** = `SUM(OrderItem.price × OrderItem.quantity)` for items with `OrderItem.creatorId = me` on orders with `Order.status = PAID` in range.
- **attributedDiscount** = `SUM(CouponRedemption.discountAmount)` for redemptions of coupons owned by this creator (`Coupon.creatorId = me`) on PAID orders in range.

Pending, failed, cancelled, and unpaid Razorpay attempts are **not** revenue.

Refunded orders are **not** included in revenue totals (only counted under `refundedOrders` on product rows when `Order.status = REFUNDED`).

Time-series charts use **gross line revenue** per bucket (discount is reported at the period level only).

## Multi-creator carts

Attribution is **line-item based**. An order with Creator A and Creator B products contributes only A’s lines to A’s analytics.

A creator coupon only discounts that creator’s eligible lines at checkout; the stored `CouponRedemption.discountAmount` is attributed entirely to that coupon’s creator.

## Orders / units / customers

- **Orders**: distinct PAID `Order.id` that contain at least one of the creator’s items.
- **Units sold**: `SUM(quantity)` of those items.
- **Customers**: distinct `Order.customerId` among those paid orders in range.
- **New customers**: first-ever PAID purchase **from this creator** falls in range.
- **Returning customers**: customers in the period who have **more than one** PAID order from this creator (all-time).
- **Repeat purchase rate**: `returningCustomers / customers` (null if customers = 0).
- **AOV**: `revenue / orders` (0 if no orders).

## Comparisons

Each range is compared to the immediately previous window of equal length.

`percentageChange = (current − previous) / previous`. If previous is 0 and current > 0, change is `null` (“New”). Never `NaN` / `Infinity`.

## Platform fees / views

Not tracked. Conversion rate and product views are omitted until real event data exists.
