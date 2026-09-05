import { ApiError } from "@/lib/api/client";
import { requestJson } from "@/lib/api/http";
import type {
  Category,
  CategoryIcon,
  Product,
  ProductType,
} from "@/types/catalog";
import type { PaginationMeta } from "@/types/catalog";

export type ApiCategory = {
  id: string;
  slug: string;
  name?: string;
  label?: string;
  description: string;
  image?: string;
  imageUrl?: string;
  icon: string;
  productCount: number;
};

export type ApiProduct = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  price?: number;
  priceCents?: number;
  currency: "USD" | "INR";
  productType: string;
  coverImage: string;
  isFeatured?: boolean;
  featured?: boolean;
  trending?: boolean;
  editorsPick?: boolean;
  createdAt: string;
  category: {
    id: string;
    slug: string;
    name?: string;
    label?: string;
  };
  creator: {
    id: string;
    storeName?: string;
    name?: string;
    slug: string;
    avatar?: string;
    avatarUrl?: string;
    headline?: string;
  };
  images?: string[];
    files?: { id: string; fileName: string; fileSize: number; mimeType: string; format?: string }[];
    fileCount?: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  updatedAt?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type PaginatedProducts = {
  items: Product[];
  pagination: PaginationMeta;
};

export function mapProductType(type: string): ProductType {
  if (type === "COURSE") return "course";
  if (type === "TEMPLATE") return "template";
  if (type === "BUNDLE") return "pack";
  return "kit";
}

export function toApiProductType(type: ProductType | null): string | undefined {
  if (!type) return undefined;
  if (type === "course") return "COURSE";
  if (type === "template") return "TEMPLATE";
  if (type === "pack") return "BUNDLE";
  return "DIGITAL_DOWNLOAD";
}

function mapIcon(icon: string): CategoryIcon {
  const allowed: CategoryIcon[] = [
    "design",
    "development",
    "ai",
    "business",
    "photography",
    "music",
    "education",
    "writing",
    "productivity",
  ];
  return allowed.includes(icon as CategoryIcon) ? (icon as CategoryIcon) : "design";
}

export function mapApiCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    slug: category.slug,
    label: category.label ?? category.name ?? category.slug,
    description: category.description,
    imageUrl: category.imageUrl ?? category.image ?? "",
    productCount: category.productCount,
    icon: mapIcon(category.icon),
  };
}

export function mapApiProduct(product: ApiProduct): Product {
  const priceCents =
    product.priceCents ?? Math.round((product.price ?? 0) * 100);
  const categoryLabel =
    product.category.label ?? product.category.name ?? product.category.slug;
  const creatorName =
    product.creator.storeName ?? product.creator.name ?? "Creator";

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.shortDescription,
    description: product.description,
    priceCents,
    currency: product.currency,
    imageUrl: product.coverImage,
    categorySlug: product.category.slug,
    categoryLabel,
    productType: mapProductType(product.productType),
    createdAt: product.createdAt.slice(0, 10),
    rating: product.rating,
    reviewCount: product.reviewCount,
    salesCount: product.salesCount,
    fileCount: product.fileCount,
    featured: product.isFeatured ?? product.featured,
    trending: product.trending,
    editorsPick: product.editorsPick,
    creator: {
      id: product.creator.id,
      name: creatorName,
      slug: product.creator.slug,
      avatarUrl: product.creator.avatar ?? product.creator.avatarUrl ?? "",
      headline: product.creator.headline,
    },
  };
}

export async function fetchRemoteCategories(): Promise<Category[]> {
  const data = await requestJson<{ categories: ApiCategory[] }>(
    "/api/v1/categories",
  );
  return data.categories.map(mapApiCategory);
}

export type ProductListParams = {
  search?: string;
  category?: string | null;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

export async function fetchRemoteProductPage(
  params: ProductListParams = {},
): Promise<PaginatedProducts> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.productType) query.set("productType", params.productType);
  if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
  if (params.minRating !== undefined) query.set("minRating", String(params.minRating));
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.size ? `?${query.toString()}` : "";
  const data = await requestJson<{
    items: ApiProduct[];
    pagination: PaginationMeta;
  }>(`/api/v1/products${suffix}`);
  return {
    items: data.items.map(mapApiProduct),
    pagination: data.pagination,
  };
}

export async function fetchRemoteProducts(): Promise<Product[]> {
  const page = await fetchRemoteProductPage({ limit: 48 });
  return page.items;
}

export async function fetchRemoteFeatured(): Promise<PaginatedProducts> {
  const data = await requestJson<{
    items: ApiProduct[];
    pagination: PaginationMeta;
  }>("/api/v1/products/featured?limit=8");
  return {
    items: data.items.map(mapApiProduct),
    pagination: data.pagination,
  };
}

export async function fetchRemoteTrending(): Promise<PaginatedProducts> {
  const data = await requestJson<{
    items: ApiProduct[];
    pagination: PaginationMeta;
  }>("/api/v1/products/trending?limit=8");
  return {
    items: data.items.map(mapApiProduct),
    pagination: data.pagination,
  };
}

export async function fetchRemoteProductBySlug(
  slug: string,
): Promise<ApiProduct | null> {
  try {
    const data = await requestJson<{ product: ApiProduct }>(
      `/api/v1/products/slug/${encodeURIComponent(slug)}`,
    );
    return data.product;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchRemoteRelated(productId: string): Promise<Product[]> {
  const data = await requestJson<{ items: ApiProduct[] }>(
    `/api/v1/products/${encodeURIComponent(productId)}/related`,
  );
  return data.items.map(mapApiProduct);
}
