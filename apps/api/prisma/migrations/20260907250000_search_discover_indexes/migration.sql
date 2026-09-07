-- Discover 2.0: support sort=trending and trending shelf queries
CREATE INDEX IF NOT EXISTS "Product_status_trending_idx" ON "Product"("status", "trending");
