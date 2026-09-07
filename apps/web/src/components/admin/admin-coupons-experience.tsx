"use client";

import { useEffect, useState } from "react";
import {
  AdminListPagination,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { Input } from "@/components/ui/input";
import { useAdminCoupons } from "@/hooks/use-admin";
import { formatDate } from "@/lib/format";

type AdminCouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  usedCount: number;
  maxUses: number | null;
  expiresAt: string | null;
  redemptionCount: number;
  creator: { id: string; storeName: string; slug: string };
  createdAt: string;
};

export function AdminCouponsExperience() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);


  const query = useAdminCoupons({
    page,
    q: debouncedSearch.trim() || undefined,
    status,
  });

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader
          title="Coupons"
          description="Creator discount codes across the marketplace."
        />
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

  const items = query.data.items as AdminCouponRow[];
  const { meta } = query.data;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Coupons"
        description={`${meta.total} coupon${meta.total === 1 ? "" : "s"} · read-only.`}
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search code or store"
          aria-label="Search coupons"
          className="h-11 flex-1 rounded-xl"
        />
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          aria-label="Filter by status"
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No coupons match those filters.
        </p>
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {items.map((coupon) => (
              <li key={coupon.id} className="rounded-xl bg-muted/40 px-3 py-3">
                <p className="font-mono text-sm font-medium">{coupon.code}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {coupon.creator.storeName} · {coupon.isActive ? "Active" : "Inactive"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatCouponValue(coupon)} · {coupon.redemptionCount} redemptions
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Creator</th>
                  <th className="pb-3 font-medium">Value</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Expires</th>
                  <th className="pb-3 text-right font-medium">Used</th>
                </tr>
              </thead>
              <tbody>
                {items.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3 font-mono font-medium">{coupon.code}</td>
                    <td className="py-3 pr-3">{coupon.creator.storeName}</td>
                    <td className="py-3 pr-3">{formatCouponValue(coupon)}</td>
                    <td className="py-3 pr-3">
                      {coupon.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="py-3 pr-3">
                      {coupon.expiresAt ? formatDate(coupon.expiresAt) : "—"}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {coupon.usedCount}
                      {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}
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

function formatCouponValue(coupon: AdminCouponRow) {
  if (coupon.type === "PERCENT") return `${coupon.value}%`;
  return `$${(coupon.value / 100).toFixed(coupon.value % 100 === 0 ? 0 : 2)}`;
}
