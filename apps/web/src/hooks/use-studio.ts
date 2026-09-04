"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveProduct,
  deactivateStore,
  duplicateProduct,
  fetchStudioAnalytics,
  fetchStudioCustomers,
  fetchStudioOverview,
  fetchStudioProduct,
  fetchStudioProducts,
  fetchStudioSales,
  fetchStudioSettings,
  removeProduct,
  saveStudioProduct,
  updateProductStatus,
  updateStudioSettings,
} from "@/lib/api/studio";
import type {
  StudioProductDraft,
  StudioProductStatus,
  StudioSettings,
} from "@/types/studio";

export const studioKeys = {
  overview: (userId: string) => ["studio", "overview", userId] as const,
  products: (userId: string) => ["studio", "products", userId] as const,
  product: (userId: string, id: string) =>
    ["studio", "product", userId, id] as const,
  sales: (userId: string) => ["studio", "sales", userId] as const,
  customers: (userId: string) => ["studio", "customers", userId] as const,
  analytics: (userId: string) => ["studio", "analytics", userId] as const,
  settings: (userId: string) => ["studio", "settings", userId] as const,
};

export function useStudioOverview(userId: string | undefined) {
  return useQuery({
    queryKey: studioKeys.overview(userId ?? ""),
    queryFn: () => fetchStudioOverview(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useStudioProducts(userId: string | undefined) {
  return useQuery({
    queryKey: studioKeys.products(userId ?? ""),
    queryFn: () => fetchStudioProducts(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useStudioProduct(
  userId: string | undefined,
  productId: string | undefined,
) {
  return useQuery({
    queryKey: studioKeys.product(userId ?? "", productId ?? ""),
    queryFn: () => fetchStudioProduct(userId ?? "", productId ?? ""),
    enabled: Boolean(userId && productId),
  });
}

export function useStudioSales(userId: string | undefined) {
  return useQuery({
    queryKey: studioKeys.sales(userId ?? ""),
    queryFn: () => fetchStudioSales(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useStudioCustomers(userId: string | undefined) {
  return useQuery({
    queryKey: studioKeys.customers(userId ?? ""),
    queryFn: () => fetchStudioCustomers(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useStudioAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: studioKeys.analytics(userId ?? ""),
    queryFn: () => fetchStudioAnalytics(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useStudioSettings(userId: string | undefined) {
  return useQuery({
    queryKey: studioKeys.settings(userId ?? ""),
    queryFn: () => fetchStudioSettings(userId ?? ""),
    enabled: Boolean(userId),
  });
}

function invalidateStudio(queryClient: ReturnType<typeof useQueryClient>, userId: string) {
  void queryClient.invalidateQueries({ queryKey: ["studio"] });
  void queryClient.invalidateQueries({ queryKey: studioKeys.products(userId) });
}

export function useSaveProductMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      draft: StudioProductDraft;
      status: StudioProductStatus;
      productId?: string;
    }) =>
      saveStudioProduct({
        userId,
        draft: input.draft,
        status: input.status,
        productId: input.productId,
      }),
    onSuccess: () => invalidateStudio(queryClient, userId),
  });
}

export function useDuplicateProductMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => duplicateProduct({ userId, productId }),
    onSuccess: () => invalidateStudio(queryClient, userId),
  });
}

export function useArchiveProductMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => archiveProduct({ userId, productId }),
    onSuccess: () => invalidateStudio(queryClient, userId),
  });
}

export function useDeleteProductMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeProduct({ userId, productId }),
    onSuccess: () => invalidateStudio(queryClient, userId),
  });
}

export function useProductStatusMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; status: StudioProductStatus }) =>
      updateProductStatus({ userId, ...input }),
    onSuccess: () => invalidateStudio(queryClient, userId),
  });
}

export function useSaveSettingsMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: StudioSettings) =>
      updateStudioSettings({ userId, settings }),
    onSuccess: (settings) => {
      queryClient.setQueryData(studioKeys.settings(userId), settings);
    },
  });
}

export function useDeactivateStoreMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deactivateStore(userId),
    onSuccess: (settings) => {
      queryClient.setQueryData(studioKeys.settings(userId), settings);
    },
  });
}
