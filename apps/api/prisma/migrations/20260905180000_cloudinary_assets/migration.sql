-- AlterTable ProductImage
ALTER TABLE "ProductImage" ADD COLUMN "publicId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProductImage" ADD COLUMN "width" INTEGER;
ALTER TABLE "ProductImage" ADD COLUMN "height" INTEGER;
ALTER TABLE "ProductImage" ADD COLUMN "format" TEXT;
ALTER TABLE "ProductImage" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable ProductFile
ALTER TABLE "ProductFile" ADD COLUMN "publicId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProductFile" ADD COLUMN "resourceType" TEXT NOT NULL DEFAULT 'raw';
ALTER TABLE "ProductFile" ADD COLUMN "format" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ProductFile" ADD COLUMN "version" INTEGER;
ALTER TABLE "ProductFile" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ProductFile" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProductFile" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "ProductFile" SET "publicId" = "storageKey" WHERE "publicId" = '' AND "storageKey" IS NOT NULL;
ALTER TABLE "ProductFile" DROP COLUMN "storageKey";

CREATE INDEX "ProductImage_publicId_idx" ON "ProductImage"("publicId");
CREATE INDEX "ProductFile_publicId_idx" ON "ProductFile"("publicId");

-- AlterTable CreatorProfile
ALTER TABLE "CreatorProfile" ADD COLUMN "avatarPublicId" TEXT;
ALTER TABLE "CreatorProfile" ADD COLUMN "banner" TEXT;
ALTER TABLE "CreatorProfile" ADD COLUMN "bannerPublicId" TEXT;

-- CreateTable Download
CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productFileId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Download_userId_idx" ON "Download"("userId");
CREATE INDEX "Download_productId_idx" ON "Download"("productId");
CREATE INDEX "Download_productFileId_idx" ON "Download"("productFileId");
CREATE INDEX "Download_orderId_idx" ON "Download"("orderId");
CREATE INDEX "Download_userId_createdAt_idx" ON "Download"("userId", "createdAt");

ALTER TABLE "Download" ADD CONSTRAINT "Download_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_productFileId_fkey" FOREIGN KEY ("productFileId") REFERENCES "ProductFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
