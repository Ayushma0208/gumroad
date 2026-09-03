import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Sales",
};

export default function SalesPage() {
  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Orders"
        title="Sales"
        description="Every paid order will appear here with the product, buyer, and payout status."
      />
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card/40">
        <EmptyState
          full={false}
          icon={Receipt}
          title="No orders yet"
          description="Orders will appear here after checkout and Razorpay are connected. Until then, this table stays empty on purpose."
          actionHref="/dashboard/products/new"
          actionLabel="Create a product"
        />
      </div>
    </Container>
  );
}
