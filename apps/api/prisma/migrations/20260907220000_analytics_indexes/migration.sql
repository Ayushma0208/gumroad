-- Analytics query support: filter paid orders by time and attribute by creator/product.
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderItem_creatorId_productId_idx" ON "OrderItem"("creatorId", "productId");
