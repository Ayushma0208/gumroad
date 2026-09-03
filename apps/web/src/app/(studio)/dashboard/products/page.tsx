import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
};

export default function DashboardProductsPage() {
  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Drafts and live listings will live here. Nothing is published yet."
        actions={
          <Link
            href="/dashboard/products/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}
          >
            New product
          </Link>
        }
      />
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card/40">
        <EmptyState
          full={false}
          icon={Package}
          title="Nothing published"
          description="When you add a product, it will live here — draft or live — with price, files, and status in one place."
          actionHref="/dashboard/products/new"
          actionLabel="Create a product"
        />
      </div>
    </Container>
  );
}
