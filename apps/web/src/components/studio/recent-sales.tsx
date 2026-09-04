"use client";

import { formatDate, formatPrice } from "@/lib/format";
import { PaymentStatusBadge } from "@/components/studio/status-badge";
import type { StudioSale } from "@/types/studio";

export function RecentSales({ sales }: { sales: StudioSale[] }) {
  if (sales.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        Sales will appear here after the first paid order.
      </p>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Product</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sale.customerAvatarUrl}
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                    <span className="font-medium">{sale.customerName}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-muted-foreground">{sale.productTitle}</td>
                <td className="py-3 pr-3 text-muted-foreground">
                  {formatDate(sale.purchasedAt)}
                </td>
                <td className="py-3 pr-3">
                  <PaymentStatusBadge status={sale.status} />
                </td>
                <td className="py-3 text-right tabular-nums">
                  {formatPrice(sale.amountCents, sale.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {sales.map((sale) => (
          <li
            key={sale.id}
            className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3"
          >
            <div className="flex min-w-0 items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sale.customerAvatarUrl}
                alt=""
                className="size-9 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{sale.customerName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {sale.productTitle}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(sale.purchasedAt)}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm tabular-nums">
                {formatPrice(sale.amountCents, sale.currency)}
              </p>
              <div className="mt-1 flex justify-end">
                <PaymentStatusBadge status={sale.status} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
