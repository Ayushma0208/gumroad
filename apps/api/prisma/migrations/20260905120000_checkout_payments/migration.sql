-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PAID';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "subtotal" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "discount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "checkoutKey" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "productTitle" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "providerOrderId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Payment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Payment" ALTER COLUMN "providerPaymentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_customerId_status_idx" ON "Order"("customerId", "status");
CREATE INDEX "Order_checkoutKey_idx" ON "Order"("checkoutKey");
CREATE UNIQUE INDEX "Order_one_pending_per_customer" ON "Order"("customerId") WHERE "status" = 'PENDING';
CREATE UNIQUE INDEX "Payment_providerOrderId_key" ON "Payment"("providerOrderId");
CREATE INDEX "Payment_providerOrderId_idx" ON "Payment"("providerOrderId");

-- Backfill
UPDATE "Order" SET "subtotal" = "totalAmount" WHERE "subtotal" = 0;

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Purchase_userId_productId_key" ON "Purchase"("userId", "productId");
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");
CREATE INDEX "Purchase_productId_idx" ON "Purchase"("productId");
CREATE INDEX "Purchase_orderId_idx" ON "Purchase"("orderId");

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
