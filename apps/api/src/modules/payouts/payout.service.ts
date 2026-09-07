import { createHash, randomUUID } from "node:crypto";
import type { Currency, PayoutStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../utils/app-error";
import { Money } from "../../utils/money";
import { writeAuditLog } from "../admin/admin.audit";
import { promoteAvailableEarnings } from "../earnings/earnings.ledger";
import {
  notifyPayoutAccountUpdated,
  notifyPayoutFailed,
  notifyPayoutPaid,
  notifyPayoutRequested,
} from "../notifications/notification.events";

function moneyFields(cents: number) {
  return {
    cents,
    amount: Number((cents / 100).toFixed(2)),
  };
}

async function requireCreatorId(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  });
  if (!profile) throw notFound("Create a store first.");
  return profile;
}

function serializePayoutAccount(
  account: {
    status: string;
    provider: string;
    accountHolderName: string | null;
    accountHint: string | null;
    providerAccountId: string | null;
    verifiedAt: Date | null;
    updatedAt: Date;
  } | null,
) {
  if (!account) {
    return {
      status: "NOT_CONFIGURED" as const,
      provider: "MANUAL_REVIEW" as const,
      accountHolderName: null,
      accountHint: null,
      hasProviderAccount: false,
      verifiedAt: null,
      updatedAt: null,
      canRequestPayout: false,
    };
  }
  return {
    status: account.status,
    provider: account.provider,
    accountHolderName: account.accountHolderName,
    accountHint: account.accountHint,
    hasProviderAccount: Boolean(account.providerAccountId),
    verifiedAt: account.verifiedAt?.toISOString() ?? null,
    updatedAt: account.updatedAt.toISOString(),
    canRequestPayout: account.status === "VERIFIED",
  };
}

function serializePayout(payout: {
  id: string;
  amountCents: number;
  currency: Currency;
  status: PayoutStatus;
  provider: string;
  providerPayoutId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  createdAt: Date;
  items?: Array<{
    id: string;
    amountCents: number;
    earning: {
      id: string;
      orderId: string;
      productId: string;
      product: { title: string; slug: string };
    };
  }>;
  creator?: { id: string; storeName: string; slug: string };
}) {
  return {
    id: payout.id,
    amount: moneyFields(payout.amountCents),
    currency: payout.currency,
    status: payout.status,
    provider: payout.provider,
    reference: payout.providerPayoutId ?? payout.id,
    failureCode: payout.failureCode,
    failureMessage: payout.failureMessage,
    requestedAt: payout.requestedAt.toISOString(),
    processedAt: payout.processedAt?.toISOString() ?? null,
    createdAt: payout.createdAt.toISOString(),
    ...(payout.creator ? { creator: payout.creator } : {}),
    ...(payout.items
      ? {
          items: payout.items.map((item) => ({
            id: item.id,
            amount: moneyFields(item.amountCents),
            earningId: item.earning.id,
            orderId: item.earning.orderId,
            product: item.earning.product,
          })),
        }
      : {}),
  };
}

export async function getPayoutAccountForUser(userId: string) {
  const creator = await requireCreatorId(userId);
  const account = await prisma.creatorPayoutAccount.findUnique({
    where: { creatorId: creator.id },
  });
  return serializePayoutAccount(account);
}

export async function upsertPayoutAccountForUser(
  userId: string,
  input: { accountHolderName: string; accountHint?: string | null },
) {
  const creator = await requireCreatorId(userId);
  const name = input.accountHolderName.trim();
  if (name.length < 2) {
    throw badRequest("Account holder name is required.");
  }
  const hint = input.accountHint?.trim() || null;
  if (hint && hint.length > 64) {
    throw badRequest("Account hint is too long.");
  }

  const existing = await prisma.creatorPayoutAccount.findUnique({
    where: { creatorId: creator.id },
  });
  if (existing?.status === "DISABLED") {
    throw forbidden("Your payout account is disabled. Contact support.");
  }

  const account = await prisma.creatorPayoutAccount.upsert({
    where: { creatorId: creator.id },
    create: {
      creatorId: creator.id,
      accountHolderName: name,
      accountHint: hint,
      status: "PENDING_REVIEW",
      provider: "MANUAL_REVIEW",
    },
    update: {
      accountHolderName: name,
      accountHint: hint,
      // Re-submit for review unless already verified (metadata-only update keeps VERIFIED).
      ...(existing?.status === "VERIFIED"
        ? {}
        : { status: "PENDING_REVIEW", verifiedAt: null }),
    },
  });

  void notifyPayoutAccountUpdated(creator.id, account.status);
  return serializePayoutAccount(account);
}

/**
 * Request a payout. Consumes whole AVAILABLE earnings FIFO up to amountCents.
 * Provider: MANUAL_REVIEW — does not simulate a bank transfer.
 */
export async function requestPayoutForUser(
  userId: string,
  input: { amountCents: number; idempotencyKey?: string },
) {
  const creator = await requireCreatorId(userId);
  Money.assertNonNegative(input.amountCents, "amountCents");
  if (input.amountCents <= 0) {
    throw badRequest("Payout amount must be greater than zero.");
  }
  if (input.amountCents < env.MIN_PAYOUT_AMOUNT_CENTS) {
    throw badRequest(
      `Minimum payout is ${env.MIN_PAYOUT_AMOUNT_CENTS} minor units.`,
    );
  }

  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    `payout:${creator.id}:${randomUUID()}`;

  const existingByKey = await prisma.payout.findUnique({
    where: { idempotencyKey },
    include: {
      items: {
        include: {
          earning: {
            include: { product: { select: { title: true, slug: true } } },
          },
        },
      },
    },
  });
  if (existingByKey) {
    if (existingByKey.creatorId !== creator.id) {
      throw forbidden("Invalid idempotency key.");
    }
    return serializePayout(existingByKey);
  }

  try {
    const payout = await prisma.$transaction(
      async (tx) => {
        await promoteAvailableEarnings(tx, creator.id);

        const account = await tx.creatorPayoutAccount.findUnique({
          where: { creatorId: creator.id },
        });
        if (!account || account.status !== "VERIFIED") {
          throw badRequest(
            "Connect and verify a payout account before requesting a payout.",
          );
        }

        const open = await tx.payout.findFirst({
          where: {
            creatorId: creator.id,
            status: { in: ["REQUESTED", "PROCESSING"] },
          },
        });
        if (open) {
          throw conflict(
            "You already have a payout in progress. Wait for it to finish.",
          );
        }

        // Lock available earnings for this creator (Postgres).
        const locked = await tx.$queryRaw<
          Array<{
            id: string;
            creatorAmountCents: number;
            currency: Currency;
          }>
        >`
          SELECT id, "creatorAmountCents", currency
          FROM "CreatorEarning"
          WHERE "creatorId" = ${creator.id}
            AND status = 'AVAILABLE'::"CreatorEarningStatus"
          ORDER BY "availableAt" ASC, id ASC
          FOR UPDATE
        `;

        if (locked.length === 0) {
          throw badRequest("No available balance to withdraw.");
        }

        const currency = locked[0]!.currency;
        if (locked.some((row) => row.currency !== currency)) {
          throw badRequest(
            "Mixed-currency available balance is not supported for payouts yet.",
          );
        }

        const selected: typeof locked = [];
        let running = 0;
        for (const row of locked) {
          const next = Money.add(running, row.creatorAmountCents);
          if (next > input.amountCents) {
            break;
          }
          selected.push(row);
          running = next;
          if (running === input.amountCents) break;
        }

        if (running === 0) {
          const first = locked[0]!.creatorAmountCents;
          throw badRequest(
            `Payouts consume whole earnings only. Smallest available earning is ${first} minor units.`,
            { allocatableCents: 0, smallestEarningCents: first },
          );
        }
        if (running !== input.amountCents) {
          throw badRequest(
            `Payouts consume whole earnings only (FIFO). Closest amount at or under your request is ${running} minor units.`,
            { allocatableCents: running },
          );
        }

        const created = await tx.payout.create({
          data: {
            creatorId: creator.id,
            amountCents: running,
            currency,
            status: "REQUESTED",
            provider: "MANUAL_REVIEW",
            idempotencyKey,
            items: {
              create: selected.map((row) => ({
                earningId: row.id,
                amountCents: row.creatorAmountCents,
              })),
            },
          },
          include: {
            items: {
              include: {
                earning: {
                  include: { product: { select: { title: true, slug: true } } },
                },
              },
            },
          },
        });

        await tx.creatorEarning.updateMany({
          where: { id: { in: selected.map((row) => row.id) } },
          data: { status: "RESERVED" },
        });

        return created;
      },
      { isolationLevel: "Serializable" },
    );

    void notifyPayoutRequested(payout.id);
    return serializePayout(payout);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const again = await prisma.payout.findUnique({
        where: { idempotencyKey },
        include: {
          items: {
            include: {
              earning: {
                include: { product: { select: { title: true, slug: true } } },
              },
            },
          },
        },
      });
      if (again && again.creatorId === creator.id) return serializePayout(again);
    }
    throw error;
  }
}

export async function listPayoutsForUser(
  userId: string,
  query: { page: number; pageSize: number; status?: PayoutStatus },
) {
  const creator = await requireCreatorId(userId);
  const where: Prisma.PayoutWhereInput = {
    creatorId: creator.id,
    ...(query.status ? { status: query.status } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.payout.count({ where }),
    prisma.payout.findMany({
      where,
      orderBy: [{ requestedAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return {
    items: items.map((row) => serializePayout(row)),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getPayoutForUser(userId: string, payoutId: string) {
  const creator = await requireCreatorId(userId);
  const payout = await prisma.payout.findFirst({
    where: { id: payoutId, creatorId: creator.id },
    include: {
      items: {
        include: {
          earning: {
            include: { product: { select: { title: true, slug: true } } },
          },
        },
      },
    },
  });
  if (!payout) throw notFound("Payout not found");
  return serializePayout(payout);
}

const ADMIN_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  REQUESTED: ["PROCESSING", "PAID", "FAILED", "CANCELLED"],
  PROCESSING: ["PAID", "FAILED"],
  PAID: [],
  FAILED: [],
  CANCELLED: [],
};

export async function adminListPayouts(query: {
  page: number;
  pageSize: number;
  status?: PayoutStatus;
  creatorId?: string;
}) {
  const where: Prisma.PayoutWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.creatorId ? { creatorId: query.creatorId } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.payout.count({ where }),
    prisma.payout.findMany({
      where,
      orderBy: [{ requestedAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        creator: { select: { id: true, storeName: true, slug: true } },
      },
    }),
  ]);
  return {
    items: items.map((row) => serializePayout(row)),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function adminGetPayout(payoutId: string) {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      creator: { select: { id: true, storeName: true, slug: true } },
      items: {
        include: {
          earning: {
            include: { product: { select: { title: true, slug: true } } },
          },
        },
      },
    },
  });
  if (!payout) throw notFound("Payout not found");
  return serializePayout(payout);
}

export async function adminUpdatePayoutStatus(input: {
  adminId: string;
  payoutId: string;
  status: "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
  failureMessage?: string;
  providerPayoutId?: string;
}) {
  const result = await prisma.$transaction(
    async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: input.payoutId },
        include: { items: true },
      });
      if (!payout) throw notFound("Payout not found");

      const allowed = ADMIN_TRANSITIONS[payout.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw badRequest(
          `Cannot transition payout from ${payout.status} to ${input.status}.`,
        );
      }

      if (input.status === "PROCESSING") {
        const updated = await tx.payout.update({
          where: { id: payout.id },
          data: { status: "PROCESSING" },
        });
        await writeAuditLog({
          adminId: input.adminId,
          action: "PAYOUT_MARKED_PROCESSING",
          targetType: "Payout",
          targetId: payout.id,
        });
        return { payout: updated, released: false, paid: false };
      }

      if (input.status === "PAID") {
        const updated = await tx.payout.update({
          where: { id: payout.id },
          data: {
            status: "PAID",
            processedAt: new Date(),
            providerPayoutId:
              input.providerPayoutId?.trim() ||
              payout.providerPayoutId ||
              `manual:${payout.id}`,
            failureCode: null,
            failureMessage: null,
          },
        });
        await tx.creatorEarning.updateMany({
          where: { id: { in: payout.items.map((i) => i.earningId) } },
          data: { status: "PAID" },
        });
        await writeAuditLog({
          adminId: input.adminId,
          action: "PAYOUT_MARKED_PAID",
          targetType: "Payout",
          targetId: payout.id,
          metadata: { providerPayoutId: updated.providerPayoutId },
        });
        return { payout: updated, released: false, paid: true };
      }

      // FAILED or CANCELLED — restore RESERVED → AVAILABLE
      const updated = await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: input.status,
          processedAt: new Date(),
          failureCode: input.status === "FAILED" ? "MANUAL_FAIL" : "CANCELLED",
          failureMessage:
            input.failureMessage?.trim() ||
            (input.status === "FAILED"
              ? "Payout could not be completed."
              : "Payout cancelled."),
        },
      });
      await tx.creatorEarning.updateMany({
        where: {
          id: { in: payout.items.map((i) => i.earningId) },
          status: "RESERVED",
        },
        data: { status: "AVAILABLE" },
      });
      await writeAuditLog({
        adminId: input.adminId,
        action: "PAYOUT_MARKED_FAILED",
        targetType: "Payout",
        targetId: payout.id,
        metadata: { status: input.status, failureCode: updated.failureCode },
      });
      return { payout: updated, released: true, paid: false };
    },
    { isolationLevel: "Serializable" },
  );

  if (result.paid) void notifyPayoutPaid(result.payout.id);
  if (result.released && result.payout.status === "FAILED") {
    void notifyPayoutFailed(result.payout.id);
  }

  return serializePayout(result.payout);
}

export async function adminUpdatePayoutAccount(input: {
  adminId: string;
  creatorId: string;
  status: "VERIFIED" | "DISABLED";
}) {
  const creator = await prisma.creatorProfile.findUnique({
    where: { id: input.creatorId },
    select: { id: true },
  });
  if (!creator) throw notFound("Creator not found");

  const account = await prisma.creatorPayoutAccount.findUnique({
    where: { creatorId: creator.id },
  });
  if (!account) {
    throw badRequest("Creator has not submitted a payout account yet.");
  }

  const updated = await prisma.creatorPayoutAccount.update({
    where: { creatorId: creator.id },
    data: {
      status: input.status,
      verifiedAt: input.status === "VERIFIED" ? new Date() : null,
    },
  });

  await writeAuditLog({
    adminId: input.adminId,
    action:
      input.status === "DISABLED"
        ? "PAYOUT_ACCOUNT_DISABLED"
        : "PAYOUT_ACCOUNT_VERIFIED",
    targetType: "CreatorPayoutAccount",
    targetId: updated.id,
    metadata: { status: input.status, creatorId: creator.id },
  });

  void notifyPayoutAccountUpdated(creator.id, updated.status);
  return serializePayoutAccount(updated);
}

/** Stable hash for optional client idempotency keys. */
export function normalizeIdempotencyKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex").slice(0, 64);
}
