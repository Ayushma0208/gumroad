import { Prisma, type ProductStatus, type ProductType, type Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { badRequest, conflict, forbidden, notFound } from "../../utils/app-error";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import { slugify } from "../../utils/slug";
import { assertProductOwnership } from "../access/access.service";
import { destroyCloudinaryAsset } from "../../config/cloudinary";
import { logEvent } from "../../utils/logger";
import {
  loadReviewStatsForProducts,
  serializeProduct,
  serializeProductList,
} from "./product.types";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "./product.validation";

/** Full graph for product detail / studio manage. */
const productInclude = {
  category: true,
  creator: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  images: { orderBy: { sortOrder: "asc" as const } },
  files: {
    select: { id: true, fileName: true, fileSize: true, mimeType: true, format: true },
  },
  reviews: { where: { status: "PUBLISHED" as const }, select: { rating: true } },
  _count: {
    select: {
      files: true,
      orderItems: { where: { order: { status: "PAID" as const } } },
    },
  },
} satisfies Prisma.ProductInclude;

/** Slim graph for Discover / cards / search lists — no files, no review rows. */
export const productListInclude = {
  category: { select: { id: true, slug: true, label: true } },
  creator: {
    select: {
      id: true,
      storeName: true,
      slug: true,
      displayName: true,
      avatar: true,
      bio: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  },
  images: {
    orderBy: { sortOrder: "asc" as const },
    take: 4,
    select: { url: true, sortOrder: true },
  },
  _count: {
    select: {
      files: true,
      orderItems: { where: { order: { status: "PAID" as const } } },
    },
  },
} satisfies Prisma.ProductInclude;

export async function uniqueProductSlug(base: string, excludeId?: string) {
  const root = slugify(base);
  let candidate = root;
  let n = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
    if (n > 50) {
      candidate = `${root}-${Date.now().toString(36)}`;
      return candidate;
    }
  }
}

async function requireProfile(userId: string) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw forbidden("Create a store before managing products.");
  }
  return profile;
}

async function loadProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  if (!product) throw notFound("Product not found");
  return product;
}

export async function assertCanManage(
  userId: string,
  role: Role,
  product: { creatorId: string },
) {
  await assertProductOwnership(userId, role, product);
}

function normalizeSort(sort?: string) {
  if (sort === "price-asc") return "price_asc";
  if (sort === "price-desc") return "price_desc";
  if (sort === "relevance") return "popular";
  return sort ?? "popular";
}

function publicSearchOr(search: string): Prisma.ProductWhereInput[] {
  return [
    { title: { contains: search, mode: "insensitive" } },
    { slug: { contains: search, mode: "insensitive" } },
    { shortDescription: { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
    { creator: { storeName: { contains: search, mode: "insensitive" } } },
    { creator: { displayName: { contains: search, mode: "insensitive" } } },
    { creator: { slug: { contains: search, mode: "insensitive" } } },
    { category: { label: { contains: search, mode: "insensitive" } } },
    { category: { slug: { contains: search, mode: "insensitive" } } },
  ];
}

function publicWhere(filters: ListProductsQuery): Prisma.ProductWhereInput {
  const search = (filters.search ?? filters.q)?.trim();
  return {
    status: "PUBLISHED",
    ...(filters.creatorSlug ? { creator: { slug: filters.creatorSlug } } : {}),
    ...(filters.featured === true ? { featured: true } : {}),
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    ...(filters.productType ? { productType: filters.productType } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
    ...(search ? { OR: publicSearchOr(search) } : {}),
  };
}

function orderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "featured":
      return [{ featured: "desc" }, { createdAt: "desc" }];
    case "trending":
      return [
        { trending: "desc" },
        { orderItems: { _count: "desc" } },
        { createdAt: "desc" },
      ];
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "rating":
      return [{ reviews: { _count: "desc" } }, { createdAt: "desc" }];
    default:
      return [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }];
  }
}

async function productIdsMeetingMinRating(
  minRating: number,
  where: Prisma.ProductWhereInput,
) {
  const candidates = await prisma.product.findMany({
    where,
    select: { id: true },
    take: 2000,
  });
  if (candidates.length === 0) return [];

  const ids = candidates.map((row) => row.id);
  const rows = await prisma.$queryRaw<Array<{ productId: string }>>`
    SELECT "productId"
    FROM "Review"
    WHERE status = 'PUBLISHED'::"ReviewStatus"
      AND "productId" IN (${Prisma.join(ids)})
    GROUP BY "productId"
    HAVING AVG(rating) >= ${minRating}
  `;
  return rows.map((row) => row.productId);
}

export async function listPublishedProducts(filters: ListProductsQuery) {
  const pagination = parsePagination(filters.page, filters.limit);
  const sort = normalizeSort(filters.sort);
  let where = publicWhere(filters);

  if (filters.minRating && filters.minRating > 0) {
    const ids = await productIdsMeetingMinRating(filters.minRating, where);
    where = { ...where, id: { in: ids } };
    if (ids.length === 0) {
      return {
        items: [],
        pagination: paginationMeta(pagination.page, pagination.limit, 0),
      };
    }
  }

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productListInclude,
      orderBy: orderBy(sort),
      ...skipTake(pagination),
    }),
  ]);

  return {
    items: await serializeProductList(products),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function listFeaturedProducts(page?: number, limit?: number) {
  const pagination = parsePagination(page, limit ?? 8);
  const where: Prisma.ProductWhereInput = { status: "PUBLISHED", featured: true };
  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productListInclude,
      orderBy: [{ createdAt: "desc" }],
      ...skipTake(pagination),
    }),
  ]);
  return {
    items: await serializeProductList(products),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

function trendingScore(
  product: {
    createdAt: Date;
    _count?: { orderItems?: number };
  },
  review?: { rating: number; reviewCount: number },
) {
  const sales = product._count?.orderItems ?? 0;
  const reviewCount = review?.reviewCount ?? 0;
  const rating = review?.rating ?? 0;
  const ageDays = Math.max(
    1,
    (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const recency = 30 / ageDays;
  return sales * 4 + reviewCount * 2 + rating * 3 + recency;
}

export async function listTrendingProducts(page?: number, limit?: number) {
  const pagination = parsePagination(page, limit ?? 8);
  // Prefer curator-flagged trending, then paid sales velocity among published products.
  const flagged = await prisma.product.findMany({
    where: { status: "PUBLISHED", trending: true },
    include: productListInclude,
    orderBy: [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }],
    take: 40,
  });
  const need = Math.max(40, pagination.page * pagination.limit);
  let pool = flagged;
  if (pool.length < need) {
    const extra = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        ...(flagged.length
          ? { id: { notIn: flagged.map((product) => product.id) } }
          : {}),
      },
      include: productListInclude,
      orderBy: [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }],
      take: 80 - flagged.length,
    });
    pool = [...flagged, ...extra];
  }

  const stats = await loadReviewStatsForProducts(pool.map((p) => p.id));
  const ranked = [...pool].sort(
    (a, b) =>
      trendingScore(b, stats.get(b.id)) - trendingScore(a, stats.get(a.id)),
  );

  const total = ranked.length;
  const slice = ranked.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit,
  );
  return {
    items: await serializeProductList(slice),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function getPublishedProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: productInclude,
  });
  if (!product) throw notFound("Product not found");
  return serializeProduct(product);
}

export async function getProductByIdForViewer(
  id: string,
  viewer?: { id: string; role: Role },
) {
  const product = await loadProduct(id);
  if (product.status !== "PUBLISHED") {
    if (!viewer) throw notFound("Product not found");
    await assertCanManage(viewer.id, viewer.role, product);
    return serializeProduct(product, { includeFiles: true, includeStatus: true });
  }
  if (viewer) {
    try {
      await assertCanManage(viewer.id, viewer.role, product);
      return serializeProduct(product, { includeFiles: true, includeStatus: true });
    } catch {
      return serializeProduct(product);
    }
  }
  return serializeProduct(product);
}

export async function listRelatedProducts(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.status !== "PUBLISHED") {
    throw notFound("Product not found");
  }

  const candidates = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: id },
      OR: [
        { categoryId: product.categoryId },
        { creatorId: product.creatorId },
        { productType: product.productType },
        {
          price: {
            gte: Math.round(product.price * 0.5),
            lte: Math.round(product.price * 1.5) || product.price + 1000,
          },
        },
      ],
    },
    include: productListInclude,
    take: 24,
  });

  const ranked = [...candidates].sort((a, b) => {
    const score = (item: typeof a) =>
      Number(item.categoryId === product.categoryId) * 8 +
      Number(item.creatorId === product.creatorId) * 4 +
      Number(item.productType === product.productType) * 2 +
      (Math.abs(item.price - product.price) <= product.price * 0.35 ? 1 : 0);
    return score(b) - score(a);
  });

  return serializeProductList(ranked.slice(0, 4));
}

export async function listMyProducts(
  userId: string,
  role: Role,
  query: { status?: ProductStatus; page?: number; limit?: number },
) {
  const pagination = parsePagination(query.page, query.limit);
  const where: Prisma.ProductWhereInput =
    role === "ADMIN"
      ? { ...(query.status ? { status: query.status } : {}) }
      : {
          creator: { userId },
          ...(query.status ? { status: query.status } : {}),
        };

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { updatedAt: "desc" },
      ...skipTake(pagination),
    }),
  ]);

  return {
    items: products.map((product) =>
      serializeProduct(product, { includeFiles: true, includeStatus: true }),
    ),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

export async function createProduct(
  userId: string,
  role: Role,
  input: CreateProductInput,
) {
  const profile =
    role === "ADMIN" && input.creatorId
      ? await prisma.creatorProfile.findUnique({ where: { id: input.creatorId } })
      : role === "ADMIN"
        ? await prisma.creatorProfile.findUnique({ where: { userId } })
        : await requireProfile(userId);
  if (!profile) {
    throw forbidden("Create a store before publishing products.");
  }

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw notFound("Category not found");

  const slug = await uniqueProductSlug(input.slug || input.title);
  const status: ProductStatus =
    input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  if (status === "PUBLISHED") {
    await assertPublishable(input, 0);
  }

  const product = await prisma.product.create({
    data: {
      creatorId: profile.id,
      categoryId: input.categoryId,
      title: input.title,
      slug,
      shortDescription: input.shortDescription,
      description: input.description,
      price: input.price,
      currency: input.currency,
      productType: input.productType,
      status,
      coverImage: input.coverImage,
      featured: role === "ADMIN" ? Boolean(input.featured) : false,
      pageTemplateId: input.pageTemplateId ?? "classic",
      pageStyle:
        input.pageStyle === null
          ? Prisma.DbNull
          : (input.pageStyle ?? undefined),
      checkoutStyle: input.checkoutStyle ?? undefined,
      images: input.images
        ? {
            create: input.images.map((image, index) => ({
              url: image.url,
              publicId: `legacy/${slug}/${index}`,
              sortOrder: image.sortOrder ?? index,
            })),
          }
        : undefined,
    },
    include: productInclude,
  });

  return serializeProduct(product, { includeFiles: true, includeStatus: true });
}

function assertPublishable(
  input: {
    coverImage?: string;
    title?: string;
    description?: string;
    categoryId?: string;
    price?: number;
  },
  fileCount: number,
) {
  if (!input.title?.trim()) {
    throw badRequest("Cannot publish product. Add a title.");
  }
  if (!input.description?.trim()) {
    throw badRequest("Cannot publish product. Add a description.");
  }
  if (!input.categoryId) {
    throw badRequest("Cannot publish product. Pick a category.");
  }
  if (input.price === undefined || input.price < 0) {
    throw badRequest("Cannot publish product. Set a price.");
  }
  if (!input.coverImage?.trim()) {
    throw badRequest("Cannot publish product. Add a cover image.");
  }
  if (fileCount < 1) {
    throw badRequest("Cannot publish product. Add at least one downloadable file.");
  }
}

export async function updateProduct(
  userId: string,
  role: Role,
  productId: string,
  input: UpdateProductInput,
) {
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) throw notFound("Product not found");
  await assertCanManage(userId, role, existing);

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw notFound("Category not found");
  }

  let slug = input.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await uniqueProductSlug(input.slug, existing.id);
  } else if (input.title && !input.slug) {
    slug = existing.slug;
  }

  const nextStatus = input.status;
  if (nextStatus && nextStatus !== existing.status) {
    assertStatusTransition(existing.status, nextStatus);
    if (nextStatus === "PUBLISHED") {
      const fileCount = await prisma.productFile.count({ where: { productId } });
      assertPublishable(
        {
          coverImage: input.coverImage ?? existing.coverImage,
          title: input.title ?? existing.title,
          description: input.description ?? existing.description,
          categoryId: input.categoryId ?? existing.categoryId,
          price: input.price ?? existing.price,
        },
        fileCount,
      );
    }
  }

  if (input.images) {
    await prisma.productImage.deleteMany({ where: { productId } });
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      title: input.title,
      slug,
      shortDescription: input.shortDescription,
      description: input.description,
      categoryId: input.categoryId,
      price: input.price,
      currency: input.currency,
      productType: input.productType,
      status: nextStatus,
      coverImage: input.coverImage,
      featured: role === "ADMIN" ? input.featured : undefined,
      pageTemplateId: input.pageTemplateId,
      pageStyle:
        input.pageStyle === undefined
          ? undefined
          : input.pageStyle === null
            ? Prisma.DbNull
            : input.pageStyle,
      checkoutStyle: input.checkoutStyle,
      images: input.images
        ? {
            create: input.images.map((image, index) => ({
              url: image.url,
              publicId: `legacy/${slug}/${index}`,
              sortOrder: image.sortOrder ?? index,
            })),
          }
        : undefined,
    },
    include: productInclude,
  });

  return serializeProduct(product, { includeFiles: true, includeStatus: true });
}

function assertStatusTransition(from: ProductStatus, to: ProductStatus) {
  const allowed: Record<ProductStatus, ProductStatus[]> = {
    DRAFT: ["PUBLISHED", "ARCHIVED"],
    PUBLISHED: ["ARCHIVED", "DRAFT"],
    ARCHIVED: ["DRAFT", "PUBLISHED"],
  };
  if (!allowed[from].includes(to)) {
    throw badRequest("That status change is not allowed.");
  }
}

export async function publishProduct(userId: string, role: Role, productId: string) {
  return updateProduct(userId, role, productId, { status: "PUBLISHED" });
}

export async function archiveProduct(userId: string, role: Role, productId: string) {
  return updateProduct(userId, role, productId, { status: "ARCHIVED" });
}

export async function deleteProduct(userId: string, role: Role, productId: string) {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    include: { files: true, images: true },
  });
  if (!existing) throw notFound("Product not found");
  await assertCanManage(userId, role, existing);
  for (const file of existing.files) {
    await destroyCloudinaryAsset({
      publicId: file.publicId,
      resourceType: file.resourceType,
      type: file.isPrivate ? "authenticated" : "upload",
    }).catch((error) => {
      logEvent("cloudinary_cleanup_failed", {
        publicId: file.publicId,
        reason: error instanceof Error ? error.message : "unknown",
      });
    });
  }
  for (const image of existing.images) {
    if (!image.publicId) continue;
    await destroyCloudinaryAsset({
      publicId: image.publicId,
      resourceType: "image",
      type: "upload",
    }).catch((error) => {
      logEvent("cloudinary_cleanup_failed", {
        publicId: image.publicId,
        reason: error instanceof Error ? error.message : "unknown",
      });
    });
  }
  await prisma.product.delete({ where: { id: productId } });
  return { ok: true };
}
