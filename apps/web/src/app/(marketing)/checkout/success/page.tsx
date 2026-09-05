"use client";

import { Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { useOrder } from "@/hooks/use-checkout";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

function SuccessBody() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? undefined;
  const orderQuery = useOrder(orderId);
  const order = orderQuery.data;

  if (!orderId) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="font-display text-3xl tracking-tight">Missing order</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Open this page from a completed checkout so we can load the receipt from the server.
        </p>
        <Link href="/orders" className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-xl")}>
          View orders
        </Link>
      </Container>
    );
  }

  if (orderQuery.isPending) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center py-16">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </Container>
    );
  }

  if (!order || order.status !== "PAID") {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="font-display text-3xl tracking-tight">Payment not confirmed</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          This order is not marked paid yet. If you were charged, wait a moment and refresh — we only show success after server verification.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}>
            Try again
          </Link>
          <Link
            href="/cart"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl")}
          >
            Return to bag
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-foreground text-background">
        <Check className="size-7" />
      </span>
      <p className="mt-8 text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Payment successful
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Thank you for your purchase.
      </h1>
      <p className="mt-4 text-muted-foreground">
        Order #{order.id.slice(-8).toUpperCase()} ·{" "}
        {formatPrice(order.totalCents, order.currency)}
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/library" className={cn(buttonVariants({ size: "xl" }), "rounded-xl")}>
          View library
        </Link>
        <Link
          href={`/orders/${order.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "xl" }), "rounded-xl")}
        >
          View order
        </Link>
      </div>
    </Container>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <Container className="flex min-h-[60vh] items-center justify-center py-16">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </Container>
      }
    >
      <SuccessBody />
    </Suspense>
  );
}
