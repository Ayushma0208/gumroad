import { ProductStatus, ProductType, Currency } from "@prisma/client";
import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().trim().min(3),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().min(8).max(160),
  description: z.string().trim().min(20),
  categoryId: z.string().min(1),
  price: z.number().int().min(0),
  currency: z.nativeEnum(Currency).default(Currency.USD),
  productType: z.nativeEnum(ProductType),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  coverImage: z.string().min(1),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
