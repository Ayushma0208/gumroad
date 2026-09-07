"use client";

import Link from "next/link";
import { useState } from "react";
import { AnalyticsRangeControl } from "@/components/studio/analytics-range-control";
import { ChartTooltip } from "@/components/studio/chart-tooltip";
import { MetricStat } from "@/components/studio/metric-stat";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { StudioQueryError } from "@/components/studio/query-error";
import { OverviewSkeleton } from "@/components/studio/skeletons";
import { useAdminOverview } from "@/hooks/use-admin";
import { formatCompactNumber, formatPrice, formatRelativeDate } from "@/lib/format";
import type { AnalyticsRangeParams } from "@/types/analytics";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AdminOverviewExperience() {
  const [range, setRange] = useState<AnalyticsRangeParams>({ range: "30d" });
  const query = useAdminOverview(range);

  if (query.isPending) {
    return (
      <AdminPage>
        <OverviewSkeleton />
      </AdminPage>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AdminPage>
        <StudioQueryError onRetry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const data = query.data;
  const chart = data.series.map((point) => ({
    ...point,
    revenue: point.revenueCents,
  }));

  return (
    <AdminPage>
      <AdminPageHeader
        title="Operations"
        description="Platform health from paid orders and live moderation queues — no estimated metrics."
        actions={<AnalyticsRangeControl value={range} onChange={setRange} />}
      />

      <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStat
          label="Gross revenue"
          value={formatPrice(data.metrics.grossRevenueCents, data.currency)}
          change={data.metrics.revenueChange}
        />
        <MetricStat
          label="Orders"
          value={formatCompactNumber(data.metrics.totalOrders)}
          change={data.metrics.ordersChange}
        />
        <MetricStat
          label="Users"
          value={formatCompactNumber(data.metrics.totalUsers)}
          change={data.metrics.usersChange}
        />
        <MetricStat
          label="Creators"
          value={formatCompactNumber(data.metrics.totalCreators)}
          change={null}
          period="all time"
        />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <HealthCard
          label="Published products"
          value={String(data.metrics.publishedProducts)}
          href="/admin/products?status=PUBLISHED"
        />
        <HealthCard
          label="Open reports"
          value={String(data.moderationQueue.openReports)}
          href="/admin/reports?status=OPEN"
        />
        <HealthCard
          label="Hidden reviews"
          value={String(data.moderationQueue.hiddenReviews)}
          href="/admin/reviews"
        />
        <HealthCard
          label="Failed payments"
          value={String(data.metrics.failedPayments)}
          href="/admin/orders?status=FAILED"
        />
      </div>

      <section className="mt-12">
        <h2 className="text-base font-medium">Revenue</h2>
        <p className="text-sm text-muted-foreground">
          Sum of paid order totals (buyer GMV after discounts)
        </p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="admin-revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                width={56}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(value: number) =>
                  formatPrice(value, data.currency).replace(/\.00$/, "")
                }
              />
              <Tooltip content={<ChartTooltip currency />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--brand)"
                strokeWidth={2}
                fill="url(#admin-revenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-base font-medium">Moderation queue</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link href="/admin/reports" className="hover:underline">
                {data.moderationQueue.openReports} open reports
              </Link>
            </li>
            <li>
              <Link href="/admin/reviews" className="hover:underline">
                {data.moderationQueue.hiddenReviews} hidden reviews
              </Link>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-medium">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No admin activity yet for this environment.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium">
                    {item.admin.name} · {item.action.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.targetType} {item.targetId.slice(0, 8)} ·{" "}
                    {formatRelativeDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminPage>
  );
}

function HealthCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-xl bg-muted/40 px-4 py-4 transition-colors hover:bg-muted/70">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl tracking-tight">{value}</p>
    </Link>
  );
}
