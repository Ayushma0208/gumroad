import { z } from "zod";

export const couponCodeSchema = z
  .string()
  .trim()
  .min(1, "Coupon code is required.")
  .max(32, "Use at most 32 characters.")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Use letters, numbers, hyphens, or underscores only.",
  )
  .transform((value) => value.toUpperCase());

export const createCouponSchema = z
  .object({
    code: couponCodeSchema,
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().int().positive("Value must be greater than 0."),
    maxDiscount: z.number().int().positive().nullable().optional(),
    minOrderAmount: z.number().int().min(0).nullable().optional(),
    maxUses: z.number().int().min(1).nullable().optional(),
    perUserLimit: z.number().int().min(1).nullable().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().optional().default(true),
    productIds: z.array(z.string().trim().min(1)).max(100).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENTAGE" && (data.value < 1 || data.value > 100)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage must be between 1 and 100.",
      });
    }
    if (data.type === "FIXED" && data.maxDiscount != null) {
      ctx.addIssue({
        code: "custom",
        path: ["maxDiscount"],
        message: "Maximum discount applies to percentage coupons only.",
      });
    }
    if (
      data.startsAt &&
      data.expiresAt &&
      data.expiresAt.getTime() <= data.startsAt.getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expiry must be after the start date.",
      });
    }
  });

export const updateCouponSchema = z
  .object({
    code: couponCodeSchema.optional(),
    type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    value: z.number().int().positive("Value must be greater than 0.").optional(),
    maxDiscount: z.number().int().positive().nullable().optional(),
    minOrderAmount: z.number().int().min(0).nullable().optional(),
    maxUses: z.number().int().min(1).nullable().optional(),
    perUserLimit: z.number().int().min(1).nullable().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().optional(),
    productIds: z.array(z.string().trim().min(1)).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === "PERCENTAGE" &&
      data.value !== undefined &&
      (data.value < 1 || data.value > 100)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage must be between 1 and 100.",
      });
    }
    if (
      data.startsAt &&
      data.expiresAt &&
      data.expiresAt.getTime() <= data.startsAt.getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expiry must be after the start date.",
      });
    }
  });

export const couponIdParamSchema = z.object({
  couponId: z.string().trim().min(1),
});

export const listCreatorCouponsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  status: z.enum(["all", "active", "scheduled", "expired", "inactive"]).optional(),
});

export const checkoutCouponSchema = z.preprocess(
  (value) => (value == null || typeof value !== "object" ? {} : value),
  z.object({
    couponCode: z
      .string()
      .trim()
      .max(32)
      .optional()
      .transform((value) => {
        if (!value) return undefined;
        const normalized = value.trim().toUpperCase();
        return normalized.length > 0 ? normalized : undefined;
      }),
  }),
);

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ListCreatorCouponsQuery = z.infer<typeof listCreatorCouponsQuerySchema>;
export type CheckoutCouponInput = z.infer<typeof checkoutCouponSchema>;
