"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/motion/fade-in";
import { CreatorAbout } from "@/components/creator/creator-about";
import { CreatorEmptyState } from "@/components/creator/creator-empty-state";
import { CreatorHero } from "@/components/creator/creator-hero";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import {
  useCreatorProducts,
  useOtherCreators,
} from "@/hooks/use-creator";
import { creatorPath } from "@/lib/paths";
import type { CreatorSort } from "@/lib/api/creators";
import type { CreatorStorePayload, Product } from "@/types/catalog";

const SORTS: { value: CreatorSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function CreatorStoreExperience({
  slug,
  initial,
}: {
  slug: string;
  initial: CreatorStorePayload;
}) {
  const [sort, setSort] = useState<CreatorSort>("newest");
  const [page, setPage] = useState(1);
  const featuredQuery = useCreatorProducts(slug, {
    featured: true,
    limit: 6,
    sort: "newest",
  });
  const productsQuery = useCreatorProducts(slug, { sort, page, limit: 12 });
  const othersQuery = useOtherCreators(slug, true);

  const featured = featuredQuery.data?.items ?? [];
  const pagination = productsQuery.data?.pagination;
  const [loaded, setLoaded] = useState<Product[]>([]);

  const items = useMemo(() => {
    const products = productsQuery.data?.items ?? [];
    if (page === 1) return products;
    const ids = new Set(loaded.map((item) => item.id));
    return [...loaded, ...products.filter((item) => !ids.has(item.id))];
  }, [loaded, page, productsQuery.data?.items]);

  const productCount = initial.stats.productCount;
  const others = (othersQuery.data?.items ?? []).filter(
    (item) => item.stats.productCount > 0 && item.creator.slug !== slug,
  );

  return (
    <div>
      <CreatorHero
        creator={initial.creator}
        productCount={productCount}
        averageRating={initial.stats.averageRating}
        reviewCount={initial.stats.reviewCount}
      />

      {productCount === 0 ? (
        <Container className="pb-24">
          <CreatorEmptyState />
        </Container>
      ) : (
        <>
          {featured.length > 0 ? (
            <Container as="section" className="pb-6 sm:pb-10">
              <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
                Featured
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">
                Featured products
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((product, index) => (
                  <FadeIn key={product.id} delay={index * 0.04}>
                    <ProductCard product={product} />
                  </FadeIn>
                ))}
              </div>
            </Container>
          ) : null}

          <Container as="section" className="py-12 sm:py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
                  Catalog
                </p>
                <h2 className="mt-2 font-display text-3xl tracking-tight">
                  All products
                </h2>
              </div>
              <label className="text-sm text-muted-foreground">
                <span className="sr-only">Sort products</span>
                <select
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as CreatorSort);
                    setPage(1);
                    setLoaded([]);
                  }}
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {productsQuery.isPending && page === 1 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : productsQuery.isError ? (
              <p className="mt-8 text-sm text-destructive" role="alert">
                Couldn’t load products. Refresh and try again.
              </p>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product, index) => (
                  <FadeIn key={product.id} delay={Math.min(index, 8) * 0.03}>
                    <ProductCard product={product} />
                  </FadeIn>
                ))}
              </div>
            )}

            {pagination?.hasNextPage ? (
              <div className="mt-10 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  disabled={productsQuery.isFetching}
                  onClick={() => {
                    setLoaded(items);
                    setPage((current) => current + 1);
                  }}
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </Container>
        </>
      )}

      <CreatorAbout
        description={initial.creator.description}
        bio={initial.creator.bio}
      />

      {others.length >= 2 ? (
        <Container as="section" className="border-t border-border py-16 sm:py-20">
          <p className="text-xs font-medium tracking-[0.16em] text-brand uppercase">
            Discover
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">
            Explore other creators
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.slice(0, 4).map((item) => (
              <li key={item.creator.id}>
                <Link
                  href={creatorPath(item.creator.slug)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <CreatorAvatar
                    src={item.creator.avatar}
                    name={item.creator.storeName}
                    size="md"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {item.creator.storeName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.stats.productCount}{" "}
                      {item.stats.productCount === 1 ? "product" : "products"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </div>
  );
}
