import { Currency, ProductStatus, ProductType } from "@prisma/client";
import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  shortDescription: z.string().trim().min(8).max(160),
  description: z.string().trim().min(20).max(20_000),
  categoryId: z.string().min(1, "Pick a category."),
  price: z.number().int().min(0, "Price cannot be negative."),
  currency: z.nativeEnum(Currency).default(Currency.USD),
  productType: z.nativeEnum(ProductType, {
    message: "Product type is invalid.",
  }),
  status: z.nativeEnum(ProductStatus).optional(),
  coverImage: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (value) =>
        value === "" ||
        /^https?:\/\//i.test(value) ||
        value.startsWith("/") ||
        value.startsWith("data:"),
      "Cover image must be a valid URL.",
    )
    .optional()
    .default(""),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .max(12)
    .optional(),
  featured: z.boolean().optional(),
  creatorId: z.string().min(1).optional(),
});

export const updateProductSchema = createProductSchema.partial();

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalInt = (min: number, max?: number) =>
  z.preprocess((value) => {
    if (emptyToUndefined(value) === undefined) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int().min(min).max(max ?? Number.MAX_SAFE_INTEGER).optional());

export const listProductsQuerySchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  category: z.preprocess(emptyToUndefined, z.string().optional()),
  productType: z.preprocess(
    emptyToUndefined,
    z.nativeEnum(ProductType).optional(),
  ),
  minPrice: optionalInt(0),
  maxPrice: optionalInt(0),
  minRating: z.preprocess((value) => {
    if (emptyToUndefined(value) === undefined) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().min(0).max(5).optional()),
  status: z.preprocess(emptyToUndefined, z.nativeEnum(ProductStatus).optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z
      .enum([
        "popular",
        "newest",
        "price_asc",
        "price_desc",
        "rating",
        "price-asc",
        "price-desc",
      ])
      .optional(),
  ),
  page: optionalInt(1),
  limit: optionalInt(1, 48),
});

export const paginationQuerySchema = z.object({
  page: optionalInt(1),
  limit: optionalInt(1, 48),
});

export const myProductsQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, z.nativeEnum(ProductStatus).optional()),
  page: optionalInt(1),
  limit: optionalInt(1, 48),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
