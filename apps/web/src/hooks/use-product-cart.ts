"use client";

import { useCallback } from "react";
import { productToCheckoutLine } from "@/lib/api/checkout";
import { useCartStore } from "@/stores/cart-store";
import { useToastStore } from "@/stores/toast-store";
import type { Product } from "@/types/catalog";

export function useProductCart(product: Product) {
  const addItem = useCartStore((state) => state.addItem);
  const inCart = useCartStore((state) =>
    state.items.some((item) => item.productId === product.id),
  );
  const showToast = useToastStore((state) => state.show);

  const addToCart = useCallback(
    (options?: { silent?: boolean }) => {
      const added = addItem(productToCheckoutLine(product));
      if (!options?.silent) {
        if (added) {
          showToast({
            title: "Added to your bag",
            description: product.title,
          });
        } else {
          showToast({
            title: "Already in your bag",
            description: "Digital products are added once.",
          });
        }
      }
      return added;
    },
    [addItem, product, showToast],
  );

  return { inCart, addToCart };
}
