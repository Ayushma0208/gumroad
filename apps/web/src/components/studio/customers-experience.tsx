"use client";

import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { StudioPage } from "@/components/studio/studio-page";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useStudioCustomers } from "@/hooks/use-studio";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudioCustomer } from "@/types/studio";

type SortKey = "spent" | "purchases" | "recent" | "name";

export function CustomersExperience() {
  const { user } = useAuth();
  const query = useStudioCustomers(user?.id);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("spent");
  const [selected, setSelected] = useState<StudioCustomer | null>(null);

  const customers = useMemo(() => {
    const list = query.data ?? [];
    const q = search.trim().toLowerCase();
    return list
      .filter((customer) =>
        q
          ? `${customer.name} ${customer.email}`.toLowerCase().includes(q)
          : true,
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

  const all = query.data ?? [];

  return (
    <StudioPage>
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Customers</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {all.length === 0
          ? "People who buy from you will appear here."
          : `${all.length} buyers · insight, not a CRM.`}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
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

      {all.length === 0 ? (
        <EmptyState
          full={false}
          icon={Users}
          title="No customers yet"
          description="After the first sale, you’ll see who bought, how often, and how much they spent."
          actionHref="/dashboard/products"
          actionLabel="View products"
        />
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]">
          <ul className="divide-y divide-border">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => setSelected(customer)}
                  className={cn(
                    "flex w-full items-center gap-3 py-3.5 text-left",
                    selected?.id === customer.id && "bg-muted/40 -mx-2 rounded-xl px-2",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customer.avatarUrl}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {customer.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {customer.email}
                    </span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block text-sm tabular-nums">
                      {formatPrice(customer.totalSpentCents)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {customer.purchaseCount}{" "}
                      {customer.purchaseCount === 1 ? "purchase" : "purchases"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <aside className="rounded-2xl bg-muted/40 p-5">
            {selected ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.avatarUrl}
                  alt=""
                  className="size-14 rounded-full object-cover"
                />
                <p className="mt-3 text-lg font-medium">{selected.name}</p>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Spent</dt>
                    <dd className="tabular-nums">
                      {formatPrice(selected.totalSpentCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Purchases</dt>
                    <dd>{selected.purchaseCount}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Last purchase</dt>
                    <dd>{formatDate(selected.lastPurchaseAt)}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a customer to see their totals.
              </p>
            )}
          </aside>
        </div>
      )}
    </StudioPage>
  );
}
