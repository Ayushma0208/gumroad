"use client";

import { Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { Button, buttonVariants } from "@/components/ui/button";
import type { CheckoutLine } from "@/lib/api/checkout";
import { formatPrice } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

export function CheckoutExperience({
  preset,
}: {
  preset: CheckoutLine | null;
}) {
  const items = useCartStore((state) => state.items);

  const lines = preset ? [preset] : items;

  const total = lines.reduce((sum, item) => sum + item.priceCents, 0);

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty."
        description="Add a product to your bag, then come back. Payment will run through Razorpay once it is connected."
        actionHref="/discover"
        actionLabel="Discover products"
      />
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Checkout
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Review and pay
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Razorpay is not connected yet. Your bag is saved on this device — nothing
        has been charged.
      </p>

      <ul className="mt-10 divide-y divide-border border-y border-border">
        {lines.map((item) => (
          <li key={item.productId} className="flex gap-4 py-6">
            <Link
              href={productPath(item.slug)}
              className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted"
            >
              <Image src={item.imageUrl} alt="" fill className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={productPath(item.slug)}
                className="font-medium hover:text-brand"
              >
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                Digital download · {formatPrice(item.priceCents, item.currency)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-muted-foreground">Total</p>
        <p className="font-display text-3xl">{formatPrice(total)}</p>
      </div>

      <div className="mt-8 max-w-md">
        <Button size="xl" className="w-full rounded-xl" disabled>
          Pay with Razorpay
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          Payments will be encrypted and processed by Razorpay.
        </p>
        <Link
          href="/cart"
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "mt-2 w-full rounded-xl",
          )}
        >
          Back to bag
        </Link>
      </div>
    </Container>
  );
}
