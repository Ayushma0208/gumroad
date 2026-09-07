"use client";

import Link from "next/link";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { StudioPage } from "@/components/studio/studio-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { useCreatorPayouts } from "@/hooks/use-earnings";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useState } from "react";

function payoutStatusLabel(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Requested";
    case "PROCESSING":
      return "Processing";
    case "PAID":
      return "Paid";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export function PayoutsExperience() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const query = useCreatorPayouts({
    page,
    pageSize: 20,
    status: status === "all" ? undefined : status,
  });

  if (query.isPending) {
    return (
      <StudioPage>
        <TableSkeleton rows={5} />
      </StudioPage>
    );
  }

  if (query.isError || !query.data) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </StudioPage>
    );
  }

  const empty = query.data.meta.total === 0;

  return (
    <StudioPage>
      <FadeInOnLoad>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
              Payouts
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              History of withdrawal requests. Paid means ops confirmed settlement —
              not an automatic Razorpay transfer.
            </p>
          </div>
          <Link
            href="/dashboard/earnings"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Back to earnings
          </Link>
        </div>
      </FadeInOnLoad>

      <div className="mt-8 flex justify-end">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Status
          <select
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground"
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
      </div>

      {empty ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <h3 className="font-display text-2xl tracking-tight">No payouts yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Once your earnings become available, your payout history will appear here.
          </p>
          <Link
            href="/dashboard/earnings"
            className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-xl")}
          >
            View earnings
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">Date</th>
                <th className="py-3 pr-4 font-medium">Amount</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Reference</th>
                <th className="py-3 font-medium">Provider</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((row) => (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/payouts/${row.id}`}
                      className="font-medium hover:underline"
                    >
                      {formatDate(row.requestedAt)}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    {formatPrice(row.amount.cents, row.currency)}
                  </td>
                  <td className="py-3 pr-4">{payoutStatusLabel(row.status)}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{row.reference}</td>
                  <td className="py-3 text-muted-foreground">{row.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {query.data.meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {query.data.meta.page} of {query.data.meta.totalPages}
              </span>
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                disabled={page >= query.data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      )}
    </StudioPage>
  );
}
