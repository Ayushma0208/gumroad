import type { CreatorEarningStatus, Currency, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { badRequest, notFound } from "../../utils/app-error";
import { Money } from "../../utils/money";
import {
  postEarningsForPaidOrder,
  promoteAvailableEarnings,
} from "./earnings.ledger";

export { postEarningsForPaidOrder };

function moneyFields(cents: number) {
  return {
    cents,
    amount: Number((cents / 100).toFixed(2)),
  };
}

async function requireCreatorId(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw notFound("Create a store first.");
  return profile.id;
}

export async function getEarningsSummaryForUser(userId: string) {
  const creatorId = await requireCreatorId(userId);
  return getEarningsSummary(creatorId);
}

export async function getEarningsSummary(creatorId: string) {
  await prisma.$transaction(async (tx) => {
    await promoteAvailableEarnings(tx, creatorId);
  });

  const rows = await prisma.creatorEarning.groupBy({
    by: ["status", "currency"],
    where: {
      creatorId,
      status: { in: ["PENDING", "AVAILABLE", "RESERVED", "PAID"] },
    },
    _sum: {
      grossAmountCents: true,
      discountAmountCents: true,
      netSalesCents: true,
      platformFeeCents: true,
      processingFeeCents: true,
      creatorAmountCents: true,
    },
  });

  // Prefer a single currency wallet; if mixed, use the currency with the most creator earnings.
  const byCurrency = new Map<
    Currency,
    {
      gross: number;
      discounts: number;
      net: number;
      platformFees: number;
      processingFees: number;
      creatorEarnings: number;
      pending: number;
      available: number;
      reserved: number;
      paidOut: number;
    }
  >();

  for (const row of rows) {
    const currency = row.currency;
    const bucket =
      byCurrency.get(currency) ??
      {
        gross: 0,
        discounts: 0,
        net: 0,
        platformFees: 0,
        processingFees: 0,
        creatorEarnings: 0,
        pending: 0,
        available: 0,
        reserved: 0,
        paidOut: 0,
      };
    const creatorAmt = row._sum.creatorAmountCents ?? 0;
    bucket.gross = Money.add(bucket.gross, row._sum.grossAmountCents ?? 0);
    bucket.discounts = Money.add(bucket.discounts, row._sum.discountAmountCents ?? 0);
    bucket.net = Money.add(bucket.net, row._sum.netSalesCents ?? 0);
    bucket.platformFees = Money.add(bucket.platformFees, row._sum.platformFeeCents ?? 0);
    bucket.processingFees = Money.add(
      bucket.processingFees,
      row._sum.processingFeeCents ?? 0,
    );
    bucket.creatorEarnings = Money.add(bucket.creatorEarnings, creatorAmt);
    if (row.status === "PENDING") bucket.pending = Money.add(bucket.pending, creatorAmt);
    if (row.status === "AVAILABLE") {
      bucket.available = Money.add(bucket.available, creatorAmt);
    }
    if (row.status === "RESERVED") {
      bucket.reserved = Money.add(bucket.reserved, creatorAmt);
    }
    if (row.status === "PAID") bucket.paidOut = Money.add(bucket.paidOut, creatorAmt);
    byCurrency.set(currency, bucket);
  }

  let currency: Currency = "USD";
  let best = -1;
  for (const [cur, bucket] of byCurrency) {
    if (bucket.creatorEarnings > best) {
      best = bucket.creatorEarnings;
      currency = cur;
    }
  }
  const totals =
    byCurrency.get(currency) ??
    {
      gross: 0,
      discounts: 0,
      net: 0,
      platformFees: 0,
      processingFees: 0,
      creatorEarnings: 0,
      pending: 0,
      available: 0,
      reserved: 0,
      paidOut: 0,
    };

  return {
    currency,
    platformFeeBps: env.PLATFORM_FEE_BPS,
    holdingPeriodHours: env.PAYOUT_HOLDING_PERIOD_HOURS,
    minPayoutCents: env.MIN_PAYOUT_AMOUNT_CENTS,
    /**
     * Analytics “revenue” ≈ gross − creator coupon discounts (net sales before platform fee).
     * Available balance is creator net after fees, minus pending/reserved/paid.
     */
    grossSales: moneyFields(totals.gross),
    discounts: moneyFields(totals.discounts),
    netSales: moneyFields(totals.net),
    platformFees: moneyFields(totals.platformFees),
    processingFees: moneyFields(totals.processingFees),
    creatorEarnings: moneyFields(totals.creatorEarnings),
    pendingBalance: moneyFields(totals.pending),
    availableBalance: moneyFields(totals.available),
    reservedBalance: moneyFields(totals.reserved),
    paidOut: moneyFields(totals.paidOut),
  };
}

export async function listEarningsForUser(
  userId: string,
  query: {
    page: number;
    pageSize: number;
    status?: CreatorEarningStatus;
    productId?: string;
    from?: Date;
    to?: Date;
  },
) {
  const creatorId = await requireCreatorId(userId);
  await prisma.$transaction(async (tx) => {
    await promoteAvailableEarnings(tx, creatorId);
  });

  const where: Prisma.CreatorEarningWhereInput = {
    creatorId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.creatorEarning.count({ where }),
    prisma.creatorEarning.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        product: { select: { id: true, title: true, slug: true, coverImage: true } },
        order: { select: { id: true, createdAt: true, status: true } },
      },
    }),
  ]);

  return {
    items: items.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      orderItemId: row.orderItemId,
      product: row.product,
      currency: row.currency,
      gross: moneyFields(row.grossAmountCents),
      discount: moneyFields(row.discountAmountCents),
      netSales: moneyFields(row.netSalesCents),
      platformFee: moneyFields(row.platformFeeCents),
      platformFeeBps: row.platformFeeBps,
      processingFee: moneyFields(row.processingFeeCents),
      creatorEarning: moneyFields(row.creatorAmountCents),
      status: row.status,
      availableAt: row.availableAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    })),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function listAdminEarnings(query: {
  creatorId?: string;
  status?: CreatorEarningStatus;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.CreatorEarningWhereInput = {
    ...(query.creatorId ? { creatorId: query.creatorId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.creatorEarning.count({ where }),
    prisma.creatorEarning.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        creator: { select: { id: true, storeName: true, slug: true } },
        product: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);
  return {
    items: items.map((row) => ({
      id: row.id,
      creator: row.creator,
      product: row.product,
      orderId: row.orderId,
      currency: row.currency,
      grossAmountCents: row.grossAmountCents,
      discountAmountCents: row.discountAmountCents,
      platformFeeCents: row.platformFeeCents,
      creatorAmountCents: row.creatorAmountCents,
      status: row.status,
      availableAt: row.availableAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    })),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export function parseOptionalDate(value: string | undefined, label: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`Invalid ${label} date.`);
  }
  return date;
}
