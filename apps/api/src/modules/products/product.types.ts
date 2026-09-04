import type { Category, CreatorProfile, Product, User } from "@prisma/client";

export type ProductWithRelations = Product & {
  category: Category;
  creator: CreatorProfile & { user: Pick<User, "id" | "name" | "avatarUrl"> };
  images: { url: string; sortOrder: number }[];
  files: { id: string; fileName: string; fileSize: number; mimeType: string }[];
  _count: { reviews: true } | { reviews: number };
  reviews?: { rating: number }[];
};

export function serializeProduct(
  product: Product & {
    category: Category;
    creator: CreatorProfile & { user: Pick<User, "id" | "name" | "avatarUrl"> };
    images: { url: string; sortOrder: number }[];
    files?: { id: string; fileName: string; fileSize: number; mimeType: string }[];
    reviews: { rating: number }[];
    _count?: { orderItems?: number };
  },
  options: { includeFiles?: boolean } = {},
) {
  const ratings = product.reviews.map((review) => review.rating);
  const rating =
    ratings.length === 0
      ? 0
      : Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) /
        10;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.price,
    currency: product.currency,
    productType: product.productType,
    status: product.status,
    coverImage: product.coverImage,
    featured: product.featured,
    trending: product.trending,
    editorsPick: product.editorsPick,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    category: {
      id: product.category.id,
      slug: product.category.slug,
      label: product.category.label,
    },
    creator: {
      id: product.creator.id,
      name: product.creator.displayName,
      slug: product.creator.slug,
      avatarUrl: product.creator.avatar ?? product.creator.user.avatarUrl ?? "",
      headline: product.creator.bio,
    },
    images: product.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => image.url),
    rating,
    reviewCount: ratings.length,
    salesCount: product._count?.orderItems ?? 0,
    files: options.includeFiles
      ? (product.files ?? []).map((file) => ({
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
        }))
      : undefined,
  };
}
