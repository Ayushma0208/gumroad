import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import {
  enumerateBuckets,
  formatBucketLabel,
  resolveDateWindow,
} from "../analytics/analytics.dates";
import { percentageChange } from "../analytics/analytics.metrics";
import type { AdminAnalyticsQuery } from "./admin.schema";

function n(value: bigint | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "bigint" ? Number(value) : value;
}

/**
 * Platform revenue = SUM(Order.totalAmount) for PAID orders in range.
 * This is the buyer-paid GMV after discounts — not creator net or platform fees
 * (fees are not modeled).
 */
export async function getAdminAnalyticsOverview(query: AdminAnalyticsQuery) {
  const window = resolveDateWindow({
    range: query.range,
    from: query.from,
    to: query.to,
  });

  const [
    totalsCurrent,
    totalsPrevious,
    usersCurrent,
    usersPrevious,
    creatorsTotal,
    publishedProducts,
    openReports,
    hiddenReviews,
    seriesRows,
    currencyRow,
    paymentHealth,
  ] = await Promise.all([
    aggregatePlatformPeriod(window.from, window.to),
    aggregatePlatformPeriod(window.previousFrom, window.previousTo),
    prisma.user.count({
      where: { createdAt: { gte: window.from, lt: window.to } },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: window.previousFrom, lt: window.previousTo },
      },
    }),
    prisma.creatorProfile.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.report.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
    }),
    prisma.review.count({ where: { status: "HIDDEN" } }),
    aggregatePlatformSeries(window.from, window.to, window.bucket),
    prisma.order.findFirst({
      where: { status: "PAID" },
      select: { currency: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const seriesMap = new Map(seriesRows.map((row) => [row.date, row]));
  const series = enumerateBuckets(window.from, window.to, window.bucket).map(
    (date) => {
      const row = seriesMap.get(date);
      return {
        date,
        label: formatBucketLabel(date, window.bucket),
        revenueCents: row?.revenueCents ?? 0,
        orders: row?.orders ?? 0,
      };
    },
  );

  const paymentCounts = Object.fromEntries(
    paymentHealth.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  return {
    range: {
      key: window.range,
      from: window.from.toISOString(),
      to: new Date(window.to.getTime() - 1).toISOString(),
      bucket: window.bucket,
    },
    currency: currencyRow?.currency ?? "USD",
    metrics: {
      totalUsers: await prisma.user.count(),
      totalCreators: creatorsTotal,
      publishedProducts,
      totalOrders: totalsCurrent.orders,
      grossRevenueCents: totalsCurrent.revenueCents,
      successfulPurchases: totalsCurrent.orders,
      pendingModeration: hiddenReviews,
      openReports,
      revenueChange: percentageChange(
        totalsCurrent.revenueCents,
        totalsPrevious.revenueCents,
      ),
      ordersChange: percentageChange(totalsCurrent.orders, totalsPrevious.orders),
      usersChange: percentageChange(usersCurrent, usersPrevious),
      newUsers: usersCurrent,
      failedPayments: paymentCounts.FAILED ?? 0,
      successfulPayments:
        (paymentCounts.PAID ?? 0) + (paymentCounts.SUCCESS ?? 0),
      pendingPayments: paymentCounts.PENDING ?? 0,
    },
    series,
    moderationQueue: {
      openReports,
      hiddenReviews,
    },
  };
}

async function aggregatePlatformPeriod(from: Date, toExclusive: Date) {
  const row = await prisma.order.aggregate({
    where: {
      status: "PAID",
      createdAt: { gte: from, lt: toExclusive },
    },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });
  return {
    revenueCents: row._sum.totalAmount ?? 0,
    orders: row._count._all,
  };
}

async function aggregatePlatformSeries(
  from: Date,
  toExclusive: Date,
  bucket: "day" | "week" | "month",
) {
  const unit = bucket === "day" ? "day" : bucket === "week" ? "week" : "month";
  const format = bucket === "month" ? "YYYY-MM" : "YYYY-MM-DD";
  const trunc = Prisma.raw(
    `date_trunc('${unit}', o."createdAt" AT TIME ZONE 'UTC')`,
  );
  const charFormat = Prisma.raw(`'${format}'`);

  const rows = await prisma.$queryRaw<
    Array<{ bucket: string; revenue: bigint | number; orders: bigint | number }>
  >`
    SELECT
      to_char(bucket_ts AT TIME ZONE 'UTC', ${charFormat}) AS bucket,
      COALESCE(SUM("totalAmount"), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM (
      SELECT
        o."totalAmount",
        ${trunc} AS bucket_ts
      FROM "Order" o
      WHERE o.status = 'PAID'::"OrderStatus"
        AND o."createdAt" >= ${from}
        AND o."createdAt" < ${toExclusive}
    ) paid
    GROUP BY bucket_ts
    ORDER BY bucket_ts ASC
  `;

  return rows.map((row) => ({
    date: String(row.bucket),
    revenueCents: n(row.revenue),
    orders: n(row.orders),
  }));
}

export async function getAdminRecentAudit(limit = 8) {
  const items = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: { select: { id: true, name: true, email: true } },
    },
  });
  return items.map((item) => ({
    id: item.id,
    action: item.action,
    targetType: item.targetType,
    targetId: item.targetId,
    metadata: item.metadata,
    createdAt: item.createdAt.toISOString(),
    admin: item.admin,
  }));
}
