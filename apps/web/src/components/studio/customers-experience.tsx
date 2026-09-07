"use client";

import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { AnalyticsRangeControl } from "@/components/studio/analytics-range-control";
import { EmptyState } from "@/components/layout/empty-state";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { StudioPage } from "@/components/studio/studio-page";
import { Input } from "@/components/ui/input";
import { useCreatorCustomerAnalytics } from "@/hooks/use-analytics";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AnalyticsRangeParams } from "@/types/analytics";

type SortKey = "spent" | "purchases" | "recent" | "name";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  purchaseCount: number;
  totalSpentCents: number;
  lastPurchaseAt: string;
};

export function CustomersExperience() {
  const [range, setRange] = useState<AnalyticsRangeParams>({ range: "this_year" });
  const query = useCreatorCustomerAnalytics(range);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("spent");
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const customers = useMemo(() => {
    const list = (query.data?.items ?? []).map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      avatarUrl:
        customer.avatarUrl ??
        `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(customer.name)}`,
      purchaseCount: customer.purchaseCount,
      totalSpentCents: customer.totalSpentCents,
      lastPurchaseAt: customer.lastPurchaseAt,
    }));
    const q = search.trim().toLowerCase();
    return list
      .filter((customer) =>
        q ? `${customer.name} ${customer.email}`.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "purchases") return b.purchaseCount - a.purchaseCount;
        if (sort === "recent") {
          return (
            new Date(b.lastPurchaseAt).getTime() -
            new Date(a.lastPurchaseAt).getTime()
          );
        }
        return b.totalSpentCents - a.totalSpentCents;
      });
  }, [query.data, search, sort]);

  if (query.isPending) {
    return (
      <StudioPage>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Customers</h1>
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

  const summary = query.data!;
  const currency = summary.currency;

  return (
    <StudioPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Customers
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.customers === 0
              ? "People who buy from you will appear here."
              : `${summary.customers} buyers · ${summary.newCustomers} new · ${summary.returningCustomers} returning`}
          </p>
        </div>
        <AnalyticsRangeControl value={range} onChange={setRange} />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers"
            aria-label="Search customers"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          aria-label="Sort customers"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="spent">Highest spend</option>
          <option value="purchases">Most purchases</option>
          <option value="recent">Most recent</option>
          <option value="name">Name</option>
        </select>
      </div>

      {summary.customers === 0 ? (
        <EmptyState
          full={false}
          icon={Users}
          title="No customers yet"
          description="After your first paid order, buyers show up here with spend and purchase counts."
          actionHref="/dashboard/products"
          actionLabel="View products"
        />
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
          <div>
            <ul className="space-y-3 lg:hidden">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(customer)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={customer.avatarUrl}
                        alt=""
                        className="size-9 rounded-full object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {customer.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {customer.purchaseCount} purchase
                          {customer.purchaseCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </span>
                    <span className="text-sm tabular-nums">
                      {formatPrice(customer.totalSpentCents, currency)}
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
                    <th className="pb-3 font-medium">Purchases</th>
                    <th className="pb-3 font-medium">Last order</th>
                    <th className="pb-3 text-right font-medium">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className={cn(
                        "cursor-pointer border-b border-border/70 last:border-0",
                        selected?.id === customer.id && "bg-muted/40",
                      )}
                      onClick={() => setSelected(customer)}
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={customer.avatarUrl}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-muted-foreground">
                        {customer.purchaseCount}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {formatDate(customer.lastPurchaseAt)}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {formatPrice(customer.totalSpentCents, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customers.length === 0 ? (
              <p className="mt-8 text-sm text-muted-foreground">
                No customers match that search.
              </p>
            ) : null}
          </div>

          <aside className="rounded-2xl bg-muted/40 p-5">
            {selected ? (
              <div>
                <p className="text-lg font-medium">{selected.name}</p>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Purchases</dt>
                    <dd className="tabular-nums">{selected.purchaseCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Spent with you</dt>
                    <dd className="tabular-nums">
                      {formatPrice(selected.totalSpentCents, currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Last purchase</dt>
                    <dd>{formatDate(selected.lastPurchaseAt)}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a customer to see spend details.
              </p>
            )}
          </aside>
        </div>
      )}
    </StudioPage>
  );
}
