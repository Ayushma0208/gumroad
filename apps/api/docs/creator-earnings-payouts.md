# Creator Earnings + Payouts

Production-oriented financial ledger for creator balances. Money is stored and calculated in **integer minor units** (cents / paise). Earnings are posted only after a Razorpay payment is verified and the order is `PAID`.

## Architecture

```text
Gross line sales (OrderItem.price × qty)
        ↓
Discount allocation (coupon eligibility + proportional split)
        ↓
Net sales
        ↓
Platform fee (PLATFORM_FEE_BPS snapshot)
        ↓
Creator earning (CreatorEarning ledger row)
        ↓
PENDING → AVAILABLE (holding period)
        ↓
Payout request → RESERVED earnings
        ↓
Admin MANUAL_REVIEW settlement → PAID | FAILED (restore AVAILABLE)
```

**Analytics revenue ≠ available balance.** Analytics uses paid-line GMV minus creator coupon discounts (pre-platform-fee). Available balance is creator net after fees, after holding, not reserved or already paid out.

## Models

| Model | Role |
|---|---|
| `CreatorEarning` | Append-mostly ledger credit per paid `OrderItem` |
| `CreatorPayoutAccount` | Minimal payout profile metadata |
| `Payout` | Withdrawal request |
| `PayoutItem` | Links payout ↔ earnings (`earningId` unique) |

Migration: `apps/api/prisma/migrations/20260907260000_creator_earnings_payouts`

### CreatorEarning statuses

- `PENDING` — holding period not elapsed
- `AVAILABLE` — eligible for payout
- `RESERVED` — locked in an open payout
- `PAID` — included in a successful payout
- `REVERSED` — reserved for future refund compensating entries (refund engine not implemented)

### Idempotency

- Unique `orderItemId` and `ledgerKey = earning:orderItem:{orderItemId}`
- Duplicate verify/webhook cannot double-post earnings
- Payout `idempotencyKey` unique; Serializable transaction + `FOR UPDATE` on available earnings

## Money

- Representation: `Int` minor units (same as Product/Order/Payment)
- Helpers: `apps/api/src/utils/money.ts` (`Money.add/subtract/feeFromBps`, `allocateDiscountCents`)
- Rounding: **floor** for fee BPS and proportional discount shares; remainder on last sorted line id
- Currency: `USD` | `INR` (2 decimal places)
- Never trust frontend-calculated amounts for balances or payouts

## Fees + discounts

- **Platform fee:** `PLATFORM_FEE_BPS` (default **0**). Snapshot on each earning as `platformFeeBps`. **Not a confirmed business take rate.**
- **Processing fee:** field exists (`processingFeeCents`), always `0` today (Razorpay fee not attributed per creator)
- **Discount allocation:** same eligibility as checkout coupons (`eligibleLinesForCoupon`), then proportional by eligible line gross. Documented deterministic rule when multi-creator carts use a creator-scoped coupon (only that creator’s lines).

## Holding / minimum payout (assumptions)

| Env | Default | Note |
|---|---|---|
| `PLATFORM_FEE_BPS` | `0` | Needs finance approval |
| `PAYOUT_HOLDING_PERIOD_HOURS` | `168` (7 days) | Configurable assumption |
| `MIN_PAYOUT_AMOUNT_CENTS` | `1000` | Configurable assumption |

## Creator attribution

Multi-creator orders post **one earning per OrderItem**. Creator A only receives lines with `OrderItem.creatorId = A`.

## APIs

### Creator (auth: CREATOR/ADMIN, ownership via `req.user.id`)

- `GET /api/v1/creators/me/earnings/summary`
- `GET /api/v1/creators/me/earnings`
- `GET /api/v1/creators/me/payouts`
- `GET /api/v1/creators/me/payouts/:payoutId`
- `POST /api/v1/creators/me/payouts` `{ amountCents, idempotencyKey? }`
- `GET /api/v1/creators/me/payouts/account`
- `PUT /api/v1/creators/me/payouts/account` `{ accountHolderName, accountHint? }`

### Admin

- `GET /api/v1/admin/payouts`
- `GET /api/v1/admin/payouts/:payoutId`
- `PATCH /api/v1/admin/payouts/:payoutId/status` `{ status, failureMessage?, providerPayoutId? }`
- `PATCH /api/v1/admin/creators/:creatorId/payout-account` `{ status: VERIFIED \| DISABLED }`
- `GET /api/v1/admin/earnings`

## Payout lifecycle

```text
REQUESTED ──► PROCESSING ──► PAID
    │              │
    ├──► PAID      └──► FAILED  (RESERVED → AVAILABLE)
    ├──► FAILED
    └──► CANCELLED
```

Provider today: **`MANUAL_REVIEW` only**. Razorpay is checkout capture only — **no Route / Linked Accounts / payout API**. Admin marks `PAID` after an external transfer. There is **no simulated auto-success**.

Failed/cancelled payouts restore `RESERVED` earnings to `AVAILABLE` atomically.

## Notifications + email

Events (security-category emails):

- `PAYOUT_REQUESTED`
- `PAYOUT_PAID`
- `PAYOUT_FAILED`
- `PAYOUT_ACCOUNT_UPDATE`

No bank credentials in emails.

## Admin audit

- `PAYOUT_MARKED_PROCESSING`
- `PAYOUT_MARKED_PAID`
- `PAYOUT_MARKED_FAILED`
- `PAYOUT_ACCOUNT_VERIFIED`
- `PAYOUT_ACCOUNT_DISABLED`

No generic “change balance” endpoint.

## Refunds

Order/Payment have `REFUNDED` enums, but **no refund execution path**. Ledger supports future `REVERSED` / compensating rows; do not overwrite historical credits.

## Invariants

1. `creatorAmountCents = netSales − platformFee − processingFee ≥ 0` at post time
2. Sum of discount allocations ≤ order discount; per-line discount ≤ line gross
3. An earning appears in at most one `PayoutItem`
4. Concurrent payouts cannot double-spend available earnings (Serializable + row lock)
5. Balance view: `pending + available + reserved + paid` covers non-reversed creator amounts for the wallet currency

## UI

- `/dashboard/earnings` — summary, ledger, withdraw
- `/dashboard/payouts`, `/dashboard/payouts/[id]`
- `/dashboard/settings/payouts`
- `/admin/payouts`, `/admin/payouts/[payoutId]`
- Overview cards for available / pending / paid out

## Limitations

- No Razorpay Route / automated payouts
- No per-line discount stored on OrderItem at checkout (allocated at earn-time)
- Mixed-currency available wallets cannot be paid out in one request
- Whole-earning FIFO allocation only (no split of a single earning)
- Refunds not implemented
- Holding period / fee BPS / min payout are **config defaults pending product/finance confirmation**
