"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DateRangeTabs } from "@/components/studio/date-range-tabs";
import { MetricStat } from "@/components/studio/metric-stat";
import { OverviewSkeleton } from "@/components/studio/skeletons";
import { StudioQueryError } from "@/components/studio/query-error";
import { RecentSales } from "@/components/studio/recent-sales";
import { RevenueChart } from "@/components/studio/revenue-chart";
import { StudioPage } from "@/components/studio/studio-page";
import { TopProducts } from "@/components/studio/top-products";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useStudioOverview } from "@/hooks/use-studio";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { greetingForHour, rangeHint } from "@/lib/studio/copy";
import { cn } from "@/lib/utils";
import type { DateRangeKey } from "@/types/studio";

export function OverviewExperience() {
  const { user } = useAuth();
  const query = useStudioOverview(user?.id);
  const [range, setRange] = useState<DateRangeKey>("daily");
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
  const empty = data.metrics.salesCount === 0 && data.metrics.productCount === 0;
  const series = data.series[range];

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
                : "Here’s how the store is doing. Revenue is rolling in from the last few weeks of sales."}
            </p>
          </div>
          <Link
            href="/dashboard/products/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
          >
            New product
            <ArrowRight />
          </Link>
        </div>
      </FadeInOnLoad>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStat
          label="Total revenue"
          value={formatPrice(data.metrics.revenueCents)}
          change={data.metrics.revenueChange}
        />
        <MetricStat
          label="Total sales"
          value={formatCompactNumber(data.metrics.salesCount)}
          change={data.metrics.salesChange}
        />
        <MetricStat
          label="Products"
          value={String(data.metrics.productCount)}
          change={data.metrics.productChange}
        />
        <MetricStat
          label="Customers"
          value={formatCompactNumber(data.metrics.customerCount)}
          change={data.metrics.customerChange}
        />
      </div>

      <section className="mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-medium">Revenue</h2>
            <p className="text-sm text-muted-foreground">{rangeHint[range]}</p>
          </div>
          <DateRangeTabs value={range} onChange={setRange} />
        </div>
        <div className="mt-4">
          <RevenueChart data={series} />
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
          <RecentSales sales={data.recentSales} />
        </section>
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-medium">Top products</h2>
            <Link
              href="/dashboard/products"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Catalog
            </Link>
          </div>
          <TopProducts products={data.topProducts} />
        </section>
      </div>
    </StudioPage>
  );
}
