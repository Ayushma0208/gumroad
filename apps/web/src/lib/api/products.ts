import { remoteApiEnabled } from "@/lib/api/http";
import {
  fetchRemoteCategories,
  fetchRemoteProductBySlug,
  fetchRemoteProducts,
  mapApiProduct,
} from "@/lib/api/catalog";
import {
  categories,
  getEditorsPicks as getMockEditorsPicks,
  getFeaturedProducts as getMockFeaturedProducts,
  getProductBySlug as getMockProductBySlug,
  getTrendingProducts as getMockTrendingProducts,
  products,
} from "@/lib/mock/catalog";
import {
  getProductContent,
  getReviewsForProduct,
} from "@/lib/mock/product-details";
import { getRelatedProducts } from "@/lib/catalog/related";
import {
  getCatalogSpotlight,
  queryCatalog,
  type CatalogFilters,
  type CatalogSpotlight,
} from "@/lib/catalog/query";
import type {
  Category,
  IncludedItem,
  Product,
  ProductDetail,
} from "@/types/catalog";

/**
 * Catalog reads use Express `/api/v1` when NEXT_PUBLIC_USE_REMOTE_API
 * (or NEXT_PUBLIC_USE_REMOTE_AUTH) is true. Otherwise the mock catalog.
 */
export async function listProducts(): Promise<Product[]> {
  if (remoteApiEnabled()) {
    return fetchRemoteProducts();
  }
  return products;
}

export async function listCategories(): Promise<Category[]> {
  if (remoteApiEnabled()) {
    return fetchRemoteCategories();
  }
  return categories;
}

export async function listFeaturedProducts(): Promise<Product[]> {
  if (remoteApiEnabled()) {
    return (await fetchRemoteProducts()).filter((product) => product.featured);
  }
  return getMockFeaturedProducts();
}

export async function listTrendingProducts(): Promise<Product[]> {
  if (remoteApiEnabled()) {
    return (await fetchRemoteProducts()).filter((product) => product.trending);
  }
  return getMockTrendingProducts();
}

export async function listEditorsPicks(): Promise<Product[]> {
  if (remoteApiEnabled()) {
    return (await fetchRemoteProducts()).filter((product) => product.editorsPick);
  }
  return getMockEditorsPicks();
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  if (remoteApiEnabled()) {
    const remote = await fetchRemoteProductBySlug(slug);
    if (!remote) return null;
    const product = mapApiProduct(remote);
    const images = [
      remote.coverImage,
      ...(remote.images ?? []).filter((url) => url !== remote.coverImage),
    ];
    return {
      ...hydrateProduct(product),
      images,
    };
  }
  const product = getMockProductBySlug(slug);
  if (!product) return null;
  return hydrateProduct(product);
}

export async function listRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const catalog = remoteApiEnabled() ? await fetchRemoteProducts() : products;
  return getRelatedProducts(product, catalog, limit);
}

export async function listProductSlugs(): Promise<string[]> {
  const catalog = remoteApiEnabled() ? await fetchRemoteProducts() : products;
  return catalog.map((product) => product.slug);
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

function hydrateProduct(product: Product): ProductDetail {
  const content = getProductContent(product.slug);
  const extras = content?.images ?? [];
  const images = [
    product.imageUrl,
    ...extras.filter((url) => url !== product.imageUrl),
  ];

  return {
    ...product,
    images,
    paragraphs: content?.paragraphs?.length
      ? content.paragraphs
      : [product.description],
    highlights: content?.highlights ?? [],
    audience: content?.audience ?? [],
    outcomes: content?.outcomes ?? [],
    includedItems: content?.includedItems ?? defaultIncludes(),
    reviews: getReviewsForProduct(product.id),
  };
}

function defaultIncludes(): IncludedItem[] {
  return [
    {
      id: "files",
      label: "Instant download",
      icon: "download",
      detail: "Files arrive in your library after checkout.",
    },
    {
      id: "lifetime",
      label: "Lifetime updates",
      icon: "refresh",
    },
  ];
}
