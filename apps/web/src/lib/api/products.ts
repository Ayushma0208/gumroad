import {
  categories,
  getEditorsPicks as getMockEditorsPicks,
  getFeaturedProducts as getMockFeaturedProducts,
  getProductBySlug as getMockProductBySlug,
  getTrendingProducts as getMockTrendingProducts,
  products,
} from "@/lib/mock/catalog";
import {
  getCatalogSpotlight,
  queryCatalog,
  type CatalogFilters,
  type CatalogSpotlight,
} from "@/lib/catalog/query";
import type { Category, Product } from "@/types/catalog";

/**
 * Catalog reads currently return structured mock data.
 * Swap these functions to `api("/products")` once the Express module is live.
 */
export async function listProducts(): Promise<Product[]> {
  return products;
}

export async function listCategories(): Promise<Category[]> {
  return categories;
}

export async function listFeaturedProducts(): Promise<Product[]> {
  return getMockFeaturedProducts();
}

export async function listTrendingProducts(): Promise<Product[]> {
  return getMockTrendingProducts();
}

export async function listEditorsPicks(): Promise<Product[]> {
  return getMockEditorsPicks();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return getMockProductBySlug(slug) ?? null;
}

export function searchCatalog(filters: CatalogFilters): Product[] {
  return queryCatalog(products, filters);
}

export function getSpotlight(category: string | null): CatalogSpotlight | null {
  return getCatalogSpotlight(products, category);
}

export function getCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string | null): Category | null {
  if (!slug) return null;
  return categories.find((category) => category.slug === slug) ?? null;
}
