import type { Currency } from "@/types/catalog";

export type AnalyticsRangeKey =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export type AnalyticsRangeParams = {
  range: AnalyticsRangeKey;
  from?: string;
  to?: string;
};

export type AnalyticsSeriesPoint = {
  date: string;
  label: string;
  revenueCents: number;
  orders: number;
  unitsSold: number;
  newCustomers: number;
};

export type AnalyticsOverview = {
  range: {
    key: AnalyticsRangeKey;
    from: string;
    to: string;
    bucket: "day" | "week" | "month";
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
  orderStatus: Partial<
    Record<"PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED", number>
  >;
  series: AnalyticsSeriesPoint[];
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

export type ProductAnalyticsResponse = {
  range: AnalyticsOverview["range"];
  currency: Currency;
  items: Array<{
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
  }>;
  distribution: Array<{
    productId: string;
    title: string;
    revenueCents: number;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CustomerAnalyticsResponse = {
  range: AnalyticsOverview["range"];
  currency: Currency;
  customers: number;
  customersChange: number | null;
  newCustomers: number;
  returningCustomers: number;
  repeatPurchaseRate: number | null;
  averageRevenuePerCustomerCents: number;
  series: Array<{ date: string; label: string; newCustomers: number }>;
  items: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    purchaseCount: number;
    totalSpentCents: number;
    lastPurchaseAt: string;
  }>;
};

export type CouponAnalyticsResponse = {
  range: AnalyticsOverview["range"];
  currency: Currency;
  couponsUsed: number;
  discountCents: number;
  revenueFromCouponOrdersCents: number;
  items: Array<{
    couponId: string;
    code: string;
    redemptions: number;
    discountCents: number;
    attributedRevenueCents: number;
  }>;
};
