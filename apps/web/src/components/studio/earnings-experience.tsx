"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Wallet } from "lucide-react";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { StudioPage } from "@/components/studio/studio-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreatorEarnings,
  useCreatorEarningsSummary,
  usePayoutAccount,
  useRequestPayout,
} from "@/hooks/use-earnings";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "AVAILABLE":
      return "Available";
    case "RESERVED":
      return "Reserved";
    case "PAID":
      return "Paid out";
    case "REVERSED":
      return "Reversed";
    default:
      return status;
  }
}

export function EarningsExperience() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amountMajor, setAmountMajor] = useState("");
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const summaryQuery = useCreatorEarningsSummary();
  const accountQuery = usePayoutAccount();
  const listQuery = useCreatorEarnings({
    page,
    pageSize: 20,
    status: status === "all" ? undefined : status,
  });
  const requestMutation = useRequestPayout();

  const currency = summaryQuery.data?.currency ?? "USD";
  const availableCents = summaryQuery.data?.availableBalance.cents ?? 0;
  const minCents = summaryQuery.data?.minPayoutCents ?? 0;

  const amountCents = useMemo(() => {
    const parsed = Number.parseFloat(amountMajor);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.round(parsed * 100);
  }, [amountMajor]);

  async function submitPayout() {
    setConfirmMessage(null);
    if (amountCents == null) return;
    try {
      const payout = await requestMutation.mutateAsync({
        amountCents,
        idempotencyKey: `ui-${crypto.randomUUID()}`,
      });
      setWithdrawOpen(false);
      setAmountMajor("");
      setConfirmMessage(
        `Payout requested · ${formatPrice(payout.amount.cents, payout.currency)} · Ref ${payout.reference} · Status: ${payout.status === "REQUESTED" ? "Requested" : payout.status}`,
      );
    } catch {
      // surfaced via mutation.error
    }
  }

  if (summaryQuery.isPending || listQuery.isPending) {
    return (
      <StudioPage>
        <TableSkeleton rows={6} />
      </StudioPage>
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void summaryQuery.refetch()} />
      </StudioPage>
    );
  }

  if (listQuery.isError || !listQuery.data) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void listQuery.refetch()} />
      </StudioPage>
    );
  }

  const summary = summaryQuery.data;
  const empty = summary.creatorEarnings.cents === 0 && listQuery.data.meta.total === 0;
  const canWithdraw =
    summary.availableBalance.cents >= summary.minPayoutCents &&
    accountQuery.data?.canRequestPayout === true;

  return (
    <StudioPage>
      <FadeInOnLoad>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
              Earnings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ledger balances from verified paid orders. Analytics revenue is gross
              after discounts; available balance is creator net after platform fees
              and holding.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/payouts"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
            >
              Payout history
            </Link>
            <button
              type="button"
              className={cn(buttonVariants(), "rounded-xl")}
              disabled={!canWithdraw}
              onClick={() => setWithdrawOpen(true)}
            >
              Withdraw
              <Wallet className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </FadeInOnLoad>

      {confirmMessage ? (
        <p
          className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm"
          role="status"
        >
          {confirmMessage}
        </p>
      ) : null}

      <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <BalanceStat
          label="Total earnings"
          value={formatPrice(summary.creatorEarnings.cents, currency)}
          hint="Creator net after fees"
        />
        <BalanceStat
          label="Available"
          value={formatPrice(summary.availableBalance.cents, currency)}
          hint="Eligible to withdraw"
        />
        <BalanceStat
          label="Pending"
          value={formatPrice(summary.pendingBalance.cents, currency)}
          hint={`Holding ~${summary.holdingPeriodHours}h`}
        />
        <BalanceStat
          label="Paid out"
          value={formatPrice(summary.paidOut.cents, currency)}
          hint="Successfully settled"
        />
      </div>

      <div className="mt-6 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
        <p>
          Gross sales{" "}
          <span className="text-foreground">
            {formatPrice(summary.grossSales.cents, currency)}
          </span>
        </p>
        <p>
          Discounts{" "}
          <span className="text-foreground">
            {formatPrice(summary.discounts.cents, currency)}
          </span>
        </p>
        <p>
          Platform fees{" "}
          <span className="text-foreground">
            {formatPrice(summary.platformFees.cents, currency)}
          </span>
          {summary.platformFeeBps === 0 ? " (rate not set)" : ` (${summary.platformFeeBps / 100}%)`}
        </p>
      </div>

      {!accountQuery.data?.canRequestPayout ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Payout account{" "}
          {accountQuery.data?.status === "NOT_CONFIGURED"
            ? "not configured"
            : accountQuery.data?.status === "PENDING_REVIEW"
              ? "pending review"
              : accountQuery.data?.status === "DISABLED"
                ? "disabled"
                : "unavailable"}
          .{" "}
          <Link href="/dashboard/settings/payouts" className="text-foreground underline-offset-4 hover:underline">
            Manage payout settings
          </Link>
        </p>
      ) : null}

      {withdrawOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-lg">
            <h2 id="withdraw-title" className="font-display text-2xl tracking-tight">
              Request payout
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Available {formatPrice(availableCents, currency)}. Minimum{" "}
              {formatPrice(minCents, currency)}. Settlement is manual review — this
              does not mean funds have been sent.
            </p>
            <label className="mt-5 block text-sm font-medium" htmlFor="payout-amount">
              Amount ({currency})
            </label>
            <Input
              id="payout-amount"
              inputMode="decimal"
              value={amountMajor}
              onChange={(event) => setAmountMajor(event.target.value)}
              className="mt-2"
              placeholder={(availableCents / 100).toFixed(2)}
              aria-describedby="payout-amount-hint"
            />
            <p id="payout-amount-hint" className="mt-2 text-xs text-muted-foreground">
              You will receive:{" "}
              {amountCents != null
                ? formatPrice(amountCents, currency)
                : "—"}{" "}
              (whole earnings only)
            </p>
            {requestMutation.isError ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {requestMutation.error instanceof ApiError
                  ? requestMutation.error.message
                  : "Could not request payout."}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
                onClick={() => setWithdrawOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cn(buttonVariants(), "rounded-xl")}
                disabled={
                  amountCents == null ||
                  requestMutation.isPending ||
                  amountCents > availableCents
                }
                onClick={() => void submitPayout()}
              >
                {requestMutation.isPending ? "Requesting…" : "Request payout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium">Transactions</h2>
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
            <option value="PENDING">Pending</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="PAID">Paid</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </label>
      </div>

      {empty ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <h3 className="font-display text-2xl tracking-tight">No earnings yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Publish your first product and start building your creator business.
            Earnings appear after a Razorpay payment is verified and the order is paid.
          </p>
          <Link
            href="/dashboard/products"
            className={cn(buttonVariants({ size: "lg" }), "mt-6 rounded-xl")}
          >
            Manage products
            <ArrowRight />
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">Product</th>
                <th className="py-3 pr-4 font-medium">Date</th>
                <th className="py-3 pr-4 font-medium">Gross</th>
                <th className="py-3 pr-4 font-medium">Fee</th>
                <th className="py-3 pr-4 font-medium">You earned</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.data.items.map((row) => (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{row.product.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Order {row.orderId.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="py-3 pr-4">
                    {formatPrice(row.gross.cents, row.currency)}
                  </td>
                  <td className="py-3 pr-4">
                    {formatPrice(row.platformFee.cents, row.currency)}
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    {formatPrice(row.creatorEarning.cents, row.currency)}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          row.status === "AVAILABLE" && "bg-emerald-600",
                          row.status === "PENDING" && "bg-amber-500",
                          row.status === "PAID" && "bg-sky-600",
                          row.status === "RESERVED" && "bg-violet-600",
                          row.status === "REVERSED" && "bg-rose-600",
                        )}
                        aria-hidden
                      />
                      {statusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listQuery.data.meta.totalPages > 1 ? (
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
                Page {listQuery.data.meta.page} of {listQuery.data.meta.totalPages}
              </span>
              <button
                type="button"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                disabled={page >= listQuery.data.meta.totalPages}
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

function BalanceStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-[2rem] leading-none tracking-tight sm:text-[2.15rem]">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
