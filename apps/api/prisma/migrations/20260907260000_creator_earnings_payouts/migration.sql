-- CreateEnum
CREATE TYPE "CreatorEarningStatus" AS ENUM ('PENDING', 'AVAILABLE', 'RESERVED', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutProvider" AS ENUM ('MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "PayoutAccountStatus" AS ENUM ('NOT_CONFIGURED', 'PENDING_REVIEW', 'VERIFIED', 'DISABLED');

-- AlterEnum
ALTER TYPE "AdminAuditAction" ADD VALUE 'PAYOUT_MARKED_PROCESSING';
ALTER TYPE "AdminAuditAction" ADD VALUE 'PAYOUT_MARKED_PAID';
ALTER TYPE "AdminAuditAction" ADD VALUE 'PAYOUT_MARKED_FAILED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'PAYOUT_ACCOUNT_VERIFIED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'PAYOUT_ACCOUNT_DISABLED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_PAID';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_ACCOUNT_UPDATE';

-- AlterEnum
ALTER TYPE "EmailTemplate" ADD VALUE 'PAYOUT_REQUESTED';
ALTER TYPE "EmailTemplate" ADD VALUE 'PAYOUT_PAID';
ALTER TYPE "EmailTemplate" ADD VALUE 'PAYOUT_FAILED';
ALTER TYPE "EmailTemplate" ADD VALUE 'PAYOUT_ACCOUNT_UPDATE';

-- CreateTable
CREATE TABLE "CreatorEarning" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "grossAmountCents" INTEGER NOT NULL,
    "discountAmountCents" INTEGER NOT NULL,
    "netSalesCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "platformFeeBps" INTEGER NOT NULL,
    "processingFeeCents" INTEGER NOT NULL DEFAULT 0,
    "creatorAmountCents" INTEGER NOT NULL,
    "status" "CreatorEarningStatus" NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL,
    "ledgerKey" TEXT NOT NULL,
    "reversesEarningId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPayoutAccount" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" "PayoutAccountStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "provider" "PayoutProvider" NOT NULL DEFAULT 'MANUAL_REVIEW',
    "accountHolderName" TEXT,
    "accountHint" TEXT,
    "providerAccountId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorPayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "PayoutStatus" NOT NULL,
    "provider" "PayoutProvider" NOT NULL DEFAULT 'MANUAL_REVIEW',
    "providerPayoutId" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutItem" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "earningId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorEarning_orderItemId_key" ON "CreatorEarning"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorEarning_ledgerKey_key" ON "CreatorEarning"("ledgerKey");

-- CreateIndex
CREATE INDEX "CreatorEarning_creatorId_createdAt_idx" ON "CreatorEarning"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "CreatorEarning_creatorId_status_idx" ON "CreatorEarning"("creatorId", "status");

-- CreateIndex
CREATE INDEX "CreatorEarning_orderId_idx" ON "CreatorEarning"("orderId");

-- CreateIndex
CREATE INDEX "CreatorEarning_productId_idx" ON "CreatorEarning"("productId");

-- CreateIndex
CREATE INDEX "CreatorEarning_creatorId_status_availableAt_idx" ON "CreatorEarning"("creatorId", "status", "availableAt");

-- CreateIndex
CREATE INDEX "CreatorEarning_availableAt_idx" ON "CreatorEarning"("availableAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorPayoutAccount_creatorId_key" ON "CreatorPayoutAccount"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_providerPayoutId_key" ON "Payout"("providerPayoutId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_idempotencyKey_key" ON "Payout"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payout_creatorId_createdAt_idx" ON "Payout"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "Payout_creatorId_status_idx" ON "Payout"("creatorId", "status");

-- CreateIndex
CREATE INDEX "Payout_status_createdAt_idx" ON "Payout"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutItem_earningId_key" ON "PayoutItem"("earningId");

-- CreateIndex
CREATE INDEX "PayoutItem_payoutId_idx" ON "PayoutItem"("payoutId");

-- AddForeignKey
ALTER TABLE "CreatorEarning" ADD CONSTRAINT "CreatorEarning_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEarning" ADD CONSTRAINT "CreatorEarning_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEarning" ADD CONSTRAINT "CreatorEarning_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEarning" ADD CONSTRAINT "CreatorEarning_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorEarning" ADD CONSTRAINT "CreatorEarning_reversesEarningId_fkey" FOREIGN KEY ("reversesEarningId") REFERENCES "CreatorEarning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayoutAccount" ADD CONSTRAINT "CreatorPayoutAccount_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutItem" ADD CONSTRAINT "PayoutItem_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutItem" ADD CONSTRAINT "PayoutItem_earningId_fkey" FOREIGN KEY ("earningId") REFERENCES "CreatorEarning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
