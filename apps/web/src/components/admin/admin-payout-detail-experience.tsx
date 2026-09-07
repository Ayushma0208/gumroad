"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { useAdminPayout, useAdminUpdatePayoutStatus } from "@/hooks/use-earnings";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AdminPayoutDetailExperience() {
  const params = useParams<{ payoutId: string }>();
  const payoutId = params.payoutId;
  const query = useAdminPayout(payoutId);
  const updateMutation = useAdminUpdatePayoutStatus();

  if (query.isPending) {
    return (
      <AdminPage>
        <TableSkeleton rows={5} />
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

  const payout = query.data;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Payout detail"
        description={`${payout.creator?.storeName ?? "Creator"} · ${payout.status}`}
      />
      <Link href="/admin/payouts" className="text-sm text-muted-foreground hover:text-foreground">
        ← All payouts
      </Link>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="mt-1 font-medium">
            {formatPrice(payout.amount.cents, payout.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="mt-1 font-mono">{payout.reference}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Requested</dt>
          <dd className="mt-1">{formatDate(payout.requestedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Processed</dt>
          <dd className="mt-1">
            {payout.processedAt ? formatDate(payout.processedAt) : "—"}
          </dd>
        </div>
      </dl>

      {payout.failureMessage ? (
        <p className="mt-6 text-sm text-muted-foreground">{payout.failureMessage}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {payout.status === "REQUESTED" ? (
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
            onClick={() =>
              void updateMutation.mutateAsync({
                payoutId: payout.id,
                status: "PROCESSING",
              })
            }
          >
            Mark processing
          </button>
        ) : null}
        {payout.status === "REQUESTED" || payout.status === "PROCESSING" ? (
          <>
            <button
              type="button"
              className={cn(buttonVariants(), "rounded-xl")}
              onClick={() =>
                void updateMutation.mutateAsync({
                  payoutId: payout.id,
                  status: "PAID",
                })
              }
            >
              Mark paid
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
              onClick={() =>
                void updateMutation.mutateAsync({
                  payoutId: payout.id,
                  status: "FAILED",
                  failureMessage: "Could not complete payout.",
                })
              }
            >
              Mark failed
            </button>
          </>
        ) : null}
      </div>

      {payout.items && payout.items.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-base font-medium">Earnings included</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {payout.items.map((item) => (
              <li key={item.id} className="flex justify-between py-2">
                <span>{item.product.title}</span>
                <span>{formatPrice(item.amount.cents, payout.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </AdminPage>
  );
}
