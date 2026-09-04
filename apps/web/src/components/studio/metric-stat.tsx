"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricStat({
  label,
  value,
  change,
  period = "vs last period",
}: {
  label: string;
  value: string;
  change: number;
  period?: string;
}) {
  const up = change >= 0;
  const pct = `${up ? "+" : ""}${Math.round(change * 100)}%`;

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
            up ? "text-chart-4" : "text-destructive",
          )}
        >
          {up ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          {pct}
        </span>
        <span>{period}</span>
      </p>
    </div>
  );
}
