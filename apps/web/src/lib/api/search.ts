import { requestJson } from "@/lib/api/http";
import { mapApiProduct, type ApiProduct } from "@/lib/api/catalog";
import type { PaginationMeta, Product } from "@/types/catalog";

export type SearchSuggestProduct = {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  priceCents: number;
  currency: "USD" | "INR";
  creatorName: string;
  creatorSlug: string;
  href: string;
};

export type SearchSuggestCreator = {
  id: string;
  storeName: string;
  displayName: string;
  slug: string;
  avatar: string | null;
  productCount: number;
  href: string;
};

export type SearchSuggestCategory = {
  id: string;
  label: string;
  slug: string;
  icon: string;
  productCount: number;
  href: string;
};

export type SearchSuggestions = {
  query: string;
  products: SearchSuggestProduct[];
  creators: SearchSuggestCreator[];
  categories: SearchSuggestCategory[];
};

export type MarketplaceSearchResult = {
  query: string;
  products: Product[];
  creators: SearchSuggestCreator[];
  categories: SearchSuggestCategory[];
  pagination: PaginationMeta;
};

export async function fetchSearchSuggestions(q: string, limit = 5) {
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("limit", String(limit));
  return requestJson<SearchSuggestions>(
    `/api/v1/search/suggest?${params.toString()}`,
  );
}

export async function fetchMarketplaceSearch(params: {
  q?: string;
  category?: string | null;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<MarketplaceSearchResult> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.productType) search.set("productType", params.productType);
  if (params.minPrice !== undefined) search.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) search.set("maxPrice", String(params.maxPrice));
  if (params.minRating !== undefined) search.set("minRating", String(params.minRating));
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const data = await requestJson<{
    query: string;
    products: ApiProduct[];
    creators: SearchSuggestCreator[];
    categories: SearchSuggestCategory[];
    pagination: PaginationMeta;
  }>(`/api/v1/search?${search.toString()}`);

  return {
    query: data.query,
    products: data.products.map(mapApiProduct),
    creators: data.creators,
    categories: data.categories,
    pagination: data.pagination,
  };
}
