"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminAuditLogs,
  fetchAdminCategories,
  fetchAdminCoupons,
  fetchAdminCreator,
  fetchAdminCreators,
  fetchAdminOrder,
  fetchAdminOrders,
  fetchAdminOverview,
  fetchAdminProduct,
  fetchAdminProducts,
  fetchAdminReport,
  fetchAdminReports,
  fetchAdminUser,
  fetchAdminUsers,
  updateAdminCategory,
  updateAdminProductStatus,
  updateAdminReportStatus,
  updateAdminUserStatus,
} from "@/lib/api/admin";
import type { AdminRangeParams } from "@/types/admin";

export const adminKeys = {
  overview: (params?: AdminRangeParams) => ["admin", "overview", params] as const,
  users: (params: Record<string, unknown>) => ["admin", "users", params] as const,
  user: (id: string) => ["admin", "user", id] as const,
  creators: (params: Record<string, unknown>) => ["admin", "creators", params] as const,
  creator: (id: string) => ["admin", "creator", id] as const,
  products: (params: Record<string, unknown>) => ["admin", "products", params] as const,
  product: (id: string) => ["admin", "product", id] as const,
  orders: (params: Record<string, unknown>) => ["admin", "orders", params] as const,
  order: (id: string) => ["admin", "order", id] as const,
  coupons: (params: Record<string, unknown>) => ["admin", "coupons", params] as const,
  reports: (params: Record<string, unknown>) => ["admin", "reports", params] as const,
  report: (id: string) => ["admin", "report", id] as const,
  audit: (params: Record<string, unknown>) => ["admin", "audit", params] as const,
  categories: ["admin", "categories"] as const,
};

export function useAdminOverview(params?: AdminRangeParams) {
  return useQuery({
    queryKey: adminKeys.overview(params),
    queryFn: () => fetchAdminOverview(params),
  });
}

export function useAdminUsers(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => fetchAdminUsers(params),
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: () => fetchAdminUser(userId),
    enabled: Boolean(userId),
  });
}

export function useAdminUserStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: "ACTIVE" | "SUSPENDED";
    }) => updateAdminUserStatus(userId, status),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.userId) });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminCreators(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: adminKeys.creators(params),
    queryFn: () => fetchAdminCreators(params),
  });
}

export function useAdminCreator(creatorId: string) {
  return useQuery({
    queryKey: adminKeys.creator(creatorId),
    queryFn: () => fetchAdminCreator(creatorId),
    enabled: Boolean(creatorId),
  });
}

export function useAdminProducts(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: adminKeys.products(params),
    queryFn: () => fetchAdminProducts(params),
  });
}

export function useAdminProduct(productId: string) {
  return useQuery({
    queryKey: adminKeys.product(productId),
    queryFn: () => fetchAdminProduct(productId),
    enabled: Boolean(productId),
  });
}

export function useAdminProductStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      status,
    }: {
      productId: string;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    }) => updateAdminProductStatus(productId, status),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: adminKeys.product(vars.productId) });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminOrders(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: adminKeys.orders(params),
    queryFn: () => fetchAdminOrders(params),
  });
}

export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: adminKeys.order(orderId),
    queryFn: () => fetchAdminOrder(orderId),
    enabled: Boolean(orderId),
  });
}

export function useAdminCoupons(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: adminKeys.coupons(params),
    queryFn: () => fetchAdminCoupons(params),
  });
}

export function useAdminReports(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: adminKeys.reports(params),
    queryFn: () => fetchAdminReports(params),
  });
}

export function useAdminReport(reportId: string) {
  return useQuery({
    queryKey: adminKeys.report(reportId),
    queryFn: () => fetchAdminReport(reportId),
    enabled: Boolean(reportId),
  });
}

export function useAdminReportStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      status,
      resolutionNote,
    }: {
      reportId: string;
      status: "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
      resolutionNote?: string;
    }) => updateAdminReportStatus(reportId, status, resolutionNote),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      void qc.invalidateQueries({ queryKey: adminKeys.report(vars.reportId) });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      void qc.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });
}

export function useAdminAuditLogs(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: adminKeys.audit(params),
    queryFn: () => fetchAdminAuditLogs(params),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: fetchAdminCategories,
  });
}

export function useAdminCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: adminKeys.categories });
  return {
    create: useMutation({
      mutationFn: createAdminCategory,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        updateAdminCategory(id, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: deleteAdminCategory,
      onSuccess: invalidate,
    }),
  };
}
