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
import { useAdminCreators } from "@/hooks/use-admin";
import { formatDate, formatPrice } from "@/lib/format";

export function AdminCreatorsExperience() {
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


  const query = useAdminCreators({
    page,
    q: debouncedSearch.trim() || undefined,
    status,
  });

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader title="Creators" description="Seller stores on Lumen." />
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
        title="Creators"
        description={`${meta.total} creator store${meta.total === 1 ? "" : "s"}.`}
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search store or email"
          aria-label="Search creators"
          className="h-11 flex-1 rounded-xl"
        />
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No creators match those filters.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {items.map((creator) => (
              <li key={creator.id}>
                <Link
                  href={`/admin/creators/${creator.id}`}
                  className="block rounded-xl bg-muted/40 px-3 py-3"
                >
                  <p className="text-sm font-medium">{creator.storeName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{creator.email}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {creator.status} · {formatPrice(creator.revenueCents)} ·{" "}
                    {creator.productCount} products
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Store</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 text-right font-medium">Products</th>
                  <th className="pb-3 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {items.map((creator) => (
                  <tr key={creator.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/creators/${creator.id}`}
                        className="font-medium hover:underline"
                      >
                        {creator.storeName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{creator.email}</p>
                    </td>
                    <td className="py-3 pr-3">{creator.status}</td>
                    <td className="py-3 pr-3">{formatDate(creator.joinedAt)}</td>
                    <td className="py-3 text-right tabular-nums">{creator.productCount}</td>
                    <td className="py-3 text-right tabular-nums">
                      {formatPrice(creator.revenueCents)}
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
