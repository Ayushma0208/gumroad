import type { Currency } from "@/types/catalog";

export type StudioProductKind = "download" | "course" | "template" | "bundle";

export type StudioProductStatus = "draft" | "published" | "archived";

export type PricingModel = "free" | "fixed" | "pwyw";

export type PaymentStatus = "paid" | "refunded" | "failed";

export type DateRangeKey = "daily" | "weekly" | "monthly" | "yearly";

export type StudioFile = {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
};

export type StudioProduct = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  kind: StudioProductKind;
  categorySlug: string;
  categoryLabel: string;
  coverUrl: string;
  gallery: string[];
  files: StudioFile[];
  status: StudioProductStatus;
  pricingModel: PricingModel;
  priceCents: number;
  suggestedPriceCents?: number;
  minPriceCents?: number;
  currency: Currency;
  salesCount: number;
  revenueCents: number;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export type StudioSale = {
  id: string;
  productId: string;
  productTitle: string;
  productCoverUrl: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatarUrl: string;
  amountCents: number;
  currency: Currency;
  status: PaymentStatus;
  purchasedAt: string;
};

export type StudioCustomer = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  purchaseCount: number;
  totalSpentCents: number;
  lastPurchaseAt: string;
};

export type RevenuePoint = {
  label: string;
  date: string;
  revenueCents: number;
  sales: number;
  customers: number;
};

export type StudioMetrics = {
  revenueCents: number;
  revenueChange: number;
  salesCount: number;
  salesChange: number;
  productCount: number;
  productChange: number;
  customerCount: number;
  customerChange: number;
};

export type ConversionFunnel = {
  views: number;
  checkouts: number;
  purchases: number;
};

export type ProductPerformancePoint = {
  productId: string;
  title: string;
  revenueCents: number;
  sales: number;
};

export type StudioOverview = {
  metrics: StudioMetrics;
  series: Record<DateRangeKey, RevenuePoint[]>;
  recentSales: StudioSale[];
  topProducts: StudioProduct[];
};

export type StudioAnalytics = {
  series: Record<DateRangeKey, RevenuePoint[]>;
  productPerformance: ProductPerformancePoint[];
  funnel: ConversionFunnel;
  conversionRate: number;
};

export type StudioSettings = {
  displayName: string;
  bio: string;
  avatarUrl: string;
  storeName: string;
  slug: string;
  storeDescription: string;
  notifySales: boolean;
  notifyProductUpdates: boolean;
  notifyWeeklyDigest: boolean;
};

export type StudioProductDraft = {
  kind: StudioProductKind;
  title: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  coverUrl: string;
  gallery: string[];
  files: StudioFile[];
  pricingModel: PricingModel;
  currency: Currency;
  priceCents: number;
  suggestedPriceCents: number;
  minPriceCents: number;
};
