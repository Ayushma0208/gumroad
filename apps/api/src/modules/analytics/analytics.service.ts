import type { OrderStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import { forbidden, notFound } from "../../utils/app-error";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import {
  enumerateBuckets,
  formatBucketLabel,
  resolveDateWindow,
} from "./analytics.dates";
import {
  finalizePeriodTotals,
  percentageChange,
  safeAverage,
  safeRate,
} from "./analytics.metrics";
import type {
  AnalyticsRangeQuery,
  ProductAnalyticsQuery,
  RecentSalesQuery,
} from "./analytics.schema";
import * as repo from "./analytics.repository";
import type { AnalyticsOverview } from "./analytics.types";

async function requireCreatorProfile(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw notFound("Create a store first.");
  }
  return profile;
}

function mapOrderStatus(status: OrderStatus): AnalyticsOverview["recentSales"][number]["status"] {
  switch (status) {
    case "PAID":
      return "paid";
    case "PENDING":
      return "pending";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    default:
      return "pending";
  }
}

function windowFromQuery(query: AnalyticsRangeQuery) {
  return resolveDateWindow({
    range: query.range,
    from: query.from,
    to: query.to,
  });
}

async function periodSnapshot(creatorId: string, from: Date, to: Date) {
  const raw = await repo.aggregatePeriodTotals(creatorId, from, to);
  return finalizePeriodTotals(raw);
}

export async function getCreatorAnalyticsOverview(
  userId: string,
  query: AnalyticsRangeQuery,
): Promise<AnalyticsOverview> {
  const profile = await requireCreatorProfile(userId);
  const window = windowFromQuery(query);

  const [current, previous, orderStatus, seriesRows, productRows, productCount, currency, recent] =
    await Promise.all([
      periodSnapshot(profile.id, window.from, window.to),
      periodSnapshot(profile.id, window.previousFrom, window.previousTo),
      repo.aggregateOrderStatus(profile.id, window.from, window.to),
      repo.aggregateTimeSeries(profile.id, window.from, window.to, window.bucket),
      repo.aggregateProductPerformance(profile.id, window.from, window.to),
      repo.countCreatorProducts(profile.id),
      repo.getCreatorCurrency(profile.id),
      repo.listRecentCreatorSales(profile.id, {
        from: window.from,
        toExclusive: window.to,
        limit: 8,
        statuses: ["PAID", "PENDING", "FAILED", "CANCELLED", "REFUNDED"],
      }),
    ]);

  const seriesMap = new Map(seriesRows.map((row) => [row.date, row]));
  const series = enumerateBuckets(window.from, window.to, window.bucket).map((date) => {
    const row = seriesMap.get(date);
    return {
      date,
      label: formatBucketLabel(date, window.bucket),
      revenueCents: row?.revenueCents ?? 0,
      orders: row?.orders ?? 0,
      unitsSold: row?.unitsSold ?? 0,
      newCustomers: row?.newCustomers ?? 0,
    };
  });

  const products = await repo.loadProductsForAnalytics(
    productRows.map((row) => row.productId),
  );
  const productById = new Map(products.map((p) => [p.id, p]));
  const topProducts = productRows
    .map((row) => {
      const product = productById.get(row.productId);
      return {
        productId: row.productId,
        title: product?.title ?? "Product",
        slug: product?.slug ?? "",
        coverUrl: product?.coverImage ?? null,
        currency: product?.currency ?? currency,
        unitsSold: row.unitsSold,
        orders: row.orders,
        revenueCents: row.revenueCents,
        averagePriceCents: safeAverage(row.revenueCents, row.unitsSold),
      };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  return {
    range: {
      key: window.range,
      from: window.from.toISOString(),
      to: new Date(window.to.getTime() - 1).toISOString(),
      bucket: window.bucket,
    },
    currency,
    metrics: {
      revenueCents: current.revenueCents,
      revenueChange: percentageChange(current.revenueCents, previous.revenueCents),
      grossRevenueCents: current.grossRevenueCents,
      discountCents: current.discountCents,
      orders: current.orders,
      ordersChange: percentageChange(current.orders, previous.orders),
      unitsSold: current.unitsSold,
      unitsSoldChange: percentageChange(current.unitsSold, previous.unitsSold),
      customers: current.customers,
      customersChange: percentageChange(current.customers, previous.customers),
      newCustomers: current.newCustomers,
      returningCustomers: current.returningCustomers,
      repeatPurchaseRate: safeRate(current.returningCustomers, current.customers),
      averageOrderValueCents: current.averageOrderValueCents,
      averageOrderValueChange: percentageChange(
        current.averageOrderValueCents,
        previous.averageOrderValueCents,
      ),
      productCount,
      averageRevenuePerCustomerCents: safeAverage(
        current.revenueCents,
        current.customers,
      ),
    },
    orderStatus,
    series,
    topProducts,
    recentSales: recent.map((sale) => ({
      id: sale.id,
      orderId: sale.orderId,
      productId: sale.productId,
      productTitle: sale.productTitle,
      productCoverUrl: sale.productCoverUrl,
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      customerAvatarUrl: sale.customerAvatarUrl,
      amountCents: sale.amountCents,
      currency: sale.currency,
      status: mapOrderStatus(sale.status),
      purchasedAt: sale.purchasedAt.toISOString(),
    })),
  };
}

export async function getCreatorRevenueAnalytics(
  userId: string,
  query: AnalyticsRangeQuery,
) {
  const overview = await getCreatorAnalyticsOverview(userId, query);
  return {
    range: overview.range,
    currency: overview.currency,
    revenueCents: overview.metrics.revenueCents,
    grossRevenueCents: overview.metrics.grossRevenueCents,
    discountCents: overview.metrics.discountCents,
    revenueChange: overview.metrics.revenueChange,
    averageOrderValueCents: overview.metrics.averageOrderValueCents,
    series: overview.series.map((point) => ({
      date: point.date,
      label: point.label,
      revenueCents: point.revenueCents,
    })),
  };
}

export async function getCreatorSalesAnalytics(
  userId: string,
  query: AnalyticsRangeQuery,
) {
  const overview = await getCreatorAnalyticsOverview(userId, query);
  return {
    range: overview.range,
    currency: overview.currency,
    orders: overview.metrics.orders,
    ordersChange: overview.metrics.ordersChange,
    unitsSold: overview.metrics.unitsSold,
    unitsSoldChange: overview.metrics.unitsSoldChange,
    orderStatus: overview.orderStatus,
    series: overview.series.map((point) => ({
      date: point.date,
      label: point.label,
      orders: point.orders,
      unitsSold: point.unitsSold,
    })),
  };
}

export async function getCreatorProductAnalytics(
  userId: string,
  query: ProductAnalyticsQuery,
) {
  const profile = await requireCreatorProfile(userId);
  const window = windowFromQuery(query);
  const { page, limit } = parsePagination(query.page, query.limit);
  const { skip, take } = skipTake({ page, limit });
  const sort = query.sort ?? "revenue";
  const q = query.q?.trim().toLowerCase() ?? "";

  const [rows, currency] = await Promise.all([
    repo.aggregateProductPerformance(profile.id, window.from, window.to),
    repo.getCreatorCurrency(profile.id),
  ]);
  const products = await repo.loadProductsForAnalytics(rows.map((r) => r.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  let items = rows.map((row) => {
    const product = byId.get(row.productId);
    return {
      productId: row.productId,
      title: product?.title ?? "Product",
      slug: product?.slug ?? "",
      coverUrl: product?.coverImage ?? null,
      currency: product?.currency ?? currency,
      status: product?.status ?? "DRAFT",
      createdAt: product?.createdAt?.toISOString() ?? null,
      unitsSold: row.unitsSold,
      orders: row.orders,
      revenueCents: row.revenueCents,
      averagePriceCents: safeAverage(row.revenueCents, row.unitsSold),
      refundedOrders: row.refundedOrders,
    };
  });

  if (q) {
    items = items.filter((item) => item.title.toLowerCase().includes(q));
  }

  items.sort((a, b) => {
    if (sort === "units") return b.unitsSold - a.unitsSold;
    if (sort === "orders") return b.orders - a.orders;
    if (sort === "newest") {
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    }
    return b.revenueCents - a.revenueCents;
  });

  const total = items.length;
  const pageItems = items.slice(skip, skip + take);

  const distributionSource = [...items]
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10);
  const topSum = distributionSource.reduce((sum, item) => sum + item.revenueCents, 0);
  const allSum = items.reduce((sum, item) => sum + item.revenueCents, 0);
  const other = Math.max(0, allSum - topSum);
  const distribution = distributionSource.map((item) => ({
    productId: item.productId,
    title: item.title,
    revenueCents: item.revenueCents,
  }));
  if (other > 0 && items.length > distributionSource.length) {
    distribution.push({
      productId: "_other",
      title: "Other",
      revenueCents: other,
    });
  }

  return {
    range: {
      key: window.range,
      from: window.from.toISOString(),
      to: new Date(window.to.getTime() - 1).toISOString(),
      bucket: window.bucket,
    },
    currency,
    items: pageItems.map(({ createdAt: _createdAt, ...rest }) => rest),
    distribution,
    meta: paginationMeta(page, limit, total),
  };
}

export async function getCreatorCustomerAnalytics(
  userId: string,
  query: AnalyticsRangeQuery,
) {
  const profile = await requireCreatorProfile(userId);
  const window = windowFromQuery(query);
  const [overview, customers] = await Promise.all([
    getCreatorAnalyticsOverview(userId, query),
    repo.listCreatorCustomers(profile.id, window.from, window.to),
  ]);
  return {
    range: overview.range,
    currency: overview.currency,
    customers: overview.metrics.customers,
    customersChange: overview.metrics.customersChange,
    newCustomers: overview.metrics.newCustomers,
    returningCustomers: overview.metrics.returningCustomers,
    repeatPurchaseRate: overview.metrics.repeatPurchaseRate,
    averageRevenuePerCustomerCents: overview.metrics.averageRevenuePerCustomerCents,
    series: overview.series.map((point) => ({
      date: point.date,
      label: point.label,
      newCustomers: point.newCustomers,
    })),
    items: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      avatarUrl: customer.avatarUrl,
      purchaseCount: customer.purchaseCount,
      totalSpentCents: customer.totalSpentCents,
      lastPurchaseAt: customer.lastPurchaseAt.toISOString(),
    })),
  };
}

export async function getCreatorCouponAnalytics(
  userId: string,
  query: AnalyticsRangeQuery,
) {
  const profile = await requireCreatorProfile(userId);
  const window = windowFromQuery(query);
  const [coupons, currency, totals] = await Promise.all([
    repo.aggregateCouponPerformance(profile.id, window.from, window.to),
    repo.getCreatorCurrency(profile.id),
    periodSnapshot(profile.id, window.from, window.to),
  ]);

  return {
    range: {
      key: window.range,
      from: window.from.toISOString(),
      to: new Date(window.to.getTime() - 1).toISOString(),
      bucket: window.bucket,
    },
    currency,
    couponsUsed: coupons.reduce((sum, c) => sum + c.redemptions, 0),
    discountCents: coupons.reduce((sum, c) => sum + c.discountCents, 0),
    revenueFromCouponOrdersCents: coupons.reduce(
      (sum, c) => sum + c.attributedRevenueCents,
      0,
    ),
    periodDiscountCents: totals.discountCents,
    items: coupons,
  };
}

export async function getCreatorRecentSales(
  userId: string,
  query: RecentSalesQuery,
) {
  const profile = await requireCreatorProfile(userId);
  const window = windowFromQuery({
    range: query.range ?? "90d",
    from: query.from,
    to: query.to,
  });
  const statusMap: Record<string, OrderStatus[]> = {
    all: ["PAID", "PENDING", "FAILED", "CANCELLED", "REFUNDED"],
    paid: ["PAID"],
    pending: ["PENDING"],
    failed: ["FAILED"],
    cancelled: ["CANCELLED"],
    refunded: ["REFUNDED"],
  };
  const statuses = statusMap[query.status ?? "all"] ?? statusMap.all;
  const sales = await repo.listRecentCreatorSales(profile.id, {
    from: window.from,
    toExclusive: window.to,
    limit: query.limit ?? 50,
    statuses,
  });

  return {
    items: sales.map((sale) => ({
      id: sale.id,
      orderId: sale.orderId,
      productId: sale.productId,
      productTitle: sale.productTitle,
      productCoverUrl: sale.productCoverUrl,
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      customerAvatarUrl: sale.customerAvatarUrl,
      amountCents: sale.amountCents,
      currency: sale.currency,
      status: mapOrderStatus(sale.status),
      purchasedAt: sale.purchasedAt.toISOString(),
    })),
  };
}

export async function getCreatorProductDetailAnalytics(
  userId: string,
  productId: string,
  query: AnalyticsRangeQuery,
) {
  const profile = await requireCreatorProfile(userId);
  const product = await prisma.product.findFirst({
    where: { id: productId, creatorId: profile.id },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      currency: true,
      status: true,
      _count: { select: { wishlistItems: true } },
    },
  });
  if (!product) {
    throw notFound("Product not found.");
  }

  const window = windowFromQuery(query);
  const [rows, reviewAgg, seriesRows] = await Promise.all([
    repo.aggregateProductPerformance(profile.id, window.from, window.to),
    prisma.review.aggregate({
      where: { productId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    repo.aggregateTimeSeries(profile.id, window.from, window.to, window.bucket),
  ]);

  const row = rows.find((r) => r.productId === productId);
  // Product-scoped series: filter via a lightweight item query is ideal;
  // reuse product performance + overall series labels with product totals only.
  void seriesRows;

  return {
    range: {
      key: window.range,
      from: window.from.toISOString(),
      to: new Date(window.to.getTime() - 1).toISOString(),
      bucket: window.bucket,
    },
    product: {
      id: product.id,
      title: product.title,
      slug: product.slug,
      coverUrl: product.coverImage,
      currency: product.currency,
      status: product.status,
    },
    metrics: {
      revenueCents: row?.revenueCents ?? 0,
      unitsSold: row?.unitsSold ?? 0,
      orders: row?.orders ?? 0,
      averagePriceCents: safeAverage(row?.revenueCents ?? 0, row?.unitsSold ?? 0),
      refundedOrders: row?.refundedOrders ?? 0,
      averageRating: reviewAgg._avg.rating
        ? Math.round(reviewAgg._avg.rating * 10) / 10
        : null,
      reviewCount: reviewAgg._count._all,
      wishlistCount: product._count.wishlistItems,
    },
  };
}

/** Guard for future admin analytics — never trust client creatorId for creators. */
export function assertCreatorScope(sessionUserId: string, requestedCreatorId?: string) {
  if (requestedCreatorId) {
    throw forbidden("creatorId cannot be supplied by the client.");
  }
  return sessionUserId;
}
