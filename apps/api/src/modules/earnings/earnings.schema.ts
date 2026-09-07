import { z } from "zod";

export const earningsListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["PENDING", "AVAILABLE", "RESERVED", "PAID", "REVERSED"])
    .optional(),
  productId: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
});

export const payoutListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["REQUESTED", "PROCESSING", "PAID", "FAILED", "CANCELLED"])
    .optional(),
});

export const payoutIdParamSchema = z.object({
  payoutId: z.string().min(1),
});

export const requestPayoutSchema = z.object({
  amountCents: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export const upsertPayoutAccountSchema = z.object({
  accountHolderName: z.string().trim().min(2).max(120),
  accountHint: z.string().trim().max(64).optional().nullable(),
});

export const adminPayoutsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["REQUESTED", "PROCESSING", "PAID", "FAILED", "CANCELLED"])
    .optional(),
  creatorId: z.string().min(1).optional(),
});

export const adminPayoutStatusSchema = z.object({
  status: z.enum(["PROCESSING", "PAID", "FAILED", "CANCELLED"]),
  failureMessage: z.string().trim().max(500).optional(),
  providerPayoutId: z.string().trim().max(120).optional(),
});

export const adminPayoutAccountSchema = z.object({
  status: z.enum(["VERIFIED", "DISABLED"]),
});

export const adminEarningsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["PENDING", "AVAILABLE", "RESERVED", "PAID", "REVERSED"])
    .optional(),
  creatorId: z.string().min(1).optional(),
});
