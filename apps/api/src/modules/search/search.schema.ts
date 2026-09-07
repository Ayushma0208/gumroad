import { ProductType } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalInt = (min: number, max?: number) =>
  z.preprocess((value) => {
    if (emptyToUndefined(value) === undefined) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int().min(min).max(max ?? Number.MAX_SAFE_INTEGER).optional());

export const searchQuerySchema = z
  .object({
    q: z.preprocess(
      (value) => {
        if (typeof value !== "string") return emptyToUndefined(value);
        return value.trim().replace(/\s+/g, " ").slice(0, 120) || undefined;
      },
      z.string().min(1).max(120).optional(),
    ),
    search: z.preprocess(
      (value) => {
        if (typeof value !== "string") return emptyToUndefined(value);
        return value.trim().replace(/\s+/g, " ").slice(0, 120) || undefined;
      },
      z.string().min(1).max(120).optional(),
    ),
    category: z.preprocess(emptyToUndefined, z.string().max(80).optional()),
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
    sort: z.preprocess(
      emptyToUndefined,
      z
        .enum([
          "relevance",
          "popular",
          "newest",
          "featured",
          "trending",
          "rating",
          "price_asc",
          "price_desc",
          "price-asc",
          "price-desc",
        ])
        .optional(),
    ),
    creator: z.preprocess(emptyToUndefined, z.string().max(80).optional()),
    page: optionalInt(1),
    limit: optionalInt(1, 48),
  })
  .superRefine((value, ctx) => {
    if (
      value.minPrice !== undefined &&
      value.maxPrice !== undefined &&
      value.minPrice > value.maxPrice
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["minPrice"],
        message: "minPrice cannot be greater than maxPrice.",
      });
    }
  });

export const suggestQuerySchema = z.object({
  q: z.preprocess(
    (value) => {
      if (typeof value !== "string") return "";
      return value.trim().replace(/\s+/g, " ").slice(0, 80);
    },
    z.string().max(80),
  ),
  limit: optionalInt(1, 8),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SuggestQuery = z.infer<typeof suggestQuerySchema>;
