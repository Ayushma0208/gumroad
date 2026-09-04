-- AlterTable
CREATE INDEX "Product_productType_idx" ON "Product"("productType");

-- AlterTable
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- AlterTable
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");

-- AlterTable
CREATE INDEX "Product_status_categoryId_idx" ON "Product"("status", "categoryId");

-- AlterTable
CREATE INDEX "Product_status_featured_idx" ON "Product"("status", "featured");
