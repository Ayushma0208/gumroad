"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { loginPath } from "@/lib/auth/paths";
import { useAuth } from "@/hooks/use-auth";
import { useAddToCart, useHasCartProduct } from "@/hooks/use-cart";
import { useToastStore } from "@/stores/toast-store";
import type { Product } from "@/types/catalog";

export function cartErrorCopy(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "We couldn’t add that to your bag. Try again.";
  }
  if (error.status === 401) return "Sign in to add products to your bag.";
  if (error.status === 403) return "You can’t add that product to your bag.";
  if (error.status === 404) return "This product is no longer available.";
  if (error.status === 409) return "You already own this product.";
  if (error.status === 400) return "This product is no longer available.";
  return "We couldn’t add that to your bag. Try again.";
}

export function useProductCart(product: Product) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const add = useAddToCart();
  const inCart = useHasCartProduct(product.id);
  const showToast = useToastStore((state) => state.show);

  const addToCart = useCallback(
    async (options?: { silent?: boolean }) => {
      if (isLoading) return false;
      if (!isAuthenticated) {
        router.push(loginPath(pathname || `/product/${product.slug}`));
        return false;
      }
      if (user?.role !== "CUSTOMER") {
        showToast({
          title: "Customer bag only",
          description: "Sign in with a customer account to buy.",
        });
        return false;
      }
      if (inCart) {
        if (!options?.silent) {
          showToast({
            title: "Already in your bag",
            description: "Digital products are added once.",
          });
        }
        return false;
      }
      try {
        await add.mutateAsync({ productId: product.id, quantity: 1 });
        if (!options?.silent) {
          showToast({
            title: "Added to cart",
            description: product.title,
          });
        }
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push(loginPath(pathname || `/product/${product.slug}`));
          return false;
        }
        if (!options?.silent) {
          showToast({
            title: "Couldn’t add to cart",
            description: cartErrorCopy(error),
          });
        }
        return false;
      }
    },
    [
      add,
      inCart,
      isAuthenticated,
      isLoading,
      pathname,
      product.id,
      product.slug,
      product.title,
      router,
      showToast,
      user?.role,
    ],
  );

  return {
    inCart,
    addToCart,
    adding: add.isPending,
    isAuthLoading: isLoading,
  };
}
