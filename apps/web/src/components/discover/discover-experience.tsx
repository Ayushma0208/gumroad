"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DiscoverActiveFilters, DiscoverFilters } from "@/components/discover/discover-filters";
import { DiscoverCategories } from "@/components/discover/discover-categories";
import { DiscoverEmpty } from "@/components/discover/discover-empty";
import { DiscoverError } from "@/components/discover/discover-error";
import { DiscoverFeatured } from "@/components/discover/discover-featured";
import { DiscoverPagination } from "@/components/discover/discover-pagination";
import { DiscoverSearch } from "@/components/discover/discover-search";
import { Container } from "@/components/layout/container";
import { FadeInOnLoad } from "@/components/motion/fade-in";
import { ProductCard, ProductCardSkeleton } from "@/components/product/product-card";
import {
  useCatalogCategories,
  useCatalogProducts,
  useFeaturedCatalog,
} from "@/hooks/use-catalog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getCategoryBySlugFromList, getSpotlightFromProducts } from "@/lib/api/products";
import {
  catalogFiltersToQueryString,
  DEFAULT_CATALOG_FILTERS,
  getDiscoverHeading,
  hasActiveBrowseFilters,
  parseCatalogFilters,
  type CatalogFilters,
} from "@/lib/catalog/query";

export function DiscoverExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const filters = useMemo(
    () => parseCatalogFilters(new URLSearchParams(searchKey)),
    [searchKey],
  );

  const [draftQuery, setDraftQuery] = useState(filters.q);
  const debouncedQuery = useDebouncedValue(draftQuery, 300);
  const lastPushedQuery = useRef(filters.q);

  const replaceFilters = useCallback(
    (next: CatalogFilters) => {
      const query = catalogFiltersToQueryString(next);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const patchFilters = useCallback(
    (patch: Partial<CatalogFilters>) => {
      replaceFilters({
        ...filters,
        ...patch,
        page: patch.page ?? 1,
      });
    },
    [filters, replaceFilters],
  );

  useEffect(() => {
    if (debouncedQuery === filters.q) return;
    lastPushedQuery.current = debouncedQuery;
    replaceFilters({ ...filters, q: debouncedQuery, page: 1 });
  }, [debouncedQuery, filters, replaceFilters]);

  useEffect(() => {
    if (filters.q === lastPushedQuery.current) return;
    lastPushedQuery.current = filters.q;
    setDraftQuery(filters.q);
  }, [filters.q]);

  const queryFilters = { ...filters, q: debouncedQuery };
  const categoriesQuery = useCatalogCategories();
  const featuredQuery = useFeaturedCatalog();
  const productsQuery = useCatalogProducts(queryFilters);

  const categories = categoriesQuery.data ?? [];
  const activeCategory = getCategoryBySlugFromList(categories, filters.category);
  const results = productsQuery.data?.items ?? [];
  const pagination = productsQuery.data?.pagination;
  const showSpotlight = !hasActiveBrowseFilters(queryFilters);
  const spotlight = showSpotlight
    ? getSpotlightFromProducts(
        featuredQuery.data?.length ? featuredQuery.data : results,
        filters.category,
      )
    : null;
  const heading = getDiscoverHeading(
    { ...filters, q: debouncedQuery.trim() },
    activeCategory?.label ?? null,
  );

  const clearBrowse = () => {
    lastPushedQuery.current = "";
    setDraftQuery("");
    replaceFilters({
      ...DEFAULT_CATALOG_FILTERS,
      category: filters.category,
    });
  };

  const clearAll = () => {
    lastPushedQuery.current = "";
    setDraftQuery("");
    replaceFilters(DEFAULT_CATALOG_FILTERS);
  };

  const applySuggestion = (value: string) => {
    lastPushedQuery.current = value;
    setDraftQuery(value);
    patchFilters({ q: value, page: 1 });
  };

  const emptyKind = results.length
    ? null
    : filters.q || draftQuery
      ? "search"
      : filters.price || filters.rating || filters.type
        ? "filters"
        : filters.category
          ? "category"
          : "filters";

  const total = pagination?.total ?? results.length;
  const countLabel = `${total.toLocaleString("en-US")} ${
    total === 1 ? "product" : "products"
  }`;
  const catalogError =
    categoriesQuery.error ?? featuredQuery.error ?? productsQuery.error;
  const showGridSkeleton = productsQuery.isPending && !productsQuery.data;

  return (
    <div className="pb-20 sm:pb-28">
      <Container className="pt-10 sm:pt-16">
        <FadeInOnLoad>
          <p className="text-xs font-medium tracking-[0.18em] text-brand uppercase">
            Marketplace
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl tracking-tight text-balance sm:text-6xl">
            Discover something worth learning.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground sm:text-lg">
            An edited catalog of kits, courses, and tools from independent
            makers — search widely, then narrow with taste.
          </p>
          <div className="mt-8 sm:mt-10">
            <label htmlFor="discover-search" className="sr-only">
              Search products
            </label>
            <DiscoverSearch
              value={draftQuery}
              onChange={setDraftQuery}
              onClear={() => {
                lastPushedQuery.current = "";
                setDraftQuery("");
                patchFilters({ q: "", page: 1 });
              }}
            />
          </div>
        </FadeInOnLoad>
      </Container>

      {spotlight ? (
        <Container className="mt-14 sm:mt-20">
          <DiscoverFeatured
            spotlight={spotlight}
            categoryLabel={activeCategory?.label ?? null}
          />
        </Container>
      ) : null}

      <Container className="mt-14 sm:mt-20">
        <DiscoverCategories
          categories={categories}
          activeSlug={filters.category}
          onSelect={(slug) => patchFilters({ category: slug, page: 1 })}
        />

        <div className="mt-10 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              {heading.kicker}
            </p>
            <h2 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
              {heading.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{countLabel}</p>
            <DiscoverActiveFilters
              filters={filters}
              onChange={patchFilters}
              onClear={clearBrowse}
            />
          </div>
          <DiscoverFilters
            filters={filters}
            onChange={patchFilters}
            onClear={clearBrowse}
          />
        </div>

        {catalogError ? (
          <DiscoverError
            message={
              catalogError instanceof Error ? catalogError.message : undefined
            }
            onRetry={() => {
              void categoriesQuery.refetch();
              void featuredQuery.refetch();
              void productsQuery.refetch();
            }}
          />
        ) : showGridSkeleton ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : emptyKind && results.length === 0 ? (
          <DiscoverEmpty
            kind={emptyKind}
            query={draftQuery || filters.q}
            categoryLabel={activeCategory?.label}
            onClear={emptyKind === "category" ? clearAll : clearBrowse}
            onSuggestion={applySuggestion}
          />
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {pagination ? (
              <DiscoverPagination
                pagination={pagination}
                onPage={(page) => patchFilters({ page })}
              />
            ) : null}
          </>
        )}
      </Container>
    </div>
  );
}
