import type { EmailTemplate, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { logEvent } from "../../utils/logger";
import { deliverEmail } from "./email.transport";
import {
  renderCreatorSale,
  renderProductStatus,
  renderPurchaseConfirmation,
  renderPayoutAccountUpdate,
  renderPayoutFailed,
  renderPayoutPaid,
  renderPayoutRequested,
  renderReviewReceived,
  type CreatorSaleEmailPayload,
  type ProductStatusEmailPayload,
  type PurchaseEmailPayload,
  type PayoutAccountEmailPayload,
  type PayoutEmailPayload,
  type ReviewEmailPayload,
} from "./email.templates";

const RETRY_DELAYS_MS = [0, 60_000, 5 * 60_000];

export async function queueEmail(input: {
  userId?: string | null;
  toEmail: string;
  type: string;
  template: EmailTemplate;
  subject: string;
  payload: Prisma.InputJsonValue;
  eventKey: string;
}) {
  try {
    const job = await prisma.emailJob.create({
      data: {
        userId: input.userId ?? null,
        toEmail: input.toEmail,
        type: input.type,
        template: input.template,
        subject: input.subject,
        payload: input.payload,
        eventKey: input.eventKey,
        status: "PENDING",
        nextAttemptAt: new Date(),
      },
    });
    logEvent("email_queued", {
      jobId: job.id,
      type: input.type,
      template: input.template,
    });
    return job;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      logEvent("email_queue_duplicate", { eventKey: input.eventKey });
      return null;
    }
    throw error;
  }
}

function renderJob(template: EmailTemplate, payload: unknown) {
  switch (template) {
    case "PURCHASE_CONFIRMATION":
      return renderPurchaseConfirmation(payload as PurchaseEmailPayload);
    case "CREATOR_SALE":
      return renderCreatorSale(payload as CreatorSaleEmailPayload);
    case "REVIEW_RECEIVED":
      return renderReviewReceived(payload as ReviewEmailPayload);
    case "PRODUCT_STATUS":
      return renderProductStatus(payload as ProductStatusEmailPayload);
    case "PAYOUT_REQUESTED":
      return renderPayoutRequested(payload as PayoutEmailPayload);
    case "PAYOUT_PAID":
      return renderPayoutPaid(payload as PayoutEmailPayload);
    case "PAYOUT_FAILED":
      return renderPayoutFailed(payload as PayoutEmailPayload);
    case "PAYOUT_ACCOUNT_UPDATE":
      return renderPayoutAccountUpdate(payload as PayoutAccountEmailPayload);
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

export async function processEmailJob(jobId: string) {
  const claimed = await prisma.emailJob.updateMany({
    where: {
      id: jobId,
      status: { in: ["PENDING", "FAILED"] },
      nextAttemptAt: { lte: new Date() },
    },
    data: { status: "SENDING" },
  });
  if (claimed.count === 0) return null;

  const job = await prisma.emailJob.findUnique({ where: { id: jobId } });
  if (!job) return null;

  try {
    const rendered = renderJob(job.template, job.payload);
    await deliverEmail({
      to: job.toEmail,
      subject: job.subject || rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    const updated = await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: "SENT",
        attempts: job.attempts + 1,
        sentAt: new Date(),
        lastError: null,
      },
    });
    logEvent("email_sent", { jobId: job.id, type: job.type });
    return updated;
  } catch (error) {
    const attempts = job.attempts + 1;
    const permanentlyFailed = attempts >= job.maxAttempts;
    const delay = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)] ?? 300_000;
    const message = error instanceof Error ? error.message.slice(0, 500) : "send_failed";
    const updated = await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: permanentlyFailed ? "FAILED" : "PENDING",
        attempts,
        lastError: message,
        nextAttemptAt: permanentlyFailed
          ? new Date()
          : new Date(Date.now() + delay),
      },
    });
    logEvent(permanentlyFailed ? "email_failed_final" : "email_retry", {
      jobId: job.id,
      attempts,
      error: message,
    });
    return updated;
  }
}

export async function processPendingEmails(limit = 20) {
  const pending = await prisma.emailJob.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
    select: { id: true },
  });
  const results = [];
  for (const job of pending) {
    results.push(await processEmailJob(job.id));
  }
  return results;
}

let workerTimer: ReturnType<typeof setInterval> | null = null;

export function startEmailWorker(intervalMs: number) {
  if (workerTimer || intervalMs <= 0) return;
  workerTimer = setInterval(() => {
    void processPendingEmails().catch((error) => {
      logEvent("email_worker_error", {
        error: error instanceof Error ? error.message : "unknown",
      });
    });
  }, intervalMs);
  workerTimer.unref?.();
}

export function stopEmailWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

export async function getEmailJobHealth() {
  const [pending, sending, sent, failed] = await Promise.all([
    prisma.emailJob.count({ where: { status: "PENDING" } }),
    prisma.emailJob.count({ where: { status: "SENDING" } }),
    prisma.emailJob.count({ where: { status: "SENT" } }),
    prisma.emailJob.count({ where: { status: "FAILED" } }),
  ]);
  const recentFailures = await prisma.emailJob.findMany({
    where: { status: "FAILED" },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      type: true,
      toEmail: true,
      attempts: true,
      lastError: true,
      updatedAt: true,
      createdAt: true,
    },
  });
  return {
    counts: { pending, sending, sent, failed },
    recentFailures: recentFailures.map((job) => ({
      id: job.id,
      type: job.type,
      // Mask email slightly for ops UI
      toEmail: job.toEmail.replace(/(.{2}).+(@.+)/, "$1***$2"),
      attempts: job.attempts,
      lastError: job.lastError,
      updatedAt: job.updatedAt.toISOString(),
      createdAt: job.createdAt.toISOString(),
    })),
  };
}
