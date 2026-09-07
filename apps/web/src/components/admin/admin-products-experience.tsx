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
import { useAdminProducts } from "@/hooks/use-admin";
import { formatDate, formatPrice } from "@/lib/format";

export function AdminProductsExperience() {
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


  const query = useAdminProducts({
    page,
    q: debouncedSearch.trim() || undefined,
    status,
  });

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader title="Products" description="Catalog across all creators." />
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
        title="Products"
        description={`${meta.total} product${meta.total === 1 ? "" : "s"} in the catalog.`}
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title or store"
          aria-label="Search products"
          className="h-11 flex-1 rounded-xl"
        />
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No products match those filters.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {items.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex gap-3 rounded-xl bg-muted/40 px-3 py-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.coverImage}
                    alt=""
                    className="size-14 rounded-lg object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {product.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {product.creator.storeName} · {product.status}
                    </span>
                    <span className="mt-1 block text-xs tabular-nums">
                      {formatPrice(product.priceCents, product.currency)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Creator</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Updated</th>
                  <th className="pb-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => (
                  <tr key={product.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium hover:underline"
                      >
                        {product.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{product.category.label}</p>
                    </td>
                    <td className="py-3 pr-3">{product.creator.storeName}</td>
                    <td className="py-3 pr-3">{product.status}</td>
                    <td className="py-3 pr-3">{formatDate(product.updatedAt)}</td>
                    <td className="py-3 text-right tabular-nums">
                      {formatPrice(product.priceCents, product.currency)}
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
