"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/catalog";

export function ProductPurchaseActions({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  function addToCart() {
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      priceCents: product.priceCents,
      currency: product.currency,
      imageUrl: product.imageUrl,
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => {
          addToCart();
          router.push("/cart");
        }}
        className={cn(buttonVariants({ size: "xl" }), "rounded-xl")}
      >
        Buy now
      </button>
      <button
        type="button"
        onClick={addToCart}
        className={cn(
          buttonVariants({ variant: "outline", size: "xl" }),
          "rounded-xl",
        )}
      >
        Add to cart
      </button>
    </div>
  );
}
