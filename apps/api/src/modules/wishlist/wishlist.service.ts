import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { prisma } from "../../config/database";
import { badRequest, forbidden, notFound } from "../../utils/app-error";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import type { AddWishlistItemInput, ListWishlistQuery } from "./wishlist.schema";

const wishlistProductSelect = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  price: true,
  currency: true,
  productType: true,
  status: true,
  shortDescription: true,
  createdAt: true,
  creator: {
    select: {
      storeName: true,
      slug: true,
      displayName: true,
      avatar: true,
      user: { select: { id: true, avatarUrl: true } },
    },
  },
  reviews: {
    where: { status: "PUBLISHED" as const },
    select: { rating: true },
  },
} satisfies Prisma.ProductSelect;

type WishlistProduct = Prisma.ProductGetPayload<{
  select: typeof wishlistProductSelect;
}>;

function dollars(cents: number) {
  return Number((cents / 100).toFixed(2));
}

function serializeWishlistProduct(product: WishlistProduct, owned: boolean) {
  const ratings = product.reviews.map((review) => review.rating);
  const rating =
    ratings.length === 0
      ? 0
      : Math.round(
          (ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10,
        ) / 10;
  const available = product.status === "PUBLISHED";

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    coverImage: product.coverImage,
    shortDescription: product.shortDescription,
    price: dollars(product.price),
    priceCents: product.price,
    currency: product.currency,
    productType: product.productType,
    available,
    status: available ? "PUBLISHED" : product.status,
    createdAt: product.createdAt.toISOString(),
    rating,
    reviewCount: ratings.length,
    owned,
    creator: {
      storeName: product.creator.storeName,
      slug: product.creator.slug,
      name: product.creator.displayName,
      avatar: product.creator.avatar ?? product.creator.user.avatarUrl ?? null,
    },
  };
}

async function ownedProductIds(userId: string, productIds: string[]) {
  if (productIds.length === 0) return new Set<string>();
  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
      productId: { in: productIds },
      order: { status: "PAID" },
    },
    select: { productId: true },
  });
  return new Set(purchases.map((purchase) => purchase.productId));
}

export async function listWishlist(userId: string, query: ListWishlistQuery) {
  const pagination = parsePagination(query.page, query.limit);
  const search = query.search?.trim();

  const where: Prisma.WishlistItemWhereInput = {
    userId,
    ...(search
      ? {
          product: {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              {
                creator: {
                  OR: [
                    { storeName: { contains: search, mode: "insensitive" } },
                    { displayName: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            ],
          },
        }
      : {}),
  };

  let orderBy: Prisma.WishlistItemOrderByWithRelationInput[] = [
    { createdAt: "desc" },
  ];
  if (query.sort === "oldest") orderBy = [{ createdAt: "asc" }];
  if (query.sort === "price_asc") {
    orderBy = [{ product: { price: "asc" } }, { createdAt: "desc" }];
  }
  if (query.sort === "price_desc") {
    orderBy = [{ product: { price: "desc" } }, { createdAt: "desc" }];
  }
  if (query.sort === "newest") {
    orderBy = [{ product: { createdAt: "desc" } }, { createdAt: "desc" }];
  }

  const [total, rows] = await Promise.all([
    prisma.wishlistItem.count({ where }),
    prisma.wishlistItem.findMany({
      where,
      orderBy,
      ...skipTake(pagination),
      include: {
        product: { select: wishlistProductSelect },
      },
    }),
  ]);

  const owned = await ownedProductIds(
    userId,
    rows.map((row) => row.productId),
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      product: serializeWishlistProduct(row.product, owned.has(row.productId)),
    })),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function addWishlistItem(userId: string, input: AddWishlistItemInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { creator: { select: { userId: true } } },
  });
  if (!product) throw notFound("Product not found");
  if (product.status !== "PUBLISHED") {
    throw badRequest("This product is no longer available.");
  }
  if (product.creator.userId === userId) {
    throw forbidden("You cannot wishlist your own product.");
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId, productId: product.id },
    },
  });
  if (existing) {
    return {
      item: {
        id: existing.id,
        productId: existing.productId,
        createdAt: existing.createdAt.toISOString(),
      },
      created: false,
    };
  }

  try {
    const item = await prisma.wishlistItem.create({
      data: { userId, productId: product.id },
    });
    return {
      item: {
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt.toISOString(),
      },
      created: true,
    };
  } catch (error) {
    if (
      error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const race = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: { userId, productId: product.id },
        },
      });
      if (race) {
        return {
          item: {
            id: race.id,
            productId: race.productId,
            createdAt: race.createdAt.toISOString(),
          },
          created: false,
        };
      }
    }
    throw error;
  }
}

export async function removeWishlistItem(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  if (!existing) throw notFound("Wishlist item not found");
  await prisma.wishlistItem.delete({ where: { id: existing.id } });
  return { ok: true, productId };
}

export async function clearWishlist(userId: string) {
  const result = await prisma.wishlistItem.deleteMany({ where: { userId } });
  return { ok: true, removed: result.count };
}

export async function checkWishlistItem(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  return { isWishlisted: Boolean(existing) };
}

export async function wishlistStatus(userId: string, productIds: string[]) {
  if (productIds.length === 0) {
    return { statuses: {} as Record<string, boolean> };
  }
  const rows = await prisma.wishlistItem.findMany({
    where: { userId, productId: { in: productIds } },
    select: { productId: true },
  });
  const wishlisted = new Set(rows.map((row) => row.productId));
  const statuses: Record<string, boolean> = {};
  for (const id of productIds) {
    statuses[id] = wishlisted.has(id);
  }
  return { statuses };
}

export async function listWishlistProductIds(userId: string) {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
    orderBy: { createdAt: "desc" },
  });
  return { productIds: rows.map((row) => row.productId) };
}
