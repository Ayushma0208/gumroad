"use client";

import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useProductCart } from "@/hooks/use-product-cart";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

export function ProductCardCartButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { inCart, addToCart, adding } = useProductCart(product);

  return (
    <button
      type="button"
      aria-label={inCart ? "In your bag" : "Add to cart"}
      disabled={adding || inCart}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (inCart || adding) return;
        void addToCart();
      }}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-white/15 bg-background/90 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-background disabled:opacity-80",
        className,
      )}
    >
      {adding ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <ShoppingBag className={cn("size-4", inCart && "fill-current")} />
      )}
    </button>
  );
}
