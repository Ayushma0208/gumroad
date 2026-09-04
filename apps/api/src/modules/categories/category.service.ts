import { prisma } from "../../config/database";
import { badRequest, conflict, notFound } from "../../utils/app-error";
import { slugify } from "../../utils/slug";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.validation";

function toDto(category: {
  id: string;
  slug: string;
  label: string;
  description: string;
  imageUrl: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { products: number };
}) {
  return {
    id: category.id,
    name: category.label,
    label: category.label,
    slug: category.slug,
    description: category.description,
    image: category.imageUrl,
    imageUrl: category.imageUrl,
    icon: category.icon,
    productCount: category._count?.products ?? 0,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

const withCount = {
  _count: { select: { products: { where: { status: "PUBLISHED" as const } } } },
};

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: withCount,
  });
  return categories.map(toDto);
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: withCount,
  });
  if (!category) throw notFound("Category not found");
  return toDto(category);
}

export async function createCategory(input: CreateCategoryInput) {
  const name = (input.name ?? input.label ?? "").trim();
  const slug = input.slug ? slugify(input.slug) : slugify(name);
  const imageUrl = input.imageUrl ?? input.image;
  if (!imageUrl) {
    throw badRequest("An image URL is required.");
  }

  const [bySlug, byName] = await Promise.all([
    prisma.category.findUnique({ where: { slug } }),
    prisma.category.findFirst({ where: { label: { equals: name, mode: "insensitive" } } }),
  ]);
  if (bySlug || byName) {
    throw conflict("A category with that name or slug already exists.");
  }

  const category = await prisma.category.create({
    data: {
      slug,
      label: name,
      description: input.description,
      imageUrl,
      icon: input.icon ?? "design",
      sortOrder: input.sortOrder ?? 99,
    },
    include: withCount,
  });
  return toDto(category);
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw notFound("Category not found");

  const name = input.name ?? input.label;
  const slug = input.slug ? slugify(input.slug) : undefined;
  if (slug && slug !== existing.slug) {
    const taken = await prisma.category.findUnique({ where: { slug } });
    if (taken) throw conflict("A category with that slug already exists.");
  }
  if (name && name.toLowerCase() !== existing.label.toLowerCase()) {
    const taken = await prisma.category.findFirst({
      where: { label: { equals: name, mode: "insensitive" } },
    });
    if (taken) throw conflict("A category with that name already exists.");
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      label: name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl ?? input.image,
      icon: input.icon,
      sortOrder: input.sortOrder,
    },
    include: withCount,
  });
  return toDto(category);
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw notFound("Category not found");
  if (existing._count.products > 0) {
    throw conflict("Remove or recategorize products before deleting this category.");
  }
  await prisma.category.delete({ where: { id } });
  return { ok: true };
}
