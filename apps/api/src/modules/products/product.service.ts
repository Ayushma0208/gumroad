import type { Prisma, ProductStatus, ProductType, Role } from "@prisma/client";
import { prisma } from "../../config/database";
import { badRequest, conflict, forbidden, notFound } from "../../utils/app-error";
import {
  paginationMeta,
  parsePagination,
  skipTake,
} from "../../utils/pagination";
import { slugify } from "../../utils/slug";
import { serializeProduct } from "./product.types";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "./product.validation";

const productInclude = {
  category: true,
  creator: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  images: { orderBy: { sortOrder: "asc" as const } },
  files: {
    select: { id: true, fileName: true, fileSize: true, mimeType: true },
  },
  reviews: { select: { rating: true } },
  _count: { select: { orderItems: true } },
} satisfies Prisma.ProductInclude;

function normalizeSort(sort?: string) {
  if (sort === "price-asc") return "price_asc";
  if (sort === "price-desc") return "price_desc";
  return sort ?? "popular";
}

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
  if (role === "ADMIN") return;
  const profile = await requireProfile(userId);
  if (profile.id !== product.creatorId) {
    throw forbidden("You cannot change another creator’s product.");
  }
}

function publicWhere(filters: ListProductsQuery): Prisma.ProductWhereInput {
  const search = (filters.search ?? filters.q)?.trim();
  return {
    status: "PUBLISHED",
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
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { shortDescription: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function orderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
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

export async function listPublishedProducts(filters: ListProductsQuery) {
  const pagination = parsePagination(filters.page, filters.limit);
  const sort = normalizeSort(filters.sort);
  const where = publicWhere(filters);

  if (filters.minRating && filters.minRating > 0) {
    const candidates = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: orderBy(sort),
      take: 200,
    });
    const ranked = candidates.filter((product) => {
      const ratings = product.reviews.map((review) => review.rating);
      const rating =
        ratings.length === 0
          ? 0
          : ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
      return rating >= (filters.minRating ?? 0);
    });
    const total = ranked.length;
    const slice = ranked.slice(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit,
    );
    return {
      items: slice.map((product) => serializeProduct(product)),
      pagination: paginationMeta(pagination.page, pagination.limit, total),
    };
  }

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: orderBy(sort),
      ...skipTake(pagination),
    }),
  ]);

  return {
    items: products.map((product) => serializeProduct(product)),
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
      include: productInclude,
      orderBy: [{ createdAt: "desc" }],
      ...skipTake(pagination),
    }),
  ]);
  return {
    items: products.map((product) => serializeProduct(product)),
    pagination: paginationMeta(pagination.page, pagination.limit, total),
  };
}

function trendingScore(product: {
  createdAt: Date;
  reviews: { rating: number }[];
  _count?: { orderItems?: number };
}) {
  const sales = product._count?.orderItems ?? 0;
  const reviewCount = product.reviews.length;
  const rating =
    reviewCount === 0
      ? 0
      : product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;
  const ageDays = Math.max(
    1,
    (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const recency = 30 / ageDays;
  return sales * 4 + reviewCount * 2 + rating * 3 + recency;
}

export async function listTrendingProducts(page?: number, limit?: number) {
  const pagination = parsePagination(page, limit ?? 8);
  const candidates = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    include: productInclude,
    take: 80,
  });
  const ranked = [...candidates].sort(
    (a, b) => trendingScore(b) - trendingScore(a),
  );
  const total = ranked.length;
  const slice = ranked.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit,
  );
  return {
    items: slice.map((product) => serializeProduct(product)),
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
    include: productInclude,
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

  return ranked.slice(0, 4).map((item) => serializeProduct(item));
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
    assertPublishable(input.coverImage, input.title);
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
      images: input.images
        ? {
            create: input.images.map((image, index) => ({
              url: image.url,
              sortOrder: image.sortOrder ?? index,
            })),
          }
        : undefined,
    },
    include: productInclude,
  });

  return serializeProduct(product, { includeFiles: true, includeStatus: true });
}

function assertPublishable(coverImage: string, title: string) {
  if (!coverImage || !title.trim()) {
    throw badRequest("A published product needs a title and cover image.");
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
      assertPublishable(input.coverImage ?? existing.coverImage, input.title ?? existing.title);
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
      images: input.images
        ? {
            create: input.images.map((image, index) => ({
              url: image.url,
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
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) throw notFound("Product not found");
  await assertCanManage(userId, role, existing);
  await prisma.product.delete({ where: { id: productId } });
  return { ok: true };
}
