"use client";

import {
  ArrowRight,
  CircleDollarSign,
  Package,
  Receipt,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Revenue", value: "$0", hint: "All time", icon: CircleDollarSign },
  { label: "Orders", value: "0", hint: "Paid checkouts", icon: Receipt },
  { label: "Products", value: "0", hint: "Live on the shelf", icon: Package },
];

const nextSteps = [
  {
    href: "/dashboard/products/new",
    title: "Publish your first product",
    body: "Add a file, a price, and a short pitch. Buyers will find it on Discover.",
  },
  {
    href: "/dashboard/settings",
    title: "Check your store details",
    body: "Confirm the name, slug, and bio people see on your public page.",
  },
  {
    href: "/discover",
    title: "See how products appear",
    body: "Walk the marketplace as a buyer so your listing feels at home.",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <Container className="py-8 sm:py-12">
      <FadeInOnLoad>
        <PageHeader
          eyebrow="Seller dashboard"
          title={`Welcome back, ${firstName}.`}
          description="Nothing is live yet. Publish a product when you are ready — customers will find it on Discover and on your store."
          actions={
            <Link
              href="/dashboard/products/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
            >
              Create a product
              <ArrowRight />
            </Link>
          }
        />
      </FadeInOnLoad>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <FadeInOnLoad key={stat.label} delay={0.05 * (index + 1)}>
              <Card className="py-5 ring-foreground/8 transition-colors hover:ring-foreground/16">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <p className="mt-2 font-display text-3xl tracking-tight">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </span>
                </CardHeader>
              </Card>
            </FadeInOnLoad>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              What to do next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pb-5">
            {nextSteps.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className="group flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/80"
              >
                <span>
                  <span className="block text-sm font-medium">{step.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {step.body}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <EmptyState
              full={false}
              icon={Receipt}
              title="No sales yet"
              description="Orders will show up here after checkout is connected and someone buys from you."
              className="py-8 sm:py-10"
            />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
