"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCreatorCoupon,
  deactivateCreatorCoupon,
  deleteCreatorCoupon,
  getCreatorCoupon,
  getCreatorCouponUsage,
  listCreatorCoupons,
  previewCheckout,
  updateCreatorCoupon,
  type CouponInput,
} from "@/lib/api/coupons";
import { createCheckoutOrder } from "@/lib/api/checkout";

export const couponKeys = {
  all: ["coupons"] as const,
  list: (params: Record<string, unknown>) => ["coupons", "list", params] as const,
  detail: (id: string) => ["coupons", id] as const,
  usage: (id: string) => ["coupons", id, "usage"] as const,
  preview: (code: string | null) => ["checkout", "preview", code] as const,
};

export function useCreatorCoupons(params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: couponKeys.list(params),
    queryFn: () => listCreatorCoupons(params),
  });
}

export function useCreatorCoupon(couponId: string | undefined) {
  return useQuery({
    queryKey: couponKeys.detail(couponId ?? ""),
    queryFn: () => getCreatorCoupon(couponId as string),
    enabled: Boolean(couponId),
    select: (data) => data.coupon,
  });
}

export function useCouponUsage(couponId: string | undefined) {
  return useQuery({
    queryKey: couponKeys.usage(couponId ?? ""),
    queryFn: () => getCreatorCouponUsage(couponId as string),
    enabled: Boolean(couponId),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CouponInput) => createCreatorCoupon(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useUpdateCoupon(couponId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CouponInput>) =>
      updateCreatorCoupon(couponId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.all });
      void queryClient.invalidateQueries({ queryKey: couponKeys.detail(couponId) });
    },
  });
}

export function useDeactivateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId: string) => deactivateCreatorCoupon(couponId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId: string) => deleteCreatorCoupon(couponId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useCheckoutPreview(couponCode: string | null, enabled = true) {
  return useQuery({
    queryKey: couponKeys.preview(couponCode),
    queryFn: () => previewCheckout(couponCode ?? undefined),
    enabled,
    staleTime: 5_000,
    retry: false,
  });
}

export function useApplyCheckoutCoupon() {
  return useMutation({
    mutationFn: (couponCode?: string) => previewCheckout(couponCode),
  });
}

export function useCreateCheckoutOrderWithCoupon() {
  return useMutation({
    mutationFn: (couponCode?: string) =>
      createCheckoutOrder(couponCode ? { couponCode } : {}),
  });
}
