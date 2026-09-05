"use client";

import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { useOrder } from "@/hooks/use-checkout";
import { ApiError } from "@/lib/api/client";
import { catalogProductTypeLabel } from "@/lib/api/checkout";
import { formatDate, formatPrice } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderQuery = useOrder(params.id);
  const order = orderQuery.data;

  if (orderQuery.isPending) {
    return (
      <Container className="flex min-h-[50vh] items-center justify-center py-16">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </Container>
    );
  }

  if (orderQuery.error instanceof ApiError && orderQuery.error.status === 403) {
    return (
      <Container className="py-16 text-center">
        <h1 className="font-display text-3xl">This receipt isn’t yours</h1>
        <Link href="/orders" className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-xl")}>
          Back to orders
        </Link>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-16 text-center">
        <h1 className="font-display text-3xl">Order not found</h1>
        <Link href="/orders" className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-xl")}>
          Back to orders
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Receipt"
        title={`Order #${order.id.slice(-8).toUpperCase()}`}
        description={`${order.status} · ${formatDate(order.createdAt)}`}
      />
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 p-5">
              <Link
                href={productPath(item.product.slug)}
                className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted"
              >
                <Image src={item.product.coverImage} alt="" fill className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.productTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.product.creator.storeName} · {catalogProductTypeLabel(item.product.productType)}
                </p>
                <p className="mt-2 text-sm">
                  {formatPrice(item.priceCents, order.currency)} · Qty {item.quantity}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotalCents, order.currency)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>Discount</span>
            <span>
              {order.discountCents
                ? formatPrice(order.discountCents, order.currency)
                : "—"}
            </span>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span>Total</span>
            <span className="font-display text-2xl">
              {formatPrice(order.totalCents, order.currency)}
            </span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Payment {order.payment?.status ?? "unavailable"}
          </p>
          {order.status === "PAID" ? (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm font-medium">Purchase complete</p>
              <Link
                href={
                  order.items[0]
                    ? `/library/${order.items[0].productId}`
                    : "/library"
                }
                className={cn(buttonVariants({ size: "lg" }), "mt-3 w-full rounded-xl")}
              >
                Access your files
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Files unlock after this order is marked paid by the server.
            </p>
          )}
        </aside>
      </div>
    </Container>
  );
}
