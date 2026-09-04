"use client";

import { formatPrice } from "@/lib/format";
import { ChartTooltip } from "@/components/studio/chart-tooltip";
import type { RevenuePoint } from "@/types/studio";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    revenue: point.revenueCents,
  }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="lumen-revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="4 6"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value: number) =>
              formatPrice(value).replace(/\.00$/, "")
            }
          />
          <Tooltip content={<ChartTooltip currency />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--brand)"
            strokeWidth={2}
            fill="url(#lumen-revenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
