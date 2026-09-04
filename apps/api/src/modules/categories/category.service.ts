import { prisma } from "../../config/database";
import { conflict } from "../../utils/app-error";
import type { CreateCategoryInput } from "./category.schema";

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    label: category.label,
    description: category.description,
    imageUrl: category.imageUrl,
    icon: category.icon,
    productCount: category._count.products,
  }));
}

export async function createCategory(input: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw conflict("A category with that slug already exists.");
  }
  return prisma.category.create({ data: input });
}
