"use client";

import { Library } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { usePurchases } from "@/hooks/use-checkout";
import { catalogProductTypeLabel } from "@/lib/api/checkout";
import { formatDate } from "@/lib/format";
import { productPath } from "@/lib/paths";

export default function LibraryPage() {
  const { user } = useAuth();
  const purchases = usePurchases();
  const firstName = user?.name.split(" ")[0];
  const items = purchases.data ?? [];

  if (purchases.isPending) {
    return (
      <Container className="py-10">
        <PageHeader
          eyebrow="Library"
          title={firstName ? `${firstName}’s library` : "Your library"}
          description="Products you own. File downloads arrive in the next phase."
        />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title={firstName ? `${firstName}’s library` : "Your library"}
        description="Purchased products will live here after a verified payment. Downloads come next."
        actionHref="/discover"
        actionLabel="Discover products"
      />
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        eyebrow="Library"
        title={firstName ? `${firstName}’s library` : "Your library"}
        description="You own these products. Private file delivery is the next release."
      />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {items.map((purchase) => (
          <li key={purchase.id}>
            <Link
              href={productPath(purchase.product.slug)}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={purchase.product.coverImage} alt="" fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{purchase.product.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {purchase.product.creator.storeName} ·{" "}
                  {catalogProductTypeLabel(purchase.product.productType)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Added {formatDate(purchase.createdAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
