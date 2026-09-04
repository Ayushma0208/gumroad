"use client";

import { cn } from "@/lib/utils";
import { statusCopy } from "@/lib/studio/copy";
import { paymentStatusCopy } from "@/lib/studio/copy";
import type { PaymentStatus, StudioProductStatus } from "@/types/studio";

export function ProductStatusBadge({ status }: { status: StudioProductStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        status === "published" && "bg-chart-4/15 text-chart-4",
        status === "draft" && "bg-muted text-muted-foreground",
        status === "archived" && "bg-secondary text-muted-foreground",
      )}
    >
      {statusCopy[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        status === "paid" && "bg-chart-4/15 text-chart-4",
        status === "refunded" && "bg-muted text-muted-foreground",
        status === "failed" && "bg-destructive/10 text-destructive",
      )}
    >
      {paymentStatusCopy[status]}
    </span>
  );
}
