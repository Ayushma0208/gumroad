"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { AnalyticsRangeControl } from "@/components/studio/analytics-range-control";
import { ChartTooltip } from "@/components/studio/chart-tooltip";
import { MetricStat } from "@/components/studio/metric-stat";
import { StudioQueryError } from "@/components/studio/query-error";
import { OverviewSkeleton } from "@/components/studio/skeletons";
import { StudioPage } from "@/components/studio/studio-page";
import { buttonVariants } from "@/components/ui/button";
import {
  useCreatorAnalyticsOverview,
  useCreatorCouponAnalytics,
  useCreatorCustomerAnalytics,
  useCreatorProductAnalytics,
} from "@/hooks/use-analytics";
import { formatChangePercent } from "@/lib/analytics/format";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AnalyticsRangeParams } from "@/types/analytics";
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

const RevenueChart = dynamic(
  () =>
    import("@/components/studio/revenue-chart").then((mod) => mod.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-xl bg-muted/60" aria-hidden />
    ),
  },
);

type SalesMetric = "orders" | "unitsSold";

export function AnalyticsExperience() {
  const [range, setRange] = useState<AnalyticsRangeParams>({ range: "30d" });
  const [salesMetric, setSalesMetric] = useState<SalesMetric>("orders");
  const [productSort, setProductSort] = useState<"revenue" | "units" | "orders">(
    "revenue",
  );

  const overview = useCreatorAnalyticsOverview(range);
  const products = useCreatorProductAnalytics({
    ...range,
    sort: productSort,
    limit: 24,
  });
  const customers = useCreatorCustomerAnalytics(range);
  const coupons = useCreatorCouponAnalytics(range);

  if (overview.isPending) {
    return (
      <StudioPage>
        <OverviewSkeleton />
      </StudioPage>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <StudioPage>
        <StudioQueryError onRetry={() => void overview.refetch()} />
      </StudioPage>
    );
  }

  const data = overview.data;
  const noSales = data.metrics.orders === 0;
  const chartSeries = data.series.map((point) => ({
    label: point.label,
    date: point.date,
    revenueCents: point.revenueCents,
    sales: point.orders,
    customers: point.newCustomers,
    orders: point.orders,
    unitsSold: point.unitsSold,
  }));

  return (
    <StudioPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paid-order intelligence for your store. Product views are not tracked yet.
          </p>
        </div>
        <AnalyticsRangeControl value={range} onChange={setRange} />
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStat
          label="Revenue"
          value={formatPrice(data.metrics.revenueCents, data.currency)}
          change={data.metrics.revenueChange}
        />
        <MetricStat
          label="Orders"
          value={formatCompactNumber(data.metrics.orders)}
          change={data.metrics.ordersChange}
        />
        <MetricStat
          label="Customers"
          value={formatCompactNumber(data.metrics.customers)}
          change={data.metrics.customersChange}
        />
        <MetricStat
          label="Average order"
          value={formatPrice(data.metrics.averageOrderValueCents, data.currency)}
          change={data.metrics.averageOrderValueChange}
        />
      </div>

      <section className="mt-12">
        <h2 className="text-base font-medium">Revenue</h2>
        <p className="text-sm text-muted-foreground">
          Gross line revenue by {data.range.bucket}
        </p>
        <div className="mt-4">
          {noSales ? (
            <EmptyBlock />
          ) : (
            <RevenueChart
              data={chartSeries.map((point) => ({
                label: point.label,
                date: point.date,
                revenueCents: point.revenueCents,
                sales: point.sales,
                customers: point.customers,
              }))}
            />
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-medium">Sales</h2>
            <p className="text-sm text-muted-foreground">Paid orders and units</p>
          </div>
          <div
            className="inline-flex rounded-lg bg-muted p-0.5"
            role="tablist"
            aria-label="Sales metric"
          >
            {(
              [
                ["orders", "Orders"],
                ["unitsSold", "Units"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={salesMetric === key}
                onClick={() => setSalesMetric(key)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  salesMetric === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-56">
          {noSales ? (
            <EmptyBlock compact />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Bar
                  dataKey={salesMetric}
                  name={salesMetric === "orders" ? "Orders" : "Units"}
                  fill="var(--chart-2)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">Product performance</h2>
              <p className="text-sm text-muted-foreground">Revenue by listing</p>
            </div>
            <select
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
              value={productSort}
              onChange={(event) =>
                setProductSort(event.target.value as typeof productSort)
              }
              aria-label="Sort products"
            >
              <option value="revenue">Revenue</option>
              <option value="units">Units</option>
              <option value="orders">Orders</option>
            </select>
          </div>
          {products.isPending ? (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          ) : products.isError ? (
            <SectionError onRetry={() => void products.refetch()} />
          ) : (products.data?.items.length ?? 0) === 0 ? (
            <EmptyBlock compact />
          ) : (
            <>
              <div className="mb-6 hidden h-56 md:block">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(products.data?.distribution ?? [])
                      .filter((item) => item.productId !== "_other")
                      .slice(0, 8)
                      .map((item) => ({
                        ...item,
                        revenue: item.revenueCents,
                        name: item.title.split(" ").slice(0, 2).join(" "),
                      }))}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="var(--border)"
                      strokeDasharray="4 6"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickFormatter={(value: number) =>
                        formatPrice(value, data.currency).replace(/\.00$/, "")
                      }
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
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="var(--brand)"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ProductTable
                currency={data.currency}
                items={products.data?.items ?? []}
              />
            </>
          )}
        </section>

        <section className="space-y-10">
          <div>
            <h2 className="text-base font-medium">Customers</h2>
            <p className="text-sm text-muted-foreground">
              First purchase is scoped to your store
            </p>
            {customers.isPending ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
            ) : customers.isError || !customers.data ? (
              <SectionError onRetry={() => void customers.refetch()} />
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <MiniStat
                    label="New"
                    value={formatCompactNumber(customers.data.newCustomers)}
                  />
                  <MiniStat
                    label="Returning"
                    value={formatCompactNumber(customers.data.returningCustomers)}
                  />
                  <MiniStat
                    label="Repeat rate"
                    value={
                      customers.data.repeatPurchaseRate == null
                        ? "—"
                        : formatChangePercent(customers.data.repeatPurchaseRate).replace(
                            "+",
                            "",
                          )
                    }
                  />
                  <MiniStat
                    label="Rev / customer"
                    value={formatPrice(
                      customers.data.averageRevenuePerCustomerCents,
                      data.currency,
                    )}
                  />
                </div>
                <div className="mt-4 h-48">
                  {noSales ? (
                    <EmptyBlock compact />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={customers.data.series}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
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
                          width={36}
                          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="newCustomers"
                          name="New customers"
                          stroke="var(--chart-3)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <h2 className="text-base font-medium">Coupons</h2>
            <p className="text-sm text-muted-foreground">
              Redemptions on paid orders
            </p>
            {coupons.isPending ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
            ) : coupons.isError || !coupons.data ? (
              <SectionError onRetry={() => void coupons.refetch()} />
            ) : coupons.data.items.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No coupon redemptions in this period.{" "}
                <Link href="/dashboard/coupons" className="underline-offset-2 hover:underline">
                  Manage coupons
                </Link>
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {coupons.data.items.map((coupon) => (
                  <li
                    key={coupon.couponId}
                    className="flex items-start justify-between gap-3 border-b border-border/70 pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">{coupon.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {coupon.redemptions} redemption
                        {coupon.redemptions === 1 ? "" : "s"} ·{" "}
                        {formatPrice(coupon.discountCents, data.currency)} discount
                      </p>
                    </div>
                    <p className="text-sm tabular-nums">
                      {formatPrice(coupon.attributedRevenueCents, data.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </StudioPage>
  );
}

function ProductTable({
  currency,
  items,
}: {
  currency: "USD" | "INR";
  items: Array<{
    productId: string;
    title: string;
    unitsSold: number;
    revenueCents: number;
    averagePriceCents: number;
    refundedOrders: number;
  }>;
}) {
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Sales</th>
              <th className="pb-2 font-medium">Revenue</th>
              <th className="pb-2 text-right font-medium">Avg</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-2 font-medium">{item.title}</td>
                <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">
                  {item.unitsSold}
                </td>
                <td className="py-2.5 pr-2 tabular-nums">
                  {formatPrice(item.revenueCents, currency)}
                </td>
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                  {formatPrice(item.averagePriceCents, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={item.productId} className="rounded-xl bg-muted/40 px-3 py-3">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.unitsSold} sold · {formatPrice(item.revenueCents, currency)} · avg{" "}
              {formatPrice(item.averagePriceCents, currency)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl tracking-tight">{value}</p>
    </div>
  );
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-4 rounded-xl bg-muted/40 px-4 py-6 text-center">
      <p className="text-sm font-medium">Unable to load this section</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Something went wrong while loading your data.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 rounded-lg")}
      >
        Try again
      </button>
    </div>
  );
}

function EmptyBlock({ compact }: { compact?: boolean } = {}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl bg-muted/40 px-6 text-center",
        compact ? "h-40" : "h-64",
      )}
    >
      <p className="max-w-sm text-sm text-muted-foreground">
        Your analytics are waiting for their first sale.
      </p>
      <Link
        href="/dashboard/products"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 rounded-lg")}
      >
        View products
      </Link>
    </div>
  );
}
