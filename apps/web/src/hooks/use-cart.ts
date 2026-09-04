"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  addToCart,
  clearCart,
  emptyCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type Cart,
} from "@/lib/api/cart";
import { useAuth } from "@/hooks/use-auth";

export const cartQueryKey = ["cart"] as const;

export function useCart() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && user?.role === "CUSTOMER";

  return useQuery({
    queryKey: cartQueryKey,
    queryFn: getCart,
    enabled,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status < 500) return false;
      return failureCount < 1;
    },
  });
}

export function useCartCount() {
  const cart = useCart();
  return cart.data?.summary.itemCount ?? 0;
}

export function useHasCartProduct(productId: string | undefined) {
  const cart = useCart();
  if (!productId) return false;
  return Boolean(
    cart.data?.items.some((item) => item.product.id === productId),
  );
}

function setCart(queryClient: ReturnType<typeof useQueryClient>, cart: Cart) {
  queryClient.setQueryData(cartQueryKey, cart);
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; quantity?: number }) =>
      addToCart(input.productId, input.quantity ?? 1),
    onSuccess: (cart) => setCart(queryClient, cart),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; quantity: number }) =>
      updateCartItem(input.itemId, input.quantity),
    onSuccess: (cart) => setCart(queryClient, cart),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previous = queryClient.getQueryData<Cart>(cartQueryKey);
      if (previous) {
        const items = previous.items.filter((item) => item.id !== itemId);
        const subtotalCents = items
          .filter((item) => item.product.available)
          .reduce((sum, item) => sum + item.subtotalCents, 0);
        setCart(queryClient, {
          ...previous,
          items,
          summary: {
            ...previous.summary,
            subtotalCents,
            totalCents: subtotalCents,
            subtotal: subtotalCents / 100,
            total: subtotalCents / 100,
            itemCount: items.filter((item) => item.product.available).length,
          },
        });
      }
      return { previous };
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous) setCart(queryClient, context.previous);
    },
    onSuccess: (cart) => setCart(queryClient, cart),
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previous = queryClient.getQueryData<Cart>(cartQueryKey);
      setCart(queryClient, previous ? { ...emptyCart(), id: previous.id } : emptyCart());
      return { previous };
    },
    onError: (_error, _void, context) => {
      if (context?.previous) setCart(queryClient, context.previous);
    },
    onSuccess: (cart) => setCart(queryClient, cart),
  });
}
