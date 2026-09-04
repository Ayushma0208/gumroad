"use client";

import { useState } from "react";
import { DateRangeTabs } from "@/components/studio/date-range-tabs";
import { ChartTooltip } from "@/components/studio/chart-tooltip";
import { RevenueChart } from "@/components/studio/revenue-chart";
import { StudioQueryError } from "@/components/studio/query-error";
import { OverviewSkeleton } from "@/components/studio/skeletons";
import { StudioPage } from "@/components/studio/studio-page";
import { useAuth } from "@/hooks/use-auth";
import { useStudioAnalytics } from "@/hooks/use-studio";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { rangeHint } from "@/lib/studio/copy";
import type { DateRangeKey } from "@/types/studio";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AnalyticsExperience() {
  const { user } = useAuth();
  const query = useStudioAnalytics(user?.id);
  const [range, setRange] = useState<DateRangeKey>("weekly");

  if (query.isPending) {
    return (
      <StudioPage>
        <OverviewSkeleton />
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

  const data = query.data;
  const series = data.series[range].map((point) => ({
    ...point,
    revenue: point.revenueCents,
  }));
  const conversionPct = `${(data.conversionRate * 100).toFixed(1)}%`;

  return (
    <StudioPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {rangeHint[range]} · conversion {conversionPct}
          </p>
        </div>
        <DateRangeTabs value={range} onChange={setRange} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <FunnelStat label="Views" value={formatCompactNumber(data.funnel.views)} />
        <FunnelStat
          label="Checkouts"
          value={formatCompactNumber(data.funnel.checkouts)}
        />
        <FunnelStat
          label="Purchases"
          value={formatCompactNumber(data.funnel.purchases)}
        />
      </div>

      <section className="mt-12">
        <h2 className="text-base font-medium">Revenue</h2>
        <p className="text-sm text-muted-foreground">What actually landed.</p>
        <div className="mt-4">
          <RevenueChart data={data.series[range]} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-base font-medium">Sales volume</h2>
        <p className="text-sm text-muted-foreground">Orders over the same range.</p>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="sales" name="Sales" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-base font-medium">Product performance</h2>
          <p className="text-sm text-muted-foreground">Revenue by listing.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.productPerformance.map((item) => ({
                  ...item,
                  revenue: item.revenueCents,
                  name: item.title.split(" ").slice(0, 2).join(" "),
                }))}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 6" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(value: number) => formatPrice(value).replace(/\.00$/, "")}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip content={<ChartTooltip currency />} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--brand)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h2 className="text-base font-medium">Customer growth</h2>
          <p className="text-sm text-muted-foreground">New buyers in each bucket.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="customers"
                  name="Customers"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </StudioPage>
  );
}

function FunnelStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl tracking-tight">{value}</p>
    </div>
  );
}
