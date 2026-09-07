import type { Currency, OrderStatus } from "@prisma/client";

export type AnalyticsRangeKey =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export type AnalyticsBucket = "day" | "week" | "month";

export type DateWindow = {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  range: AnalyticsRangeKey;
  bucket: AnalyticsBucket;
};

export type PeriodTotals = {
  /** Gross line revenue (price × qty) for creator items on PAID orders. */
  grossRevenueCents: number;
  /** Coupon discount attributed to this creator’s coupons on PAID orders. */
  discountCents: number;
  /** Net = max(0, gross − discount). Primary “revenue” metric. */
  revenueCents: number;
  orders: number;
  unitsSold: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrderValueCents: number;
};

export type ChangeValue = {
  /** Fractional change (0.184 = +18.4%). Null when previous is 0 and current > 0 (“New”). */
  change: number | null;
  current: number;
  previous: number;
};

export type AnalyticsOverview = {
  range: {
    key: AnalyticsRangeKey;
    from: string;
    to: string;
    bucket: AnalyticsBucket;
  };
  currency: Currency;
  metrics: {
    revenueCents: number;
    revenueChange: number | null;
    grossRevenueCents: number;
    discountCents: number;
    orders: number;
    ordersChange: number | null;
    unitsSold: number;
    unitsSoldChange: number | null;
    customers: number;
    customersChange: number | null;
    newCustomers: number;
    returningCustomers: number;
    repeatPurchaseRate: number | null;
    averageOrderValueCents: number;
    averageOrderValueChange: number | null;
    productCount: number;
    averageRevenuePerCustomerCents: number;
  };
  orderStatus: Partial<Record<OrderStatus, number>>;
  series: Array<{
    date: string;
    label: string;
    revenueCents: number;
    orders: number;
    unitsSold: number;
    newCustomers: number;
  }>;
  topProducts: Array<{
    productId: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    currency: Currency;
    unitsSold: number;
    orders: number;
    revenueCents: number;
    averagePriceCents: number;
  }>;
  recentSales: Array<{
    id: string;
    orderId: string;
    productId: string;
    productTitle: string;
    productCoverUrl: string | null;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerAvatarUrl: string | null;
    amountCents: number;
    currency: Currency;
    status: "paid" | "pending" | "failed" | "cancelled" | "refunded";
    purchasedAt: string;
  }>;
};

export type ProductAnalyticsRow = {
  productId: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  currency: Currency;
  status: string;
  unitsSold: number;
  orders: number;
  revenueCents: number;
  averagePriceCents: number;
  refundedOrders: number;
};

export type CouponAnalyticsRow = {
  couponId: string;
  code: string;
  redemptions: number;
  discountCents: number;
  attributedRevenueCents: number;
};
