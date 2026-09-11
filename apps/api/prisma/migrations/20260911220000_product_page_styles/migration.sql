-- AlterTable
ALTER TABLE "Product" ADD COLUMN "pageTemplateId" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "Product" ADD COLUMN "pageStyle" JSONB;
ALTER TABLE "Product" ADD COLUMN "checkoutStyle" JSONB;
