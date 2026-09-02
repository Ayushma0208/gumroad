"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Revenue", value: "$0" },
  { label: "Orders", value: "0" },
  { label: "Products", value: "0" },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <Container className="py-12 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
        Seller dashboard
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Welcome, {user?.name.split(" ")[0]}.
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        This is your store workspace. Publish a product when you are ready —
        the multi-step creator flow is the next build.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-border p-8 sm:p-12">
        <h2 className="font-display text-2xl tracking-tight">No products yet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Upload a digital file, set a price, and publish. Customers will find
          it on Discover and on your store page.
        </p>
        <Link
          href="/dashboard/products/new"
          className={cn(buttonVariants({ size: "xl" }), "mt-6 rounded-xl")}
        >
          Create a product
        </Link>
      </div>
    </Container>
  );
}
