"use client";

import { Library } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLibrary } from "@/hooks/use-library";
import { catalogProductTypeLabel } from "@/lib/api/checkout";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { formatDate } from "@/lib/format";
import { productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

export default function LibraryPage() {
  const { user } = useAuth();
  const library = useLibrary();
  const firstName = user?.name.split(" ")[0];
  const items = library.data?.items ?? [];

  if (library.isPending) {
    return (
      <Container className="py-10">
        <PageHeader
          eyebrow="Library"
          title={firstName ? `${firstName}’s library` : "Your library"}
          description="Everything you’ve paid for, ready to open."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title="Your library is empty."
        description="When you purchase a digital product, it will appear here."
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
        description="A private shelf of everything you own. Downloads are signed for a short window."
      />
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={`${item.orderId}-${item.product.id}`}>
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <Link
                href={`/library/${item.product.id}`}
                className="relative aspect-[16/10] bg-muted"
              >
                {item.product.coverImage ? (
                  <Image
                    src={cloudinaryThumb(item.product.coverImage, 900)}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : null}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                  {catalogProductTypeLabel(item.product.productType)}
                </p>
                <h2 className="mt-2 font-display text-2xl tracking-tight">
                  <Link href={`/library/${item.product.id}`}>{item.product.title}</Link>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.product.creator.storeName}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Purchased {formatDate(item.purchasedAt)}
                  {item.updatedAt ? ` · Updated ${formatDate(item.updatedAt)}` : ""}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link
                    href={`/library/${item.product.id}`}
                    className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
                  >
                    Download
                  </Link>
                  <Link
                    href={productPath(item.product.slug)}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-lg")}
                  >
                    View product
                  </Link>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </Container>
  );
}
