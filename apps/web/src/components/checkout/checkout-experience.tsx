"use client";

import { Lock, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        icon={ShoppingBag}
        title="Your bag is empty"
        description="Add a product to your bag, then come back. Payment will run through Razorpay once it is connected."
        actionHref="/discover"
        actionLabel="Discover products"
      />
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Checkout"
        title="Review and pay"
        description="Razorpay is not connected yet. Your bag is saved on this device — nothing has been charged."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
        <Card className="py-0">
          <CardContent className="divide-y divide-border p-0">
            {lines.map((item) => (
              <div key={item.productId} className="flex gap-4 p-5">
                <Link
                  href={productPath(item.slug)}
                  className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24"
                >
                  <Image src={item.imageUrl} alt="" fill className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={productPath(item.slug)}
                    className="font-medium transition-colors hover:text-brand"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Digital download · {formatPrice(item.priceCents, item.currency)}
                  </p>
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
          <Button size="xl" className="mt-6 w-full rounded-xl" disabled>
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
        </aside>
      </div>
    </Container>
  );
}
