"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { formatChangePercent } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

export function MetricStat({
  label,
  value,
  change,
  period = "vs previous period",
}: {
  label: string;
  value: string;
  change: number | null;
  period?: string;
}) {
  const isNew = change === null;
  const up = (change ?? 0) >= 0;
  const pct = formatChangePercent(change);

  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-[2rem] leading-none tracking-tight sm:text-[2.15rem]">
        {value}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            isNew
              ? "text-foreground"
              : up
                ? "text-chart-4"
                : "text-destructive",
          )}
        >
          {!isNew &&
            (up ? (
              <TrendingUp className="size-3.5" aria-hidden />
            ) : (
              <TrendingDown className="size-3.5" aria-hidden />
            ))}
          <span aria-label={isNew ? "New versus previous period" : `${pct} versus previous period`}>
            {pct}
          </span>
        </span>
        <span>{period}</span>
      </p>
    </div>
  );
}
