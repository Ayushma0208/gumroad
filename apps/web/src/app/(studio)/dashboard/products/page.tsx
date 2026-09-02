import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
};

export default function DashboardProductsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
            Catalog
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight">Products</h1>
        </div>
        <Link
          href="/dashboard/products/new"
          className={cn(buttonVariants({ size: "lg" }), "w-fit rounded-xl")}
        >
          New product
        </Link>
      </div>
      <EmptyState
        title="Nothing published."
        description="When you add a product, it will live here — draft or live."
        actionHref="/dashboard/products/new"
        actionLabel="Create a product"
      />
    </Container>
  );
}
