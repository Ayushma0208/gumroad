"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRemoteCategories, fetchRemoteFeatured } from "@/lib/api/catalog";
import { searchCatalogPage } from "@/lib/api/products";
import type { CatalogFilters } from "@/lib/catalog/query";

export const catalogKeys = {
  categories: ["catalog", "categories"] as const,
  featured: ["catalog", "featured"] as const,
  products: (filters: CatalogFilters) => ["catalog", "products", filters] as const,
};

export function useCatalogCategories() {
  return useQuery({
    queryKey: catalogKeys.categories,
    queryFn: fetchRemoteCategories,
  });
}

export function useFeaturedCatalog() {
  return useQuery({
    queryKey: catalogKeys.featured,
    queryFn: async () => (await fetchRemoteFeatured()).items,
  });
}

export function useCatalogProducts(filters: CatalogFilters) {
  return useQuery({
    queryKey: catalogKeys.products(filters),
    queryFn: () => searchCatalogPage(filters),
    placeholderData: (previous) => previous,
  });
}
