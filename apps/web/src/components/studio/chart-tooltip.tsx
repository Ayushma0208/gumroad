"use client";

import { formatPrice } from "@/lib/format";

type TooltipItem = {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
};

export function ChartTooltip({
  active,
  payload,
  label,
  currency = false,
}: {
  active?: boolean;
  payload?: readonly TooltipItem[];
  label?: string | number;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 text-muted-foreground">{label}</p>
      {payload.map((item) => {
        const raw = item.value;
        const value = typeof raw === "number" ? raw : Number(raw ?? 0);
        return (
          <p key={String(item.dataKey ?? item.name)} className="flex gap-3">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium">
              {currency ? formatPrice(value) : value.toLocaleString()}
            </span>
          </p>
        );
      })}
    </div>
  );
}
