import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

export const analyticsRangeKeys = [
  "today",
  "7d",
  "30d",
  "90d",
  "this_month",
  "last_month",
  "this_year",
  "custom",
] as const;

export const analyticsRangeQuerySchema = z
  .object({
    range: z.enum(analyticsRangeKeys).optional(),
    from: z.preprocess(emptyToUndefined, z.string().optional()),
    to: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  .superRefine((value, ctx) => {
    const hasCustomDates = Boolean(value.from || value.to);
    if (value.range === "custom" && (!value.from || !value.to)) {
      ctx.addIssue({
        code: "custom",
        message: "Custom ranges require from and to (YYYY-MM-DD).",
        path: ["from"],
      });
    }
    if (hasCustomDates && !(value.from && value.to)) {
      ctx.addIssue({
        code: "custom",
        message: "Provide both from and to for a custom range.",
        path: ["from"],
      });
    }
  });

export type AnalyticsRangeQuery = z.infer<typeof analyticsRangeQuerySchema>;

export const productAnalyticsQuerySchema = analyticsRangeQuerySchema.extend({
  sort: z.enum(["revenue", "units", "orders", "newest"]).optional(),
  q: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
});

export type ProductAnalyticsQuery = z.infer<typeof productAnalyticsQuerySchema>;

export const recentSalesQuerySchema = analyticsRangeQuerySchema.extend({
  limit: z.coerce.number().int().positive().max(50).optional(),
  status: z
    .enum(["all", "paid", "pending", "failed", "cancelled", "refunded"])
    .optional(),
});

export type RecentSalesQuery = z.infer<typeof recentSalesQuerySchema>;

export const productIdParamSchema = z.object({
  productId: z.string().min(1),
});
