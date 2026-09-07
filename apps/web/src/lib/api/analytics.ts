import { requestJson } from "@/lib/api/http";
import type {
  AnalyticsOverview,
  AnalyticsRangeParams,
  CouponAnalyticsResponse,
  CustomerAnalyticsResponse,
  ProductAnalyticsResponse,
} from "@/types/analytics";
import type { StudioSale } from "@/types/studio";

function rangeQuery(params: AnalyticsRangeParams) {
  const search = new URLSearchParams();
  if (params.range === "custom" && params.from && params.to) {
    search.set("from", params.from);
    search.set("to", params.to);
  } else {
    search.set("range", params.range);
  }
  return search.toString();
}

export async function fetchCreatorAnalyticsOverview(
  params: AnalyticsRangeParams,
): Promise<AnalyticsOverview> {
  return requestJson<AnalyticsOverview>(
    `/api/v1/creators/me/analytics/overview?${rangeQuery(params)}`,
  );
}

export async function fetchCreatorProductAnalytics(
  params: AnalyticsRangeParams & {
    sort?: "revenue" | "units" | "orders" | "newest";
    q?: string;
    page?: number;
    limit?: number;
  },
): Promise<ProductAnalyticsResponse> {
  const search = new URLSearchParams(rangeQuery(params));
  if (params.sort) search.set("sort", params.sort);
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return requestJson<ProductAnalyticsResponse>(
    `/api/v1/creators/me/analytics/products?${search.toString()}`,
  );
}

export async function fetchCreatorCustomerAnalytics(
  params: AnalyticsRangeParams,
): Promise<CustomerAnalyticsResponse> {
  return requestJson<CustomerAnalyticsResponse>(
    `/api/v1/creators/me/analytics/customers?${rangeQuery(params)}`,
  );
}

export async function fetchCreatorCouponAnalytics(
  params: AnalyticsRangeParams,
): Promise<CouponAnalyticsResponse> {
  return requestJson<CouponAnalyticsResponse>(
    `/api/v1/creators/me/analytics/coupons?${rangeQuery(params)}`,
  );
}

export async function fetchCreatorRecentSales(params: {
  range?: AnalyticsRangeParams["range"];
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
}): Promise<{ items: StudioSale[] }> {
  const search = new URLSearchParams();
  if (params.range === "custom" && params.from && params.to) {
    search.set("from", params.from);
    search.set("to", params.to);
  } else {
    search.set("range", params.range ?? "90d");
  }
  if (params.status) search.set("status", params.status);
  if (params.limit) search.set("limit", String(params.limit));
  const data = await requestJson<{
    items: Array<{
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
      currency: StudioSale["currency"];
      status: StudioSale["status"] | "pending" | "cancelled";
      purchasedAt: string;
    }>;
  }>(`/api/v1/creators/me/analytics/recent-sales?${search.toString()}`);

  return {
    items: data.items.map((sale) => ({
      id: sale.orderId,
      productId: sale.productId,
      productTitle: sale.productTitle,
      productCoverUrl:
        sale.productCoverUrl ??
        "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=200&q=80",
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      customerAvatarUrl:
        sale.customerAvatarUrl ??
        `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(sale.customerName)}`,
      amountCents: sale.amountCents,
      currency: sale.currency,
      status:
        sale.status === "pending" || sale.status === "cancelled"
          ? "failed"
          : sale.status === "refunded"
            ? "refunded"
            : sale.status === "failed"
              ? "failed"
              : "paid",
      purchasedAt: sale.purchasedAt,
    })),
  };
}
