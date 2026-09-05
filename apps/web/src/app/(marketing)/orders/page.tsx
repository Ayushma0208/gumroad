"use client";

import { Receipt } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { useOrders } from "@/hooks/use-checkout";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrdersPage() {
  const orders = useOrders();
  const list = orders.data ?? [];

  if (orders.isPending) {
    return (
      <Container className="py-10">
        <PageHeader eyebrow="Account" title="Orders" description="Receipts for everything you’ve bought on Lumen." />
      </Container>
    );
  }

  if (list.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No orders yet"
        description="When you buy something on Lumen, the receipt lives here."
        actionHref="/discover"
        actionLabel="Browse the marketplace"
      />
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Account"
        title="Orders"
        description="Paid orders unlock library access. Pending payments stay in your bag until they succeed."
      />
      <ul className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
        {list.map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">Order #{order.id.slice(-8).toUpperCase()}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(order.createdAt)} · {order.items.length} item
                  {order.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                  {order.status}
                </span>
                <span className="font-display text-xl">
                  {formatPrice(order.totalCents, order.currency)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
