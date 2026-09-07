import { requestJson } from "@/lib/api/http";
import type { PaginationMeta } from "@/types/catalog";

export type WishlistProduct = {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  shortDescription: string;
  price: number;
  priceCents: number;
  currency: "USD" | "INR";
  productType: string;
  available: boolean;
  status: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
  owned: boolean;
  creator: {
    storeName: string;
    slug: string;
    name: string;
    avatar: string | null;
  };
};

export type WishlistItem = {
  id: string;
  createdAt: string;
  product: WishlistProduct;
};

export type WishlistSort =
  | "recent"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "newest";

export function getWishlist(params: {
  page?: number;
  limit?: number;
  sort?: WishlistSort;
  search?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort) query.set("sort", params.sort);
  if (params.search) query.set("search", params.search);
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson<{ items: WishlistItem[]; pagination: PaginationMeta }>(
    `/api/v1/wishlist${suffix}`,
  );
}

export function getWishlistProductIds() {
  return requestJson<{ productIds: string[] }>("/api/v1/wishlist/ids");
}

export function getWishlistStatus(productIds: string[]) {
  if (productIds.length === 0) {
    return Promise.resolve({ statuses: {} as Record<string, boolean> });
  }
  const query = new URLSearchParams({
    productIds: productIds.join(","),
  });
  return requestJson<{ statuses: Record<string, boolean> }>(
    `/api/v1/wishlist/status?${query.toString()}`,
  );
}

export function checkWishlist(productId: string) {
  return requestJson<{ isWishlisted: boolean }>(
    `/api/v1/wishlist/check/${encodeURIComponent(productId)}`,
  );
}

export function addWishlistItem(productId: string) {
  return requestJson<{
    item: { id: string; productId: string; createdAt: string };
    created: boolean;
  }>("/api/v1/wishlist/items", {
    method: "POST",
    body: { productId },
  });
}

export function removeWishlistItem(productId: string) {
  return requestJson<{ ok: boolean; productId: string }>(
    `/api/v1/wishlist/items/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
}

export function clearWishlist() {
  return requestJson<{ ok: boolean; removed: number }>("/api/v1/wishlist", {
    method: "DELETE",
  });
}
