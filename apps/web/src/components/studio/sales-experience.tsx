"use client";

import { Receipt, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { PaymentStatusBadge } from "@/components/studio/status-badge";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { StudioPage } from "@/components/studio/studio-page";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useStudioSales } from "@/hooks/use-studio";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentStatus, StudioSale } from "@/types/studio";

type StatusFilter = "all" | PaymentStatus;
type DateFilter = "all" | "30" | "90";

const FILTER_NOW = Date.parse("2026-09-04T12:00:00.000Z");

export function SalesExperience() {
  const { user } = useAuth();
  const query = useStudioSales(user?.id);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dates, setDates] = useState<DateFilter>("all");
  const [selected, setSelected] = useState<StudioSale | null>(null);

  const sales = useMemo(() => query.data ?? [], [query.data]);
  const paid = sales.filter((sale) => sale.status === "paid");
  const revenue = paid.reduce((sum, sale) => sum + sale.amountCents, 0);
  const now = FILTER_NOW;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cutoff =
      dates === "all" ? 0 : now - Number(dates) * 24 * 60 * 60 * 1000;
    return sales.filter((sale) => {
      if (status !== "all" && sale.status !== status) return false;
      if (cutoff && new Date(sale.purchasedAt).getTime() < cutoff) return false;
      if (!q) return true;
      return `${sale.customerName} ${sale.productTitle} ${sale.customerEmail}`
        .toLowerCase()
        .includes(q);
    });
  }, [dates, now, sales, search, status]);

  if (query.isPending) {
    return (
      <StudioPage>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Sales</h1>
        <div className="mt-8">
          <TableSkeleton />
        </div>
      </StudioPage>
    );
  }

  if (query.isError) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </StudioPage>
    );
  }

  return (
    <StudioPage>
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Sales</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {paid.length} paid orders · {formatPrice(revenue)}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer or product"
            aria-label="Search sales"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          aria-label="Payment status"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={dates}
          onChange={(event) => setDates(event.target.value as DateFilter)}
          aria-label="Date range"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All time</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {sales.length === 0 ? (
        <EmptyState
          full={false}
          icon={Receipt}
          title="No sales yet"
          description="When someone buys, the order will show here with the buyer, product, and status."
          actionHref="/dashboard/products/new"
          actionLabel="Create a product"
        />
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
          <div>
            <ul className="space-y-3 lg:hidden">
              {filtered.map((sale) => (
                <li key={sale.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(sale)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3 text-left"
                  >
                    <span>
                      <span className="block text-sm font-medium">{sale.customerName}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {sale.productTitle}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm tabular-nums">
                        {formatPrice(sale.amountCents, sale.currency)}
                      </span>
                      <PaymentStatusBadge status={sale.status} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      className={cn(
                        "cursor-pointer border-b border-border/70 last:border-0",
                        selected?.id === sale.id && "bg-muted/40",
                      )}
                      onClick={() => setSelected(sale)}
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sale.customerAvatarUrl}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                          {sale.customerName}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{sale.productTitle}</td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {formatDate(sale.purchasedAt)}
                      </td>
                      <td className="py-3 pr-3">
                        <PaymentStatusBadge status={sale.status} />
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {formatPrice(sale.amountCents, sale.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 ? (
              <p className="mt-8 text-sm text-muted-foreground">No sales match those filters.</p>
            ) : null}
          </div>

          <aside className="rounded-2xl bg-muted/40 p-5">
            {selected ? (
              <SaleDetail sale={selected} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a sale to see the receipt.
              </p>
            )}
          </aside>
        </div>
      )}
    </StudioPage>
  );
}

function SaleDetail({ sale }: { sale: StudioSale }) {
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
        {sale.id}
      </p>
      <p className="mt-2 text-lg font-medium">{sale.customerName}</p>
      <p className="text-sm text-muted-foreground">{sale.customerEmail}</p>
      <div className="mt-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sale.productCoverUrl} alt="" className="size-12 rounded-lg object-cover" />
        <div>
          <p className="text-sm font-medium">{sale.productTitle}</p>
          <p className="text-xs text-muted-foreground">{formatDate(sale.purchasedAt)}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="tabular-nums">{formatPrice(sale.amountCents, sale.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <PaymentStatusBadge status={sale.status} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
