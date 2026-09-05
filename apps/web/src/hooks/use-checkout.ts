"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCheckoutOrder,
  getOrder,
  getOrders,
  getPurchases,
  verifyRazorpayPayment,
  type RazorpayCheckoutResponse,
} from "@/lib/api/checkout";
import { cartQueryKey } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

export const ordersQueryKey = ["orders"] as const;
export const purchasesQueryKey = ["library", "purchases"] as const;
export const orderQueryKey = (id: string) => ["orders", id] as const;

export function useOrders() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: getOrders,
    enabled: isAuthenticated,
    select: (data) => data.orders,
  });
}

export function useOrder(orderId: string | undefined) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: orderQueryKey(orderId ?? ""),
    queryFn: () => getOrder(orderId as string),
    enabled: isAuthenticated && Boolean(orderId),
    select: (data) => data.order,
  });
}

export function usePurchases() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: purchasesQueryKey,
    queryFn: getPurchases,
    enabled: isAuthenticated,
    select: (data) => data.purchases,
  });
}

export function useCreateCheckoutOrder() {
  return useMutation({
    mutationFn: createCheckoutOrder,
  });
}

export function useVerifyRazorpayPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RazorpayCheckoutResponse) => verifyRazorpayPayment(input),
    onSuccess: (payload) => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey });
      void queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      void queryClient.invalidateQueries({ queryKey: purchasesQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["library"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      if (payload.order.id) {
        queryClient.setQueryData(orderQueryKey(payload.order.id), payload);
      }
    },
  });
}
