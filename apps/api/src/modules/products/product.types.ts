import type { Category, CreatorProfile, Product, User } from "@prisma/client";
import { prisma } from "../../config/database";

export type ProductRecord = Product & {
  category: Pick<Category, "id" | "slug" | "label"> | Category;
  creator: (Pick<
    CreatorProfile,
    "id" | "storeName" | "slug" | "displayName" | "avatar" | "bio"
  > & { user: Pick<User, "id" | "name" | "avatarUrl"> }) | (CreatorProfile & {
    user: Pick<User, "id" | "name" | "avatarUrl">;
  });
  images: { url: string; sortOrder: number }[];
  files?: { id: string; fileName: string; fileSize: number; mimeType: string; format?: string }[];
  reviews?: { rating: number }[];
  _count?: { orderItems?: number; files?: number };
};

export type ReviewStat = { rating: number; reviewCount: number };

export async function loadReviewStatsForProducts(productIds: string[]) {
  const map = new Map<string, ReviewStat>();
  if (productIds.length === 0) return map;

  const rows = await prisma.review.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      status: "PUBLISHED",
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  for (const row of rows) {
    const avg = row._avg.rating ?? 0;
    map.set(row.productId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: row._count._all,
    });
  }
  return map;
}

function ratingFromProduct(
  product: ProductRecord,
  stats?: ReviewStat,
): ReviewStat {
  if (stats) return stats;
  const ratings = (product.reviews ?? []).map((review) => review.rating);
  if (ratings.length === 0) return { rating: 0, reviewCount: 0 };
  return {
    rating:
      Math.round(
        (ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10,
      ) / 10,
    reviewCount: ratings.length,
  };
}

export function serializeProduct(
  product: ProductRecord,
  options: {
    includeFiles?: boolean;
    includeStatus?: boolean;
    /** Omit full description for list/card payloads */
    list?: boolean;
    reviewStats?: ReviewStat;
  } = {},
) {
  const { rating, reviewCount } = ratingFromProduct(product, options.reviewStats);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: options.list ? "" : product.description,
    price: Number((product.price / 100).toFixed(2)),
    priceCents: product.price,
    currency: product.currency,
    productType: product.productType,
    coverImage: product.coverImage,
    isFeatured: product.featured,
    featured: product.featured,
    trending: product.trending,
    editorsPick: product.editorsPick,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    ...(options.includeStatus ? { status: product.status } : {}),
    creator: {
      id: product.creator.id,
      storeName: product.creator.storeName,
      slug: product.creator.slug,
      avatar: product.creator.avatar ?? product.creator.user.avatarUrl ?? "",
      name: product.creator.displayName,
      avatarUrl: product.creator.avatar ?? product.creator.user.avatarUrl ?? "",
      headline: product.creator.bio,
    },
    category: {
      id: product.category.id,
      name: product.category.label,
      slug: product.category.slug,
      label: product.category.label,
    },
    images: product.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => image.url),
    rating,
    reviewCount,
    salesCount: product._count?.orderItems ?? 0,
    fileCount: product._count?.files ?? product.files?.length ?? 0,
    files: options.includeFiles
      ? (product.files ?? []).map((file) => ({
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          format: file.format,
        }))
      : undefined,
  };
}

export type MarketplaceProduct = ReturnType<typeof serializeProduct>;

export async function serializeProductList(products: ProductRecord[]) {
  const stats = await loadReviewStatsForProducts(products.map((p) => p.id));
  return products.map((product) =>
    serializeProduct(product, {
      list: true,
      reviewStats: stats.get(product.id),
    }),
  );
}
