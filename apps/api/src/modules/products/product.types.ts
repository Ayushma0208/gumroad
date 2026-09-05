import type { Category, CreatorProfile, Product, User } from "@prisma/client";

export type ProductRecord = Product & {
  category: Category;
  creator: CreatorProfile & { user: Pick<User, "id" | "name" | "avatarUrl"> };
  images: { url: string; sortOrder: number }[];
  files?: { id: string; fileName: string; fileSize: number; mimeType: string; format?: string }[];
  reviews: { rating: number }[];
  _count?: { orderItems?: number; files?: number };
};

export function serializeProduct(
  product: ProductRecord,
  options: { includeFiles?: boolean; includeStatus?: boolean } = {},
) {
  const ratings = product.reviews.map((review) => review.rating);
  const rating =
    ratings.length === 0
      ? 0
      : Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) /
        10;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
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
    reviewCount: ratings.length,
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
