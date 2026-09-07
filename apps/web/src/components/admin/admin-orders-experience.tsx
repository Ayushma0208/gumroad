"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminListPagination,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { Input } from "@/components/ui/input";
import { useAdminOrders } from "@/hooks/use-admin";
import { formatDate, formatPrice } from "@/lib/format";

export function AdminOrdersExperience() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);


  const query = useAdminOrders({
    page,
    q: debouncedSearch.trim() || undefined,
    status,
  });

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader title="Orders" description="Marketplace checkout activity." />
        <div className="mt-8">
          <TableSkeleton />
        </div>
      </AdminPage>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const { items, meta } = query.data;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Orders"
        description={`${meta.total} order${meta.total === 1 ? "" : "s"}.`}
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customer or coupon"
          aria-label="Search orders"
          className="h-11 flex-1 rounded-xl"
        />
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No orders match those filters.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {items.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-xl bg-muted/40 px-3 py-3"
                >
                  <p className="text-sm font-medium">{order.customer.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.status} · {order.itemCount} item
                    {order.itemCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-2 text-sm tabular-nums">
                    {formatPrice(order.totalAmount, order.currency)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => (
                  <tr key={order.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.id.slice(0, 8)}…
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                        {order.couponCode ? ` · ${order.couponCode}` : ""}
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      <p>{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                    </td>
                    <td className="py-3 pr-3">{order.status}</td>
                    <td className="py-3 pr-3">{formatDate(order.createdAt)}</td>
                    <td className="py-3 text-right tabular-nums">
                      {formatPrice(order.totalAmount, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminListPagination
            page={meta.page}
            totalPages={meta.totalPages}
            hasNextPage={meta.hasNextPage}
            hasPreviousPage={meta.hasPreviousPage}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </AdminPage>
  );
}
