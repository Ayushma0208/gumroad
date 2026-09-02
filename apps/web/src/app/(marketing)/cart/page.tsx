"use client";

import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty."
        description="Browse the marketplace and add something you actually want to own."
        actionHref="/discover"
        actionLabel="Discover products"
      />
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="font-display text-4xl tracking-tight">Cart</h1>
      <ul className="mt-10 divide-y divide-border">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-4 py-6">
            <span className="relative size-24 overflow-hidden rounded-xl bg-muted">
              <Image src={item.imageUrl} alt="" fill className="object-cover" />
            </span>
            <div className="flex flex-1 flex-col">
              <Link href={productPath(item.slug)} className="font-medium">
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                Qty {item.quantity} · {formatPrice(item.priceCents, item.currency)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="mt-auto w-fit text-sm text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <p className="text-muted-foreground">Total</p>
        <p className="font-display text-2xl">{formatPrice(total)}</p>
      </div>
      <Link
        href="/checkout"
        className={cn(buttonVariants({ size: "xl" }), "mt-6 rounded-xl")}
      >
        Checkout
      </Link>
    </Container>
  );
}
