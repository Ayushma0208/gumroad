"use client";

import { useState } from "react";
import Link from "next/link";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { StudioPage } from "@/components/studio/studio-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { TableSkeleton } from "@/components/studio/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreatorEarningsSummary,
  usePayoutAccount,
  useUpdatePayoutAccount,
} from "@/hooks/use-earnings";
import type { PayoutAccount } from "@/lib/api/earnings";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";

export function PayoutSettingsExperience() {
  const accountQuery = usePayoutAccount();
  const summaryQuery = useCreatorEarningsSummary();

  if (accountQuery.isPending || summaryQuery.isPending) {
    return (
      <StudioPage>
        <TableSkeleton rows={4} />
      </StudioPage>
    );
  }

  if (accountQuery.isError || !accountQuery.data) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void accountQuery.refetch()} />
      </StudioPage>
    );
  }

  return (
    <StudioPage>
      <FadeInOnLoad>
        <Link
          href="/dashboard/settings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Settings
        </Link>
        <h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">
          Payout settings
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Store only the minimum metadata needed for manual settlement. Never paste
          passwords, CVV, or full sensitive bank credentials.
        </p>
      </FadeInOnLoad>

      <PayoutSettingsForm
        key={accountQuery.data.updatedAt ?? accountQuery.data.status}
        account={accountQuery.data}
        summary={summaryQuery.data}
      />
    </StudioPage>
  );
}

function PayoutSettingsForm({
  account,
  summary,
}: {
  account: PayoutAccount;
  summary: ReturnType<typeof useCreatorEarningsSummary>["data"];
}) {
  const updateMutation = useUpdatePayoutAccount();
  const [holderName, setHolderName] = useState(account.accountHolderName ?? "");
  const [hint, setHint] = useState(account.accountHint ?? "");
  const [saved, setSaved] = useState(false);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setSaved(false);
    try {
      await updateMutation.mutateAsync({
        accountHolderName: holderName,
        accountHint: hint || null,
      });
      setSaved(true);
    } catch {
      // mutation error UI
    }
  }

  return (
    <>
      <section className="mt-10">
        <h2 className="text-base font-medium">Payout account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Status:{" "}
          <span className="text-foreground">
            {account.status === "VERIFIED"
              ? "Connected (verified)"
              : account.status === "PENDING_REVIEW"
                ? "Pending review"
                : account.status === "DISABLED"
                  ? "Disabled"
                  : "Not configured"}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Provider: {account.provider} (manual review — Razorpay Route not configured)
        </p>
      </section>

      {summary ? (
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="mt-1 font-display text-2xl">
              {formatPrice(summary.availableBalance.cents, summary.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="mt-1 font-display text-2xl">
              {formatPrice(summary.pendingBalance.cents, summary.currency)}
            </p>
          </div>
          <p className="sm:col-span-2 text-sm text-muted-foreground">
            Minimum payout: {formatPrice(summary.minPayoutCents, summary.currency)} ·
            Holding period: {summary.holdingPeriodHours} hours (configurable)
          </p>
        </section>
      ) : null}

      <form onSubmit={(event) => void onSave(event)} className="mt-10 max-w-lg space-y-4">
        <div>
          <label htmlFor="holder" className="text-sm font-medium">
            Account holder name
          </label>
          <Input
            id="holder"
            className="mt-2"
            value={holderName}
            onChange={(event) => setHolderName(event.target.value)}
            required
            minLength={2}
            disabled={account.status === "DISABLED"}
          />
        </div>
        <div>
          <label htmlFor="hint" className="text-sm font-medium">
            Account hint (optional, masked)
          </label>
          <Input
            id="hint"
            className="mt-2"
            value={hint}
            onChange={(event) => setHint(event.target.value)}
            placeholder="e.g. ending 4242"
            maxLength={64}
            disabled={account.status === "DISABLED"}
          />
        </div>
        {updateMutation.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {updateMutation.error instanceof ApiError
              ? updateMutation.error.message
              : "Could not save payout account."}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-muted-foreground" role="status">
            Saved. An admin must verify before you can withdraw.
          </p>
        ) : null}
        <button
          type="submit"
          className={cn(buttonVariants(), "rounded-xl")}
          disabled={updateMutation.isPending || account.status === "DISABLED"}
        >
          {updateMutation.isPending ? "Saving…" : "Save payout profile"}
        </button>
      </form>

      <Link
        href="/dashboard/earnings"
        className={cn(buttonVariants({ variant: "outline" }), "mt-8 rounded-xl")}
      >
        Go to earnings
      </Link>
    </>
  );
}
