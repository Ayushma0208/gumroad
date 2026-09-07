"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { useAdminOrder } from "@/hooks/use-admin";
import { formatDate, formatPrice } from "@/lib/format";

type OrderItem = {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  coverImage: string;
  creator: { id: string; storeName: string; slug: string };
  priceCents: number;
  quantity: number;
};

export function AdminOrderDetailExperience() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const query = useAdminOrder(orderId);

  if (query.isPending) {
    return (
      <AdminPage>
        <div className="mt-2">
          <TableSkeleton />
        </div>
      </AdminPage>
    );
  }

  if (query.isError || !query.data?.order) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const order = query.data.order;
  const items = (order.items as OrderItem[] | undefined) ?? [];
  const currency = order.currency;
  const subtotal = Number(order.subtotal ?? order.totalAmount);
  const discount = Number(order.discount ?? 0);

  return (
    <AdminPage>
      <AdminPageHeader
        title={`Order ${order.id.slice(0, 8)}`}
        description={`${order.status} · ${formatDate(order.createdAt)}`}
      />

      <p className="mt-4">
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
          ← All orders
        </Link>
      </p>

      <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField
          label="Customer"
          value={
            <Link href={`/admin/users/${order.customer.id}`} className="hover:underline">
              {order.customer.name}
            </Link>
          }
        />
        <DetailField label="Email" value={order.customer.email} />
        <DetailField label="Status" value={order.status} />
        <DetailField
          label="Subtotal"
          value={formatPrice(subtotal, currency)}
        />
        <DetailField label="Discount" value={formatPrice(discount, currency)} />
        <DetailField
          label="Total"
          value={formatPrice(order.totalAmount, currency)}
        />
        <DetailField label="Coupon" value={order.couponCode ?? "—"} />
        <DetailField
          label="Payment"
          value={
            order.payment && typeof order.payment === "object"
              ? String((order.payment as { status?: string }).status ?? "—")
              : (order.paymentStatus ?? "—")
          }
        />
      </dl>

      <section className="mt-12">
        <h2 className="text-base font-medium">Items</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No line items.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${item.productId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {item.productTitle}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.creator.storeName} · qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm tabular-nums">
                  {formatPrice(item.priceCents * item.quantity, currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminPage>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
