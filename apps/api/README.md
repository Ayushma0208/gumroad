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

`quantity` defaults to `1`. Current catalog types are digital, so quantity stays at `1`. Totals are computed server-side from catalog prices (cents in DB, dollars + `*Cents` in JSON). Duplicate adds reuse the existing line. Paid `OrderItem`s cannot be added again.

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
