"use client";

import { Check, LoaderCircle, Lock, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useProductCart } from "@/hooks/use-product-cart";
import { PRODUCT_TYPE_LABELS } from "@/lib/catalog/query";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types/catalog";

export function ProductPurchaseCard({
  product,
  variant = "panel",
}: {
  product: ProductDetail;
  variant?: "panel" | "bar";
}) {
  const router = useRouter();
  const { inCart, addToCart, adding } = useProductCart(product);
  const [buying, startBuy] = useTransition();

  async function onAdd() {
    if (adding || buying) return;
    await addToCart();
  }

  function onBuy() {
    if (adding || buying) return;
    startBuy(async () => {
      const added = await addToCart({ silent: true });
      if (added || inCart) {
        router.push(`/checkout?product=${product.slug}`);
      }
    });
  }

  const summary = product.includedItems.slice(0, 3);
  const busy = adding || buying;

  if (variant === "bar") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/92 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-none">
              {formatPrice(product.priceCents, product.currency)}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {PRODUCT_TYPE_LABELS[product.productType]} · Instant delivery
            </p>
          </div>
          <Button
            size="lg"
            className="h-11 rounded-xl px-5"
            onClick={onBuy}
            disabled={busy}
          >
            {buying ? <LoaderCircle className="animate-spin" /> : null}
            Buy now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="font-display text-4xl tracking-tight">
        {formatPrice(product.priceCents, product.currency)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {PRODUCT_TYPE_LABELS[product.productType]} · Instant download
      </p>

      {summary.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-border pt-5">
          {summary.map((item) => (
            <li key={item.id} className="flex gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
              <span>
                {item.label}
                {item.detail ? (
                  <span className="block text-xs text-muted-foreground/80">
                    {item.detail}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-col gap-2.5">
        <Button
          size="xl"
          className="w-full rounded-xl"
          onClick={onBuy}
          disabled={busy}
        >
          {buying ? <LoaderCircle className="animate-spin" /> : null}
          Buy now
        </Button>
        {inCart ? (
          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "outline", size: "xl" }),
              "w-full rounded-xl",
            )}
          >
            <ShoppingBag />
            In your bag
          </Link>
        ) : (
          <Button
            variant="outline"
            size="xl"
            className="w-full rounded-xl"
            onClick={onAdd}
            disabled={busy}
          >
            {adding ? <LoaderCircle className="animate-spin" /> : null}
            Add to bag
          </Button>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" />
        Secure checkout · Encrypted payment via Razorpay
      </p>
    </div>
  );
}
