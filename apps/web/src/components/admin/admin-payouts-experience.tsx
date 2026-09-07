"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AdminListPagination,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { useAdminPayouts, useAdminUpdatePayoutStatus } from "@/hooks/use-earnings";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AdminPayoutsExperience() {
  const [status, setStatus] = useState("all");
  const [creatorId, setCreatorId] = useState("");
  const [page, setPage] = useState(1);
  const query = useAdminPayouts({
    page,
    pageSize: 20,
    status,
    creatorId: creatorId.trim() || undefined,
  });
  const updateMutation = useAdminUpdatePayoutStatus();

  if (query.isPending) {
    return (
      <AdminPage>
        <AdminPageHeader title="Payouts" description="Inspect creator payout requests." />
        <TableSkeleton rows={6} />
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

  return (
    <AdminPage>
      <AdminPageHeader
        title="Payouts"
        description="Manual settlement only. Mark paid after external transfer; failed restores reserved earnings."
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="text-sm text-muted-foreground">
          Status{" "}
          <select
            className="ml-2 rounded-lg border border-border bg-background px-2 py-1.5"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="REQUESTED">Requested</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Creator ID{" "}
          <input
            className="ml-2 rounded-lg border border-border bg-background px-2 py-1.5"
            value={creatorId}
            onChange={(event) => {
              setCreatorId(event.target.value);
              setPage(1);
            }}
            placeholder="cp_…"
          />
        </label>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="py-3 pr-3 font-medium">Creator</th>
              <th className="py-3 pr-3 font-medium">Amount</th>
              <th className="py-3 pr-3 font-medium">Status</th>
              <th className="py-3 pr-3 font-medium">Requested</th>
              <th className="py-3 pr-3 font-medium">Reference</th>
              <th className="py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {query.data.items.map((row) => (
              <tr key={row.id} className="border-b border-border/70">
                <td className="py-3 pr-3">
                  <Link
                    href={`/admin/payouts/${row.id}`}
                    className="font-medium hover:underline"
                  >
                    {row.creator?.storeName ?? row.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="py-3 pr-3">
                  {formatPrice(row.amount.cents, row.currency)}
                </td>
                <td className="py-3 pr-3">{row.status}</td>
                <td className="py-3 pr-3">{formatDate(row.requestedAt)}</td>
                <td className="py-3 pr-3 font-mono text-xs">{row.reference}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {row.status === "REQUESTED" ? (
                      <button
                        type="button"
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          void updateMutation.mutateAsync({
                            payoutId: row.id,
                            status: "PROCESSING",
                          })
                        }
                      >
                        Process
                      </button>
                    ) : null}
                    {row.status === "REQUESTED" || row.status === "PROCESSING" ? (
                      <>
                        <button
                          type="button"
                          className={cn(buttonVariants({ size: "sm" }))}
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            void updateMutation.mutateAsync({
                              payoutId: row.id,
                              status: "PAID",
                            })
                          }
                        >
                          Mark paid
                        </button>
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ size: "sm", variant: "outline" }),
                          )}
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            void updateMutation.mutateAsync({
                              payoutId: row.id,
                              status: "FAILED",
                              failureMessage: "Could not complete payout.",
                            })
                          }
                        >
                          Fail
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminListPagination
        page={query.data.meta.page}
        totalPages={query.data.meta.totalPages}
        hasPreviousPage={query.data.meta.page > 1}
        hasNextPage={query.data.meta.page < query.data.meta.totalPages}
        onPrevious={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </AdminPage>
  );
}
