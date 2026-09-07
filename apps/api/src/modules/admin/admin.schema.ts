import {
  AdminAuditAction,
  ProductStatus,
  ProductType,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  ReviewStatus,
  Role,
  UserStatus,
} from "@prisma/client";
import { z } from "zod";
import { analyticsRangeQuerySchema } from "../analytics/analytics.schema";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

export const adminAnalyticsQuerySchema = analyticsRangeQuerySchema;
export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  q: optionalString,
  role: z.enum(["CUSTOMER", "CREATOR", "ADMIN", "all"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "all"]).optional(),
  sort: z.enum(["newest", "oldest", "name"]).optional(),
});
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export const adminUserIdParamSchema = z.object({
  userId: z.string().min(1),
});

export const adminUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const adminCreatorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  q: optionalString,
  status: z.enum(["ACTIVE", "SUSPENDED", "all"]).optional(),
  sort: z.enum(["newest", "revenue", "products", "name"]).optional(),
});
export type AdminCreatorsQuery = z.infer<typeof adminCreatorsQuerySchema>;

export const adminCreatorIdParamSchema = z.object({
  creatorId: z.string().min(1),
});

export const adminProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  q: optionalString,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "all"]).optional(),
  productType: z
    .enum(["DIGITAL_DOWNLOAD", "COURSE", "TEMPLATE", "BUNDLE", "all"])
    .optional(),
  categoryId: optionalString,
  creatorId: optionalString,
  sort: z.enum(["newest", "oldest", "price", "title"]).optional(),
});
export type AdminProductsQuery = z.infer<typeof adminProductsQuerySchema>;

export const adminProductIdParamSchema = z.object({
  productId: z.string().min(1),
});

export const adminProductStatusSchema = z.object({
  status: z.nativeEnum(ProductStatus),
});

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  q: optionalString,
  status: z
    .enum(["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED", "all"])
    .optional(),
  sort: z.enum(["newest", "oldest", "amount"]).optional(),
});
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

export const adminOrderIdParamSchema = z.object({
  orderId: z.string().min(1),
});

export const adminCouponsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  q: optionalString,
  status: z.enum(["active", "inactive", "expired", "all"]).optional(),
});
export type AdminCouponsQuery = z.infer<typeof adminCouponsQuerySchema>;

export const adminReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  status: z
    .enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED", "all"])
    .optional(),
  targetType: z.enum(["PRODUCT", "REVIEW", "CREATOR", "all"]).optional(),
  reason: z
    .enum([
      "COPYRIGHT",
      "SPAM",
      "HARASSMENT",
      "MISLEADING",
      "INAPPROPRIATE",
      "OTHER",
      "all",
    ])
    .optional(),
});
export type AdminReportsQuery = z.infer<typeof adminReportsQuerySchema>;

export const adminReportIdParamSchema = z.object({
  reportId: z.string().min(1),
});

export const adminReportStatusSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  resolutionNote: z.string().trim().max(2000).optional(),
});

export const adminAuditQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(48).optional(),
  q: optionalString,
  action: z
    .preprocess(
      emptyToUndefined,
      z.union([z.nativeEnum(AdminAuditAction), z.literal("all")]).optional(),
    ),
  targetType: optionalString,
  adminId: optionalString,
});
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;

export const createReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().min(1),
  reason: z.nativeEnum(ReportReason),
  description: z.string().trim().max(2000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const adminCategoryBodySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  label: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().min(4).max(500),
  imageUrl: z.string().url().optional(),
  image: z.string().url().optional(),
  icon: z.string().trim().max(40).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

// Re-export enums used by controllers for typing
export type {
  ProductStatus,
  ProductType,
  ReportStatus,
  ReviewStatus,
  Role,
  UserStatus,
};
