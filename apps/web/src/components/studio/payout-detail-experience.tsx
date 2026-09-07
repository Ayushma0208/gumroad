"use client";

import Link from "next/link";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { StudioPage } from "@/components/studio/studio-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { useCreatorPayout } from "@/hooks/use-earnings";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PayoutDetailExperience({ payoutId }: { payoutId: string }) {
  const query = useCreatorPayout(payoutId);

  if (query.isPending) {
    return (
      <StudioPage>
        <TableSkeleton rows={4} />
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

  const payout = query.data;

  return (
    <StudioPage>
      <FadeInOnLoad>
        <Link
          href="/dashboard/payouts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Payouts
        </Link>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
          Payout detail
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatPrice(payout.amount.cents, payout.currency)} · {payout.status}
        </p>
      </FadeInOnLoad>

      <dl className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Amount</dt>
          <dd className="mt-1 font-medium">
            {formatPrice(payout.amount.cents, payout.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Status</dt>
          <dd className="mt-1 font-medium">{payout.status}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Requested</dt>
          <dd className="mt-1">{formatDate(payout.requestedAt)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Processed</dt>
          <dd className="mt-1">
            {payout.processedAt ? formatDate(payout.processedAt) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Reference</dt>
          <dd className="mt-1 font-mono text-sm">{payout.reference}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Provider</dt>
          <dd className="mt-1">{payout.provider}</dd>
        </div>
      </dl>

      {payout.failureMessage ? (
        <p className="mt-8 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm" role="status">
          {payout.failureMessage}
        </p>
      ) : null}

      {payout.items && payout.items.length > 0 ? (
        <div className="mt-12">
          <h2 className="text-base font-medium">Included earnings</h2>
          <ul className="mt-4 divide-y divide-border">
            {payout.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  {item.product.title}
                  <span className="ml-2 text-muted-foreground">
                    Order {item.orderId.slice(0, 8)}…
                  </span>
                </span>
                <span>{formatPrice(item.amount.cents, payout.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Link
        href="/dashboard/earnings"
        className={cn(buttonVariants({ variant: "outline" }), "mt-10 rounded-xl")}
      >
        Back to earnings
      </Link>
    </StudioPage>
  );
}
