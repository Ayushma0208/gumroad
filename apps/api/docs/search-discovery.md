# Search & Discovery 2.0

## Architecture

Discovery remains a modular monolith feature:

- **Catalog listing** — `GET /api/v1/products` (filters, sort, pagination)
- **Unified search** — `GET /api/v1/search` (products + creators + categories)
- **Autocomplete** — `GET /api/v1/search/suggest`
- **Featured** — `GET /api/v1/products/featured` (`featured = true`)
- **Trending** — `GET /api/v1/products/trending` (flagged `trending` first, then sales/heuristic)

Frontend Discover (`/discover`) keeps **URL search params as source of truth**.

## Ranking (relevance)

When `q` is present and sort is `relevance` (default for queries):

1. Exact title / slug match — 2000
2. Title / slug prefix — 1200
3. Title / slug contains — 700
4. Creator store / display / slug — 220–400
5. Category label / slug — 120–180
6. Product type / short description / description — 25–80

Ties break on paid sales count. Candidate set is capped at 250 matching published products.

## Filters

| Param | Meaning |
|-------|---------|
| `q` / `search` | Text query (trimmed, max 120) |
| `category` | Category slug |
| `productType` | `DIGITAL_DOWNLOAD` \| `COURSE` \| `TEMPLATE` \| `BUNDLE` |
| `minPrice` / `maxPrice` | Integer minor units |
| `minRating` | Average published review rating |
| `creator` / `creatorSlug` | Creator storefront slug |
| `sort` | See below |
| `page` / `limit` | Pagination (`limit` max 48) |

Only `PUBLISHED` products are searchable. Draft/archived never appear.

## Sort options

| Sort | Definition |
|------|------------|
| `relevance` | Deterministic text score (requires `q`; else falls back to popular) |
| `popular` | Paid `orderItems` count desc |
| `trending` | `trending` flag desc, then sales |
| `newest` | `createdAt` desc |
| `rating` | Review count desc (not average — documented limitation) |
| `price_asc` / `price_desc` | Price |
| `featured` | Featured flag desc |

**Popular** = count of paid order line items for the product.

**Trending shelf** = products with `Product.trending = true` first, then filled by sales + recency heuristic among other published products.

## Featured

`Product.featured` (admin-controlled). Endpoint returns published + featured, newest first. Editor’s picks also use `editorsPick` on the product card badge / spotlight.

## Indexes

Existing list indexes plus:

- `Product_status_trending_idx` — trending sort / shelf

Search uses Prisma `contains` + `mode: insensitive` (ILIKE). No Elasticsearch.

## URL structure (web)

```text
/discover?q=notion&category=productivity&sort=popular&price=under-30&rating=4.5&type=template&page=2
```

Alias: `search` still accepted when reading; writes prefer `q`.

## Frontend

- Debounced autocomplete (250ms) with keyboard navigation
- Recent searches in `localStorage` (`lumen.recentSearches`) — non-sensitive terms only
- Filters sidebar / mobile sheet (existing)
- Product cards: Featured / Trending / New badges; Owned → Library when purchased
- Wishlist + cart reuse existing hooks

## Performance

- Pagination + selective includes
- Suggest queries limited (≤8 per group)
- Relevance scoring on capped candidate sets
- TanStack Query caching + placeholderData on Discover pages
- Category suggestion counts via `groupBy`

## Security

- Public endpoints only return published products and public creator fields (no email/payouts)
- Zod validation rejects abusive limits and invalid price ranges
- Parameterized Prisma queries only

## Future

- Full-text / trigram indexes if catalog grows large
- Denormalized average rating columns for true “highest rated” SQL sort
- Lightweight personalization from wishlist/purchase categories
- Analytics events (`SEARCH_PERFORMED`) if a product analytics bus is added
