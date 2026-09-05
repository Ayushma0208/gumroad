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
- `asha@example.com` — CREATOR
- `leah@example.com` — CUSTOMER

## Cart

All cart routes require the `lumen_session` cookie and the **CUSTOMER** role.

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/cart` | — | `{ id, items[], summary }` | 401, 403 |
| POST | `/api/v1/cart/items` | `{ productId, quantity? }` | 201 cart | 400 unpublished / digital qty, 403 own product, 404 missing, 409 already owned |
| PATCH | `/api/v1/cart/items/:itemId` | `{ quantity }` | cart | 400, 404 other user's item |
| DELETE | `/api/v1/cart/items/:itemId` | — | cart | 404 other user's item |
| DELETE | `/api/v1/cart` | — | empty cart | 401, 403 |

`quantity` defaults to `1`. Current catalog types are digital, so quantity stays at `1`. Totals are computed server-side from catalog prices (cents in DB, dollars + `*Cents` in JSON). Duplicate adds reuse the existing line. A `Purchase` entitlement for the same product cannot be added again.

## Checkout and Razorpay

Prices are stored in minor units (cents / paise). Razorpay amounts use the same integer. Catalog currencies **INR** and **USD** are charged as-is (no fake FX). Seed products are mostly **USD**; a Razorpay test account may be INR-only.

Never send `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` to the browser. Only `keyId` is returned from checkout.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/v1/checkout/create-order` | CUSTOMER cookie | Builds a PENDING order from the **server cart** and a Razorpay order. Returns `{ orderId, razorpayOrderId, amount, currency, keyId }`. Reuses a recent pending order for the same cart. |
| POST | `/api/v1/payments/razorpay/verify` | CUSTOMER cookie | HMAC body `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`. Marks Payment + Order **PAID**, writes `Purchase` rows, **then** clears the cart. Idempotent. |
| POST | `/api/v1/payments/razorpay/webhook` | Razorpay signature | **No JWT.** `express.raw` before JSON. Events: `payment.captured`, `order.paid`, `payment.failed`. |
| GET | `/api/v1/orders` | cookie | Own orders (ADMIN: all). |
| GET | `/api/v1/orders/:id` | cookie | Own order only. |
| GET | `/api/v1/orders/purchases` | cookie | Entitlements for the library. |

### Local payment testing

1. Put Razorpay **test** Key ID, Key Secret, and webhook secret in `apps/api/.env`.
2. `pnpm --filter @lumen/api dev` and `pnpm --filter @lumen/web dev` with `NEXT_PUBLIC_USE_REMOTE_AUTH=true`.
3. Log in as `leah@example.com` / `password12` (CUSTOMER). Creators cannot checkout.
4. Add a product, open `/checkout`, pay with [Razorpay test cards](https://razorpay.com/docs/payments/payments/test-card-details/).
5. Success is only after `/payments/razorpay/verify`. Dismissing Checkout leaves the cart intact.
6. Local webhooks: tunnel the API to `POST /api/v1/payments/razorpay/webhook`.

Example `GET /api/v1/cart`:

```json
{
  "success": true,
  "data": {
    "id": "cart_id",
    "items": [
      {
        "id": "item_id",
        "quantity": 1,
        "subtotal": 79,
        "product": {
          "title": "Northline UI System",
          "price": 79,
          "currency": "USD",
          "creator": { "storeName": "Northline Studio" }
        }
      }
    ],
    "summary": {
      "subtotal": 79,
      "discount": 0,
      "total": 79,
      "currency": "USD",
      "itemCount": 1
    }
  }
}
```
