"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchCreatorAnalyticsOverview,
  fetchCreatorCouponAnalytics,
  fetchCreatorCustomerAnalytics,
  fetchCreatorProductAnalytics,
  fetchCreatorRecentSales,
} from "@/lib/api/analytics";
import type { AnalyticsRangeParams } from "@/types/analytics";

export const analyticsKeys = {
  overview: (params: AnalyticsRangeParams) =>
    ["creator-analytics", "overview", params] as const,
  products: (params: AnalyticsRangeParams & { sort?: string; q?: string; page?: number }) =>
    ["creator-analytics", "products", params] as const,
  customers: (params: AnalyticsRangeParams) =>
    ["creator-analytics", "customers", params] as const,
  coupons: (params: AnalyticsRangeParams) =>
    ["creator-analytics", "coupons", params] as const,
  sales: (params: Record<string, unknown>) =>
    ["creator-analytics", "sales", params] as const,
};

export function useCreatorAnalyticsOverview(params: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.overview(params),
    queryFn: () => fetchCreatorAnalyticsOverview(params),
  });
}

export function useCreatorProductAnalytics(
  params: AnalyticsRangeParams & {
    sort?: "revenue" | "units" | "orders" | "newest";
    q?: string;
    page?: number;
    limit?: number;
  },
) {
  return useQuery({
    queryKey: analyticsKeys.products(params),
    queryFn: () => fetchCreatorProductAnalytics(params),
  });
}

export function useCreatorCustomerAnalytics(params: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.customers(params),
    queryFn: () => fetchCreatorCustomerAnalytics(params),
  });
}

export function useCreatorCouponAnalytics(params: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.coupons(params),
    queryFn: () => fetchCreatorCouponAnalytics(params),
  });
}

export function useCreatorRecentSales(params: {
  range?: AnalyticsRangeParams["range"];
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: analyticsKeys.sales(params),
    queryFn: () => fetchCreatorRecentSales(params),
  });
}
