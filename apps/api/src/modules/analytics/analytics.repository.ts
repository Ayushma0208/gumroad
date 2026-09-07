import { Prisma, type Currency, type OrderStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import type { AnalyticsBucket } from "./analytics.types";

type NumRow = {
  gross_revenue: bigint | number | null;
  discount: bigint | number | null;
  orders: bigint | number | null;
  units_sold: bigint | number | null;
  customers: bigint | number | null;
  new_customers: bigint | number | null;
  returning_customers: bigint | number | null;
};

function n(value: bigint | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "bigint" ? Number(value) : value;
}

/**
 * Period totals for a creator.
 *
 * Revenue attribution: PAID OrderItems where OrderItem.creatorId = creator.
 * Discount: CouponRedemption.discountAmount when Coupon.creatorId = creator
 * (creator coupons only discount that creator’s eligible lines at checkout).
 */
export async function aggregatePeriodTotals(
  creatorId: string,
  from: Date,
  toExclusive: Date,
) {
  const rows = await prisma.$queryRaw<NumRow[]>`
    WITH paid_items AS (
      SELECT
        oi."orderId",
        oi."productId",
        oi.price,
        oi.quantity,
        o."customerId",
        o."createdAt"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
        AND o."createdAt" >= ${from}
        AND o."createdAt" < ${toExclusive}
    ),
    first_purchase AS (
      SELECT
        o."customerId",
        MIN(o."createdAt") AS first_at
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
      GROUP BY o."customerId"
    ),
    period_customers AS (
      SELECT DISTINCT "customerId" FROM paid_items
    ),
    discount AS (
      SELECT COALESCE(SUM(cr."discountAmount"), 0)::bigint AS total
      FROM "CouponRedemption" cr
      INNER JOIN "Coupon" c ON c.id = cr."couponId"
      INNER JOIN "Order" o ON o.id = cr."orderId"
      WHERE c."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
        AND o."createdAt" >= ${from}
        AND o."createdAt" < ${toExclusive}
    ),
    purchase_counts AS (
      SELECT
        o."customerId",
        COUNT(DISTINCT o.id)::int AS order_count
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
      GROUP BY o."customerId"
    )
    SELECT
      COALESCE((SELECT SUM(price * quantity) FROM paid_items), 0)::bigint AS gross_revenue,
      (SELECT total FROM discount) AS discount,
      COALESCE((SELECT COUNT(DISTINCT "orderId") FROM paid_items), 0)::bigint AS orders,
      COALESCE((SELECT SUM(quantity) FROM paid_items), 0)::bigint AS units_sold,
      COALESCE((SELECT COUNT(*) FROM period_customers), 0)::bigint AS customers,
      COALESCE((
        SELECT COUNT(*)
        FROM period_customers pc
        INNER JOIN first_purchase fp ON fp."customerId" = pc."customerId"
        WHERE fp.first_at >= ${from} AND fp.first_at < ${toExclusive}
      ), 0)::bigint AS new_customers,
      COALESCE((
        SELECT COUNT(*)
        FROM period_customers pc
        INNER JOIN purchase_counts pc2 ON pc2."customerId" = pc."customerId"
        WHERE pc2.order_count > 1
      ), 0)::bigint AS returning_customers
  `;

  const row = rows[0];
  return {
    grossRevenueCents: n(row?.gross_revenue),
    discountCents: n(row?.discount),
    orders: n(row?.orders),
    unitsSold: n(row?.units_sold),
    customers: n(row?.customers),
    newCustomers: n(row?.new_customers),
    returningCustomers: n(row?.returning_customers),
  };
}

export async function aggregateOrderStatus(
  creatorId: string,
  from: Date,
  toExclusive: Date,
) {
  const rows = await prisma.$queryRaw<Array<{ status: OrderStatus; count: bigint | number }>>`
    SELECT o.status, COUNT(DISTINCT o.id) AS count
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    WHERE oi."creatorId" = ${creatorId}
      AND o."createdAt" >= ${from}
      AND o."createdAt" < ${toExclusive}
    GROUP BY o.status
  `;
  const result: Partial<Record<OrderStatus, number>> = {};
  for (const row of rows) {
    result[row.status] = n(row.count);
  }
  return result;
}

type SeriesRow = {
  bucket: string;
  revenue: bigint | number | null;
  orders: bigint | number | null;
  units_sold: bigint | number | null;
  new_customers: bigint | number | null;
};

export async function aggregateTimeSeries(
  creatorId: string,
  from: Date,
  toExclusive: Date,
  bucket: AnalyticsBucket,
) {
  const unit = bucket === "day" ? "day" : bucket === "week" ? "week" : "month";
  const format = bucket === "month" ? "YYYY-MM" : "YYYY-MM-DD";
  const truncOrder = Prisma.raw(`date_trunc('${unit}', o."createdAt" AT TIME ZONE 'UTC')`);
  const truncFirst = Prisma.raw(`date_trunc('${unit}', fp.first_at AT TIME ZONE 'UTC')`);
  const charFormat = Prisma.raw(`'${format}'`);

  const rows = await prisma.$queryRaw<SeriesRow[]>`
    WITH first_purchase AS (
      SELECT
        o."customerId",
        MIN(o."createdAt") AS first_at
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
      GROUP BY o."customerId"
    ),
    paid AS (
      SELECT
        oi."orderId",
        oi.price,
        oi.quantity,
        o."customerId",
        ${truncOrder} AS bucket_ts
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
        AND o."createdAt" >= ${from}
        AND o."createdAt" < ${toExclusive}
    ),
    sales AS (
      SELECT
        bucket_ts,
        COALESCE(SUM(price * quantity), 0)::bigint AS revenue,
        COUNT(DISTINCT "orderId")::bigint AS orders,
        COALESCE(SUM(quantity), 0)::bigint AS units_sold
      FROM paid
      GROUP BY bucket_ts
    ),
    new_buyers AS (
      SELECT
        ${truncFirst} AS bucket_ts,
        COUNT(*)::bigint AS new_customers
      FROM first_purchase fp
      WHERE fp.first_at >= ${from}
        AND fp.first_at < ${toExclusive}
      GROUP BY 1
    )
    SELECT
      to_char(s.bucket_ts AT TIME ZONE 'UTC', ${charFormat}) AS bucket,
      s.revenue,
      s.orders,
      s.units_sold,
      COALESCE(nb.new_customers, 0)::bigint AS new_customers
    FROM sales s
    LEFT JOIN new_buyers nb ON nb.bucket_ts = s.bucket_ts
    ORDER BY s.bucket_ts ASC
  `;

  // Series uses gross line revenue (discount is period-level only).
  return rows.map((row) => ({
    date: String(row.bucket),
    revenueCents: n(row.revenue),
    orders: n(row.orders),
    unitsSold: n(row.units_sold),
    newCustomers: n(row.new_customers),
  }));
}

export async function aggregateProductPerformance(
  creatorId: string,
  from: Date,
  toExclusive: Date,
) {
  const rows = await prisma.$queryRaw<
    Array<{
      product_id: string;
      units_sold: bigint | number | null;
      orders: bigint | number | null;
      revenue: bigint | number | null;
      refunded_orders: bigint | number | null;
    }>
  >`
    SELECT
      oi."productId" AS product_id,
      COALESCE(SUM(CASE WHEN o.status = 'PAID'::"OrderStatus" THEN oi.quantity ELSE 0 END), 0)::bigint AS units_sold,
      COUNT(DISTINCT CASE WHEN o.status = 'PAID'::"OrderStatus" THEN o.id END)::bigint AS orders,
      COALESCE(SUM(CASE WHEN o.status = 'PAID'::"OrderStatus" THEN oi.price * oi.quantity ELSE 0 END), 0)::bigint AS revenue,
      COUNT(DISTINCT CASE WHEN o.status = 'REFUNDED'::"OrderStatus" THEN o.id END)::bigint AS refunded_orders
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    WHERE oi."creatorId" = ${creatorId}
      AND o."createdAt" >= ${from}
      AND o."createdAt" < ${toExclusive}
      AND o.status IN ('PAID'::"OrderStatus", 'REFUNDED'::"OrderStatus")
    GROUP BY oi."productId"
  `;

  return rows.map((row) => ({
    productId: row.product_id,
    unitsSold: n(row.units_sold),
    orders: n(row.orders),
    revenueCents: n(row.revenue),
    refundedOrders: n(row.refunded_orders),
  }));
}

export async function aggregateCouponPerformance(
  creatorId: string,
  from: Date,
  toExclusive: Date,
) {
  const rolled = await prisma.$queryRaw<
    Array<{
      coupon_id: string;
      code: string;
      redemptions: bigint | number | null;
      discount: bigint | number | null;
      attributed_revenue: bigint | number | null;
    }>
  >`
    WITH redemptions AS (
      SELECT
        c.id AS coupon_id,
        c.code,
        cr.id AS redemption_id,
        cr."discountAmount",
        o.id AS order_id
      FROM "CouponRedemption" cr
      INNER JOIN "Coupon" c ON c.id = cr."couponId"
      INNER JOIN "Order" o ON o.id = cr."orderId"
      WHERE c."creatorId" = ${creatorId}
        AND o.status = 'PAID'::"OrderStatus"
        AND o."createdAt" >= ${from}
        AND o."createdAt" < ${toExclusive}
    ),
    order_creator_revenue AS (
      SELECT
        r.order_id,
        COALESCE(SUM(oi.price * oi.quantity), 0)::bigint AS revenue
      FROM redemptions r
      INNER JOIN "OrderItem" oi ON oi."orderId" = r.order_id AND oi."creatorId" = ${creatorId}
      GROUP BY r.order_id
    )
    SELECT
      r.coupon_id,
      r.code,
      COUNT(DISTINCT r.redemption_id)::bigint AS redemptions,
      COALESCE(SUM(r."discountAmount"), 0)::bigint AS discount,
      COALESCE(SUM(ocr.revenue), 0)::bigint AS attributed_revenue
    FROM redemptions r
    LEFT JOIN order_creator_revenue ocr ON ocr.order_id = r.order_id
    GROUP BY r.coupon_id, r.code
    ORDER BY attributed_revenue DESC, redemptions DESC
  `;

  return rolled.map((row) => ({
    couponId: row.coupon_id,
    code: row.code,
    redemptions: n(row.redemptions),
    discountCents: n(row.discount),
    attributedRevenueCents: n(row.attributed_revenue),
  }));
}

export async function listRecentCreatorSales(
  creatorId: string,
  options: {
    from?: Date;
    toExclusive?: Date;
    limit: number;
    statuses?: OrderStatus[];
  },
) {
  const items = await prisma.orderItem.findMany({
    where: {
      creatorId,
      order: {
        ...(options.from && options.toExclusive
          ? { createdAt: { gte: options.from, lt: options.toExclusive } }
          : {}),
        ...(options.statuses?.length ? { status: { in: options.statuses } } : {}),
      },
    },
    orderBy: { order: { createdAt: "desc" } },
    take: options.limit,
    select: {
      id: true,
      productId: true,
      productTitle: true,
      price: true,
      quantity: true,
      order: {
        select: {
          id: true,
          status: true,
          currency: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      product: {
        select: {
          coverImage: true,
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    orderId: item.order.id,
    productId: item.productId,
    productTitle: item.productTitle,
    productCoverUrl: item.product.coverImage,
    customerId: item.order.customer.id,
    customerName: item.order.customer.name,
    customerEmail: item.order.customer.email,
    customerAvatarUrl: item.order.customer.avatarUrl,
    amountCents: item.price * item.quantity,
    currency: item.order.currency as Currency,
    status: item.order.status,
    purchasedAt: item.order.createdAt,
  }));
}

export async function countCreatorProducts(creatorId: string) {
  return prisma.product.count({ where: { creatorId } });
}

export async function loadProductsForAnalytics(productIds: string[]) {
  if (productIds.length === 0) return [];
  return prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listCreatorCustomers(
  creatorId: string,
  from: Date,
  toExclusive: Date,
) {
  const rows = await prisma.$queryRaw<
    Array<{
      customer_id: string;
      name: string;
      email: string;
      avatar_url: string | null;
      purchase_count: bigint | number | null;
      total_spent: bigint | number | null;
      last_purchase_at: Date;
    }>
  >`
    SELECT
      u.id AS customer_id,
      u.name,
      u.email,
      u."avatarUrl" AS avatar_url,
      COUNT(DISTINCT o.id)::bigint AS purchase_count,
      COALESCE(SUM(oi.price * oi.quantity), 0)::bigint AS total_spent,
      MAX(o."createdAt") AS last_purchase_at
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "User" u ON u.id = o."customerId"
    WHERE oi."creatorId" = ${creatorId}
      AND o.status = 'PAID'::"OrderStatus"
      AND o."createdAt" >= ${from}
      AND o."createdAt" < ${toExclusive}
    GROUP BY u.id, u.name, u.email, u."avatarUrl"
    ORDER BY total_spent DESC, last_purchase_at DESC
    LIMIT 200
  `;

  return rows.map((row) => ({
    id: row.customer_id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    purchaseCount: n(row.purchase_count),
    totalSpentCents: n(row.total_spent),
    lastPurchaseAt: row.last_purchase_at,
  }));
}

export async function getCreatorCurrency(creatorId: string): Promise<Currency> {
  const product = await prisma.product.findFirst({
    where: { creatorId },
    select: { currency: true },
    orderBy: { createdAt: "desc" },
  });
  return product?.currency ?? "USD";
}

