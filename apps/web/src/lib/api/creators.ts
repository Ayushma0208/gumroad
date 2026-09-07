import { ApiError } from "@/lib/api/client";
import {
  mapApiProduct,
  type ApiProduct,
} from "@/lib/api/catalog";
import { requestJson } from "@/lib/api/http";
import type { PaginationMeta, Product } from "@/types/catalog";
import type { CreatorStorePayload } from "@/types/catalog";

export type CreatorProductsPage = {
  items: Product[];
  pagination: PaginationMeta;
};

export type CreatorSort = "featured" | "newest" | "price_asc" | "price_desc";

export type UpdateCreatorProfileInput = {
  displayName?: string;
  storeName?: string;
  slug?: string;
  bio?: string;
  description?: string | null;
  website?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  github?: string | null;
};

export async function getCreatorBySlug(
  slug: string,
): Promise<CreatorStorePayload | null> {
  try {
    return await requestJson<CreatorStorePayload>(
      `/api/v1/creators/${encodeURIComponent(slug)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getCreatorProducts(
  slug: string,
  params: {
    sort?: CreatorSort;
    page?: number;
    limit?: number;
    featured?: boolean;
  } = {},
): Promise<CreatorProductsPage> {
  const query = new URLSearchParams();
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.featured) query.set("featured", "true");
  const suffix = query.size ? `?${query.toString()}` : "";
  const data = await requestJson<{
    items: ApiProduct[];
    pagination: PaginationMeta;
  }>(`/api/v1/creators/${encodeURIComponent(slug)}/products${suffix}`);
  return {
    items: data.items.map(mapApiProduct),
    pagination: data.pagination,
  };
}

export async function listCreators(params: { limit?: number; exclude?: string } = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.exclude) query.set("exclude", params.exclude);
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson<{ items: CreatorStorePayload[] }>(`/api/v1/creators${suffix}`);
}

export async function getMyCreator() {
  return requestJson<CreatorStorePayload>("/api/v1/creators/me");
}

export async function updateCreatorProfile(input: UpdateCreatorProfileInput) {
  return requestJson<CreatorStorePayload & { user?: unknown }>(
    "/api/v1/creators/me",
    { method: "PATCH", body: input },
  );
}

export async function checkCreatorSlug(slug: string) {
  const params = new URLSearchParams({ slug });
  return requestJson<{ slug: string; available: boolean }>(
    `/api/v1/creators/slug/check?${params.toString()}`,
  );
}

export function toCatalogCreator(payload: CreatorStorePayload) {
  const { creator, stats } = payload;
  return {
    id: creator.id,
    name: creator.storeName,
    slug: creator.slug,
    avatarUrl: creator.avatar ?? "",
    headline: creator.bio,
    coverUrl: creator.banner ?? creator.avatar ?? "",
    bio: creator.description || creator.bio,
    storeName: creator.storeName,
    productCount: stats.productCount,
    followerCount: 0,
  };
}

export function getCreatorProfile(slug: string) {
  return getCreatorBySlug(slug);
}

export function profileFromSummary(
  creator: { id: string; name: string; slug: string; avatarUrl: string; headline?: string },
  productCount: number,
) {
  return {
    ...creator,
    coverUrl: creator.avatarUrl,
    bio: creator.headline ?? "Independent creator on Lumen.",
    storeName: creator.name,
    productCount,
    followerCount: 0,
  };
}
