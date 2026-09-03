"use client";

import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        icon={ShoppingBag}
        title="Your bag is empty"
        description="Browse the marketplace and add something you actually want to own."
        actionHref="/discover"
        actionLabel="Discover products"
      />
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        title="Cart"
        description={`${items.length} ${items.length === 1 ? "item" : "items"} ready for checkout.`}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
        <Card className="py-0">
          <CardContent className="divide-y divide-border p-0">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4 p-5">
                <Link
                  href={productPath(item.slug)}
                  className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24"
                >
                  <Image src={item.imageUrl} alt="" fill className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={productPath(item.slug)}
                    className="font-medium transition-colors hover:text-brand"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Qty {item.quantity} · {formatPrice(item.priceCents, item.currency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="mt-auto w-fit pt-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-display text-2xl tracking-tight">{formatPrice(total)}</p>
          </div>
          <Link
            href="/checkout"
            className={cn(buttonVariants({ size: "xl" }), "mt-6 w-full rounded-xl")}
          >
            Checkout
          </Link>
          <Link
            href="/discover"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "mt-2 w-full rounded-xl",
            )}
          >
            Continue browsing
          </Link>
        </aside>
      </div>
    </Container>
  );
}
