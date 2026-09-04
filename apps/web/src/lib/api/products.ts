import { ApiError } from "@/lib/api/client";
import {
  fetchRemoteCategories,
  fetchRemoteFeatured,
  fetchRemoteProductBySlug,
  fetchRemoteProductPage,
  fetchRemoteProducts,
  fetchRemoteRelated,
  fetchRemoteTrending,
  mapApiProduct,
  toApiProductType,
  type ProductListParams,
} from "@/lib/api/catalog";
import {
  categories as mockCategories,
  getEditorsPicks as getMockEditorsPicks,
  getFeaturedProducts as getMockFeaturedProducts,
  getProductBySlug as getMockProductBySlug,
  getTrendingProducts as getMockTrendingProducts,
  products as mockProducts,
} from "@/lib/mock/catalog";
import {
  getProductContent,
  getReviewsForProduct,
} from "@/lib/mock/product-details";
import { getRelatedProducts } from "@/lib/catalog/related";
import {
  getCatalogSpotlight,
  type CatalogFilters,
  type CatalogSpotlight,
} from "@/lib/catalog/query";
import type {
  Category,
  IncludedItem,
  PaginationMeta,
  Product,
  ProductDetail,
} from "@/types/catalog";

function isUnavailable(error: unknown) {
  return !(error instanceof ApiError) || error.status >= 500;
}

export async function listProducts(): Promise<Product[]> {
  try {
    return await fetchRemoteProducts();
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    return mockProducts;
  }
}

export async function listCategories(): Promise<Category[]> {
  try {
    return await fetchRemoteCategories();
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    return mockCategories;
  }
}

export async function listFeaturedProducts(): Promise<Product[]> {
  try {
    return (await fetchRemoteFeatured()).items;
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    return getMockFeaturedProducts();
  }
}

export async function listTrendingProducts(): Promise<Product[]> {
  try {
    return (await fetchRemoteTrending()).items;
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    return getMockTrendingProducts();
  }
}

export async function listEditorsPicks(): Promise<Product[]> {
  try {
    const featured = await fetchRemoteFeatured();
    return featured.items.filter((product) => product.editorsPick);
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    return getMockEditorsPicks();
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  try {
    const remote = await fetchRemoteProductBySlug(slug);
    if (!remote) return null;
    const product = mapApiProduct(remote);
    const images = [
      remote.coverImage,
      ...(remote.images ?? []).filter((url) => url !== remote.coverImage),
    ];
    return {
      ...hydrateProduct(product, { useMockReviews: false }),
      images,
    };
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    const product = getMockProductBySlug(slug);
    if (!product) return null;
    return hydrateProduct(product);
  }
}

export async function listRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  try {
    const related = await fetchRemoteRelated(product.id);
    return related.slice(0, limit);
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    return getRelatedProducts(product, mockProducts, limit);
  }
}

export async function listProductSlugs(): Promise<string[]> {
  try {
    const page = await fetchRemoteProductPage({ limit: 48 });
    return page.items.map((product) => product.slug);
  } catch {
    return mockProducts.map((product) => product.slug);
  }
}

export async function searchCatalogPage(
  filters: CatalogFilters,
): Promise<{ items: Product[]; pagination: PaginationMeta }> {
  const priceRange = priceBounds(filters.price);
  const params: ProductListParams = {
    search: filters.q.trim() || undefined,
    category: filters.category,
    productType: toApiProductType(filters.type),
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    minRating: filters.rating ? Number(filters.rating) : undefined,
    sort: filters.sort === "price-asc" ? "price_asc" : filters.sort === "price-desc" ? "price_desc" : filters.sort,
    page: filters.page,
    limit: 12,
  };
  return fetchRemoteProductPage(params);
}

export function getSpotlightFromProducts(
  products: Product[],
  category: string | null,
): CatalogSpotlight | null {
  return getCatalogSpotlight(products, category);
}

export function getCategoryBySlugFromList(
  categories: Category[],
  slug: string | null,
): Category | null {
  if (!slug) return null;
  return categories.find((category) => category.slug === slug) ?? null;
}

export function getCategories(): Category[] {
  return mockCategories;
}

export function getCategoryBySlug(slug: string | null): Category | null {
  return getCategoryBySlugFromList(mockCategories, slug);
}

function priceBounds(price: CatalogFilters["price"]): {
  min?: number;
  max?: number;
} {
  if (price === "under-30") return { max: 2999 };
  if (price === "30-70") return { min: 3000, max: 7000 };
  if (price === "70-plus") return { min: 7001 };
  return {};
}

function hydrateProduct(
  product: Product,
  options: { useMockReviews?: boolean } = {},
): ProductDetail {
  const content = getProductContent(product.slug);
  const extras = content?.images ?? [];
  const images = [
    product.imageUrl,
    ...extras.filter((url) => url !== product.imageUrl),
  ];
  const useMockReviews = options.useMockReviews !== false;

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
    reviews: useMockReviews ? getReviewsForProduct(product.id) : [],
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
