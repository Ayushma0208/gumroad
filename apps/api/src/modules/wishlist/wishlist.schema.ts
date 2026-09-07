import { z } from "zod";

export const addWishlistItemSchema = z.object({
  productId: z.string().trim().min(1, "Product is required."),
});

export const wishlistProductParamSchema = z.object({
  productId: z.string().trim().min(1, "Product is required."),
});

export const wishlistStatusQuerySchema = z.object({
  productIds: z
    .string()
    .trim()
    .min(1, "productIds is required.")
    .transform((value) =>
      Array.from(
        new Set(
          value
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      ).slice(0, 100),
    )
    .refine((ids) => ids.length > 0, "Provide at least one product id."),
});

export const listWishlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  sort: z
    .enum(["recent", "oldest", "price_asc", "price_desc", "newest"])
    .optional()
    .default("recent"),
  search: z.string().trim().max(120).optional(),
});

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type ListWishlistQuery = z.infer<typeof listWishlistQuerySchema>;
export type WishlistStatusQuery = z.infer<typeof wishlistStatusQuerySchema>;
