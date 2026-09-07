"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnalyticsRangeControl } from "@/components/studio/analytics-range-control";
import { MetricStat } from "@/components/studio/metric-stat";
import { OverviewSkeleton } from "@/components/studio/skeletons";
import { StudioQueryError } from "@/components/studio/query-error";
import { RecentSales } from "@/components/studio/recent-sales";
import { StudioPage } from "@/components/studio/studio-page";
import { TopProducts } from "@/components/studio/top-products";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCreatorAnalyticsOverview } from "@/hooks/use-analytics";
import { useCreatorEarningsSummary } from "@/hooks/use-earnings";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { greetingForHour } from "@/lib/studio/copy";
import { cn } from "@/lib/utils";
import type { AnalyticsRangeParams } from "@/types/analytics";
import type { StudioProduct, StudioSale } from "@/types/studio";
import dynamic from "next/dynamic";

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

export function OverviewExperience() {
  const { user } = useAuth();
  const [range, setRange] = useState<AnalyticsRangeParams>({ range: "30d" });
  const query = useCreatorAnalyticsOverview(range);
  const earningsQuery = useCreatorEarningsSummary();
  const greeting = useMemo(
    () => greetingForHour(new Date().getHours()),
    [],
  );

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
  const firstName = user?.name.split(" ")[0] ?? "there";
  const empty = data.metrics.orders === 0 && data.metrics.productCount === 0;
  const noSales = data.metrics.orders === 0;

  const recentSales: StudioSale[] = data.recentSales.map((sale) => ({
    id: sale.orderId,
    productId: sale.productId,
    productTitle: sale.productTitle,
    productCoverUrl:
      sale.productCoverUrl ??
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=200&q=80",
    customerId: sale.customerId,
    customerName: sale.customerName,
    customerEmail: sale.customerEmail,
    customerAvatarUrl:
      sale.customerAvatarUrl ??
      `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(sale.customerName)}`,
    amountCents: sale.amountCents,
    currency: sale.currency,
    status:
      sale.status === "refunded"
        ? "refunded"
        : sale.status === "paid"
          ? "paid"
          : "failed",
    purchasedAt: sale.purchasedAt,
  }));

  const topProducts = data.topProducts.map(
    (product): StudioProduct => ({
      id: product.productId,
      slug: product.slug,
      title: product.title,
      shortDescription: "",
      description: "",
      kind: "download",
      categorySlug: "",
      categoryLabel: "",
      coverUrl:
        product.coverUrl ??
        "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=400&q=80",
      gallery: [],
      files: [],
      status: "published",
      pricingModel: "fixed",
      priceCents: product.averagePriceCents,
      currency: product.currency,
      salesCount: product.unitsSold,
      revenueCents: product.revenueCents,
      views: 0,
      createdAt: data.range.from,
      updatedAt: data.range.to,
    }),
  );

  const chartSeries = data.series.map((point) => ({
    label: point.label,
    date: point.date,
    revenueCents: point.revenueCents,
    sales: point.orders,
    customers: point.newCustomers,
  }));

  return (
    <StudioPage>
      <FadeInOnLoad>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {empty
                ? "Your store is ready. Publish a product when you want buyers to find you on Discover."
                : noSales
                  ? "Your analytics are waiting for their first sale. Once customers purchase, revenue and insights show up here."
                  : "Here’s how the store performed for the selected period — from paid orders only."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AnalyticsRangeControl value={range} onChange={setRange} />
            <Link
              href="/dashboard/products/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
            >
              New product
              <ArrowRight />
            </Link>
          </div>
        </div>
      </FadeInOnLoad>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
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

      {earningsQuery.isSuccess && earningsQuery.data ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Available to withdraw</p>
            <p className="mt-2 font-display text-2xl tracking-tight">
              {formatPrice(
                earningsQuery.data.availableBalance.cents,
                earningsQuery.data.currency,
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending earnings</p>
            <p className="mt-2 font-display text-2xl tracking-tight">
              {formatPrice(
                earningsQuery.data.pendingBalance.cents,
                earningsQuery.data.currency,
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paid out</p>
            <p className="mt-2 font-display text-2xl tracking-tight">
              {formatPrice(
                earningsQuery.data.paidOut.cents,
                earningsQuery.data.currency,
              )}
            </p>
          </div>
          <div className="flex items-end">
            <Link
              href="/dashboard/earnings"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Open earnings
            </Link>
          </div>
        </div>
      ) : null}

      <section className="mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-medium">Revenue</h2>
            <p className="text-sm text-muted-foreground">
              Paid order line revenue over time
            </p>
          </div>
          <Link
            href="/dashboard/analytics"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Full analytics
          </Link>
        </div>
        <div className="mt-4">
          {noSales ? (
            <EmptyAnalytics
              href="/dashboard/products"
              label="View products"
            />
          ) : (
            <RevenueChart data={chartSeries} />
          )}
        </div>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-medium">Recent sales</h2>
            <Link
              href="/dashboard/sales"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <RecentSales sales={recentSales} />
        </section>
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-medium">Top products</h2>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Performance
            </Link>
          </div>
          <TopProducts products={topProducts} />
        </section>
      </div>
    </StudioPage>
  );
}

function EmptyAnalytics({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-muted/40 px-6 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">
        Your analytics are waiting for their first sale. Once customers purchase
        your products, you’ll see revenue here.
      </p>
      <Link
        href={href}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 rounded-lg")}
      >
        {label}
      </Link>
    </div>
  );
}
