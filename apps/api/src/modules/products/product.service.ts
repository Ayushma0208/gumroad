import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { conflict, forbidden, notFound } from "../../utils/app-error";
import { serializeProduct } from "./product.types";
import type { CreateProductInput, UpdateProductInput } from "./product.schema";

const productInclude = {
  category: true,
  creator: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  images: true,
  files: {
    select: { id: true, fileName: true, fileSize: true, mimeType: true },
  },
  reviews: { select: { rating: true } },
  _count: { select: { orderItems: true } },
} satisfies Prisma.ProductInclude;

export async function listPublishedProducts(filters: {
  category?: string;
  q?: string;
  featured?: boolean;
}) {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters.featured ? { featured: true } : {}),
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { shortDescription: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return products.map((product) => serializeProduct(product));
}

export async function getPublishedProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: productInclude,
  });
  if (!product) {
    throw notFound("Product not found");
  }
  return serializeProduct(product);
}

export async function createProduct(userId: string, input: CreateProductInput) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw forbidden("Create a store before publishing products.");
  }

  const slugTaken = await prisma.product.findUnique({ where: { slug: input.slug } });
  if (slugTaken) {
    throw conflict("A product with that URL already exists.");
  }

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw notFound("Category not found");
  }

  const product = await prisma.product.create({
    data: {
      creatorId: profile.id,
      categoryId: input.categoryId,
      title: input.title,
      slug: input.slug,
      shortDescription: input.shortDescription,
      description: input.description,
      price: input.price,
      currency: input.currency,
      productType: input.productType,
      status: input.status,
      coverImage: input.coverImage,
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

  return serializeProduct(product, { includeFiles: true });
}

export async function updateProduct(
  userId: string,
  productId: string,
  input: UpdateProductInput,
) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw forbidden();
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) {
    throw notFound("Product not found");
  }
  if (existing.creatorId !== profile.id) {
    throw forbidden();
  }

  if (input.slug && input.slug !== existing.slug) {
    const slugTaken = await prisma.product.findUnique({ where: { slug: input.slug } });
    if (slugTaken) {
      throw conflict("A product with that URL already exists.");
    }
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      title: input.title,
      slug: input.slug,
      shortDescription: input.shortDescription,
      description: input.description,
      categoryId: input.categoryId,
      price: input.price,
      currency: input.currency,
      productType: input.productType,
      status: input.status,
      coverImage: input.coverImage,
    },
    include: productInclude,
  });

  return serializeProduct(product, { includeFiles: true });
}
