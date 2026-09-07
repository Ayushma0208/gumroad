-- Notifications + transactional email jobs

CREATE TYPE "NotificationType" AS ENUM (
  'PURCHASE_SUCCESS',
  'CREATOR_SALE',
  'REVIEW_RECEIVED',
  'PRODUCT_APPROVED',
  'PRODUCT_UNPUBLISHED',
  'PRODUCT_ARCHIVED',
  'ACCOUNT_UPDATE'
);

CREATE TYPE "EmailJobStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

CREATE TYPE "EmailTemplate" AS ENUM (
  'PURCHASE_CONFIRMATION',
  'CREATOR_SALE',
  'REVIEW_RECEIVED',
  'PRODUCT_STATUS'
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "eventKey" TEXT,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_eventKey_key" ON "Notification"("eventKey");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketingEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "purchaseEmails" BOOLEAN NOT NULL DEFAULT true,
    "creatorSaleEmails" BOOLEAN NOT NULL DEFAULT true,
    "reviewEmails" BOOLEAN NOT NULL DEFAULT true,
    "productModerationEmails" BOOLEAN NOT NULL DEFAULT true,
    "securityEmails" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" "EmailTemplate" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "eventKey" TEXT NOT NULL,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailJob_eventKey_key" ON "EmailJob"("eventKey");
CREATE INDEX "EmailJob_status_nextAttemptAt_idx" ON "EmailJob"("status", "nextAttemptAt");
CREATE INDEX "EmailJob_userId_createdAt_idx" ON "EmailJob"("userId", "createdAt");
CREATE INDEX "EmailJob_createdAt_idx" ON "EmailJob"("createdAt");

ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
